import type { ListUsersInput } from "@/models/api/user";
import { Status } from "@/models/interfaces";
import type { ListResponse } from "@/models/list-response";
import { buildUser, type User } from "@/models/user";
import { type Drizzle } from "@/server/db";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { buildSimilarityExpression, getPagination } from "@/utils/searchUtils";
import { and, desc, eq, getTableColumns, gt, inArray, sql } from "drizzle-orm";
import { user } from "../../db/schema/user";

export class UserService {
  private readonly db: Drizzle;
  
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getUsersForRequest(listRequest: ListUsersInput): Promise<ListResponse<User>> {
    const { perPage, offset, rolesToInclude, statusesToInclude } = getPagination(listRequest);
    const queryInput = listRequest.search?.trim();
    const hasQuery = !!queryInput

    const similarity = hasQuery
      ? buildSimilarityExpression([user.name, user.lastName, user.email], queryInput)
      : undefined;

    const baseSelect = {
      totalRecords: sql<number>`count(*) over()`,
      ...getTableColumns(user),
    } as const;

    const selectShape = hasQuery
      ? { ...baseSelect, similarity: similarity! }
      : baseSelect;

    let builder = this.db
      .select(selectShape)
      .from(user)
      .$dynamic();

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

    const rows = await builder
      .limit(perPage)
      .offset(offset)
      .execute();

    const total = rows[0]?.totalRecords ?? 0;
    const loadedSoFar = offset + rows.length;
    const nextCursor = loadedSoFar < total ? loadedSoFar : null;
    
    return {
      data: rows.map((d) => buildUser(d)),
      total,
      nextCursor,
    };
  }

  async getUsers(ids: string[]): Promise<User[]> {
    const data = await this.db
      .select()
      .from(user)
      .where(inArray(user.id, ids));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(`Could not find User with id ${firstMissing}`, NeuronErrorCodes.NOT_FOUND);
    }

    return data.map((d) => buildUser(d));
  }

  async getUser(id: string): Promise<User> {
    return await this.getUsers([id]).then(([user]) => user!);
  }

  // any -> active
  async verifyVolunteer(id: string): Promise<string> {
    await this.db.update(user).set({ status: Status.active }).where(eq(user.id, id));
    return id;
  }

  // unverified -> rejected
  async rejectVolunteer(id: string): Promise<string> {
    const currentStatus = await this.db.select().from(user).where(eq(user.id, id)).then(([user]) => user?.status);

    if (currentStatus !== Status.unverified) {
      throw new NeuronError(`Volunteer with id ${id} is already verified. Cannot be rejected.`, NeuronErrorCodes.BAD_REQUEST);
    }
    await this.db.update(user).set({ status: Status.rejected }).where(eq(user.id, id));

    return id;
  }

  // active -> inactive
  async deactivateUser(id: string): Promise<string> {
    const currentStatus = await this.db.select().from(user).where(eq(user.id, id)).then(([user]) => user?.status);

    if (currentStatus !== Status.active) {
      throw new NeuronError(`Volunteer with id ${id} is not active`, NeuronErrorCodes.BAD_REQUEST);
    }

    await this.db.update(user).set({ status: Status.inactive }).where(eq(user.id, id));

    return id;
  }

  async getVerificationRequestCount(): Promise<number> {
    let rows = await this.db
      .select({
        totalRecords: sql<number>`count(*) over()`
      } as const)
      .from(user)
      .where(inArray(user.status, [Status.unverified]))
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
          status: Status.active,
          emailVerified: false,
        })
        .returning();

      if (!createdUser) {
        throw new NeuronError("Failed to create user", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
      }

      return buildUser(createdUser);
    } catch (error: any) {
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        throw new NeuronError(
          "A user with this email already exists",
          NeuronErrorCodes.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  async inviteUser(): Promise<void> {
    
  }
}