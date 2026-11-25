import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import type { IUserService } from "@/server/services/entity/userService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("UserService", () => {
  let scope: ITestServiceScope;
  let userService: IUserService;
  let createdUserIds: string[] = [];

  beforeEach(() => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    userService = scope.resolve<IUserService>("userService");
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await scope.db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds = [];
    }
    scope.dispose();
  });

  describe("unique email handling (DrizzleQueryError.cause)", () => {
    it("throws BAD_REQUEST when createUser collides on email", async () => {
      const email = `dup-user-${randomUUID()}@test.com`;
      const created = await userService.createUser({
        name: "Alice",
        lastName: "Smith",
        email,
        role: "instructor",
      });
      createdUserIds.push(created.id);

      await expect(
        userService.createUser({
          name: "Bob",
          lastName: "Jones",
          email,
          role: "instructor",
        }),
      ).rejects.toMatchObject({
        code: NeuronErrorCodes.BAD_REQUEST,
        message: "A user with this email already exists",
      });
    });

    it("throws BAD_REQUEST when createInstructor collides on email", async () => {
      const email = `dup-inst-${randomUUID()}@test.com`;
      const created = await userService.createInstructor({
        firstName: "Jane",
        lastName: "Doe",
        email,
      });
      createdUserIds.push(created.id);

      await expect(
        userService.createInstructor({
          firstName: "John",
          lastName: "Doe",
          email,
        }),
      ).rejects.toMatchObject({
        code: NeuronErrorCodes.BAD_REQUEST,
        message: "An instructor with this email already exists",
      });
    });

    it("throws BAD_REQUEST when updateInstructor collides on email", async () => {
      const emailA = `inst-a-${randomUUID()}@test.com`;
      const emailB = `inst-b-${randomUUID()}@test.com`;

      const instA = await userService.createInstructor({
        firstName: "Inst",
        lastName: "A",
        email: emailA,
      });
      const instB = await userService.createInstructor({
        firstName: "Inst",
        lastName: "B",
        email: emailB,
      });
      createdUserIds.push(instA.id, instB.id);

      let caught: unknown;
      try {
        await userService.updateInstructor({
          instructorId: instB.id,
          email: emailA,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(NeuronError);
      expect((caught as NeuronError).code).toBe(NeuronErrorCodes.BAD_REQUEST);
      expect((caught as NeuronError).message).toBe(
        "An instructor with this email already exists",
      );
    });
  });

  describe("count queries and empty array guards", () => {
    it("returns numeric totals from getUsersForRequest and getVerificationRequestCount", async () => {
      const id = randomUUID();
      await scope.db.insert(user).values({
        id,
        name: "Unverified",
        lastName: "Volunteer",
        email: `unverified-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "unverified",
        emailVerified: false,
      });
      createdUserIds.push(id);

      const list = await userService.getUsersForRequest({ perPage: 10 });
      expect(typeof list.total).toBe("number");
      expect(list.total).toBeGreaterThanOrEqual(1);

      const pendingCount = await userService.getVerificationRequestCount();
      expect(typeof pendingCount).toBe("number");
      expect(pendingCount).toBeGreaterThanOrEqual(1);
    });

    it("returns an empty array for getUsers([])", async () => {
      await expect(userService.getUsers([])).resolves.toEqual([]);
    });
  });
});
