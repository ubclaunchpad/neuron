import type {
  CreateInstructorInput,
  UpdateInstructorInput,
} from "@/models/api/instructor";
import type { ListUsersInput } from "@/models/api/user";
import { UserStatus } from "@/models/interfaces";
import type { ListResponse } from "@/models/list-response";
import { buildUser, type User } from "@/models/user";
import { type Drizzle } from "@/server/db";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { buildSimilarityExpression, getPagination } from "@/utils/searchUtils";
import { and, desc, eq, getTableColumns, gt, inArray, sql } from "drizzle-orm";
import { user } from "../../db/schema/user";

export interface IUserService {
  getUsersForRequest(listRequest: ListUsersInput): Promise<ListResponse<User>>;
  getInstructorsForRequest(
    listRequest: ListUsersInput,
  ): Promise<ListResponse<User>>;
  getUsers(ids: string[]): Promise<User[]>;
  getInstructor(id: string): Promise<User>;
  getUser(id: string): Promise<User>;
  verifyVolunteer(id: string): Promise<string>;
  rejectVolunteer(id: string): Promise<string>;
  deactivateUser(id: string): Promise<string>;
  getVerificationRequestCount(): Promise<number>;
  createUser(input: {
    name: string;
    lastName: string;
    email: string;
    role: string;
  }): Promise<User>;
  createInstructor(input: CreateInstructorInput): Promise<User>;
  updateInstructor(input: UpdateInstructorInput): Promise<User>;
  deleteInstructor(id: string): Promise<string>;
  inviteUser(): Promise<void>;
}

export class UserService implements IUserService {
  private readonly db: Drizzle;

  constructor({ db }: { db: Drizzle }) {
    this.db = db;
  }

  async getUsersForRequest(
    listRequest: ListUsersInput,
  ): Promise<ListResponse<User>> {
    const { perPage, offset, rolesToInclude, statusesToInclude } =
      getPagination(listRequest);
    const queryInput = listRequest.search?.trim();
    const hasQuery = !!queryInput;

    const similarity = hasQuery
      ? buildSimilarityExpression(
          [user.name, user.lastName, user.email],
          queryInput,
        )
      : undefined;

    const baseSelect = {
      totalRecords: sql<number>`count(*) over()`,
      ...getTableColumns(user),
    } as const;

    const selectShape = hasQuery
      ? { ...baseSelect, similarity: similarity! }
      : baseSelect;

    let builder = this.db.select(selectShape).from(user).$dynamic();

    if (hasQuery) {
      builder = builder.orderBy(desc(similarity!));
    }

    const whereConditions = [];

    if (hasQuery) {
      whereConditions.push(gt(similarity!, 0.4));
    }

    if (rolesToInclude && rolesToInclude.length > 0) {
      whereConditions.push(inArray(user.role, rolesToInclude));
    }

    if (statusesToInclude && statusesToInclude.length > 0) {
      whereConditions.push(inArray(user.status, statusesToInclude));
    }

    if (whereConditions.length > 0) {
      builder = builder.where(and(...whereConditions));
    }

    const rows = await builder.limit(perPage).offset(offset).execute();

    const total = rows[0]?.totalRecords ?? 0;
    const loadedSoFar = offset + rows.length;
    const nextCursor = loadedSoFar < total ? loadedSoFar : null;

    return {
      data: rows.map((d) => buildUser(d)),
      total,
      nextCursor,
    };
  }

  async getInstructorsForRequest(
    listRequest: ListUsersInput,
  ): Promise<ListResponse<User>> {
    return this.getUsersForRequest({
      ...listRequest,
      rolesToInclude: ["instructor"] as Array<"instructor">,
    });
  }

  async getUsers(ids: string[]): Promise<User[]> {
    const data = await this.db.select().from(user).where(inArray(user.id, ids));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(
        `Could not find User with id ${firstMissing}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    return data.map((d) => buildUser(d));
  }

  async getUser(id: string): Promise<User> {
    return await this.getUsers([id]).then(([user]) => user!);
  }

  async getInstructor(id: string): Promise<User> {
    const instructor = await this.getUser(id);

    if (instructor.role !== "instructor") {
      throw new NeuronError(
        `User with id ${id} is not an instructor`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    return instructor;
  }

  // any -> active
  async verifyVolunteer(id: string): Promise<string> {
    await this.db
      .update(user)
      .set({ status: UserStatus.active })
      .where(eq(user.id, id));
    return id;
  }

  // unverified -> rejected
  async rejectVolunteer(id: string): Promise<string> {
    const currentStatus = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .then(([user]) => user?.status);

    if (currentStatus !== UserStatus.unverified) {
      throw new NeuronError(
        `Volunteer with id ${id} is already verified. Cannot be rejected.`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
    await this.db
      .update(user)
      .set({ status: UserStatus.rejected })
      .where(eq(user.id, id));

    return id;
  }

  // active -> inactive
  async deactivateUser(id: string): Promise<string> {
    const currentStatus = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .then(([user]) => user?.status);

    if (currentStatus !== UserStatus.active) {
      throw new NeuronError(
        `Volunteer with id ${id} is not active`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    await this.db
      .update(user)
      .set({ status: UserStatus.inactive })
      .where(eq(user.id, id));

    return id;
  }

  async getVerificationRequestCount(): Promise<number> {
    let rows = await this.db
      .select({
        totalRecords: sql<number>`count(*) over()`,
      } as const)
      .from(user)
      .where(inArray(user.status, [UserStatus.unverified]))
      .limit(1);

    return rows[0]?.totalRecords ?? 0;
  }

  async createUser(input: {
    name: string;
    lastName: string;
    email: string;
    role: string;
  }): Promise<User> {
    try {
      const [createdUser] = await this.db
        .insert(user)
        .values({
          name: input.name,
          lastName: input.lastName,
          email: input.email,
          role: input.role as any,
          status: UserStatus.active,
          emailVerified: false,
        })
        .returning();

      if (!createdUser) {
        throw new NeuronError(
          "Failed to create user",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return buildUser(createdUser);
    } catch (error: any) {
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        throw new NeuronError(
          "A user with this email already exists",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  async createInstructor(input: CreateInstructorInput): Promise<User> {
    try {
      const [createdUser] = await this.db
        .insert(user)
        .values({
          name: input.firstName,
          lastName: input.lastName,
          email: input.email,
          role: "instructor" as any,
          status: UserStatus.active,
          emailVerified: false,
        })
        .returning();

      if (!createdUser) {
        throw new NeuronError(
          "Failed to create instructor",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return buildUser(createdUser);
    } catch (error: any) {
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        throw new NeuronError(
          "An instructor with this email already exists",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  async updateInstructor(input: UpdateInstructorInput): Promise<User> {
    const existing = await this.db
      .select()
      .from(user)
      .where(eq(user.id, input.instructorId))
      .then(([u]) => u);

    if (!existing) {
      throw new NeuronError(
        `Could not find instructor with id ${input.instructorId}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (existing.role !== "instructor") {
      throw new NeuronError(
        `User with id ${input.instructorId} is not an instructor`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    const updatePayload: Partial<typeof user.$inferInsert> = {};

    if (input.firstName !== undefined) {
      updatePayload.name = input.firstName;
    }
    if (input.lastName !== undefined) {
      updatePayload.lastName = input.lastName;
    }
    if (input.email !== undefined) {
      updatePayload.email = input.email;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new NeuronError(
        "At least one field must be provided to update an instructor",
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    try {
      const [updatedUser] = await this.db
        .update(user)
        .set(updatePayload)
        .where(eq(user.id, input.instructorId))
        .returning();

      if (!updatedUser) {
        throw new NeuronError(
          "Failed to update instructor",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return buildUser(updatedUser);
    } catch (error: any) {
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        throw new NeuronError(
          "An instructor with this email already exists",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  async deleteInstructor(id: string): Promise<string> {
    const existing = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .then(([u]) => u);

    if (!existing) {
      throw new NeuronError(
        `Could not find instructor with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    if (existing.role !== "instructor") {
      throw new NeuronError(
        `User with id ${id} is not an instructor`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }

    await this.db.delete(user).where(eq(user.id, id));
    return id;
  }

  async inviteUser(): Promise<void> {}
}
