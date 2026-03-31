import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { asClass } from "awilix";
import { user, notificationPreference } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import {
  PreferenceService,
  type IPreferenceService,
} from "@/server/services/preferenceService";
import {
  createTestScope,
  type ITestServiceScope,
} from "../helpers/test-service-scope";

describe("PreferenceService", () => {
  let scope: ITestServiceScope;
  let preferenceService: IPreferenceService;
  let userId: string;
  const createdUserIds: string[] = [];

  beforeEach(async () => {
    scope = createTestScope();
    scope.mockSession.setAsAdmin();
    // Override the mock with the real PreferenceService for integration testing
    scope.container.register({
      preferenceService:
        asClass<IPreferenceService>(PreferenceService).scoped(),
    });
    preferenceService =
      scope.resolve<IPreferenceService>("preferenceService");

    userId = randomUUID();
    await scope.db.insert(user).values({
      id: userId,
      name: "Test",
      lastName: "User",
      email: `pref-test-${Date.now()}-${randomUUID()}@test.com`,
      role: "volunteer",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdUserIds.push(userId);
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await scope.db
        .delete(notificationPreference)
        .where(inArray(notificationPreference.userId, createdUserIds));
      await scope.db
        .delete(user)
        .where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
    scope.dispose();
  });

  describe("getEffectivePreferences", () => {
    it("should return registry defaults when no overrides exist", async () => {
      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");

      expect(prefs.length).toBeGreaterThan(0);

      // shift.cancelled has defaults: email: true, in_app: true
      const shiftEmail = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(shiftEmail).toBeDefined();
      expect(shiftEmail!.enabled).toBe(true);
      expect(shiftEmail!.isOverride).toBe(false);

      const shiftInApp = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "in_app",
      );
      expect(shiftInApp).toBeDefined();
      expect(shiftInApp!.enabled).toBe(true);
      expect(shiftInApp!.isOverride).toBe(false);
    });

    it("should apply user override over registry default", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");

      const shiftEmail = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(shiftEmail!.enabled).toBe(false);
      expect(shiftEmail!.isOverride).toBe(true);

      // in_app should still be the default
      const shiftInApp = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "in_app",
      );
      expect(shiftInApp!.enabled).toBe(true);
      expect(shiftInApp!.isOverride).toBe(false);
    });

    it("should include preferences for all registered notification types", async () => {
      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");

      const types = new Set(prefs.map((p) => p.type));
      expect(types.has("shift.cancelled")).toBe(true);
      expect(types.has("coverage.available")).toBe(true);
      // coverage.requested is admin/instructor only, not shown for volunteers
      expect(types.has("coverage.requested")).toBe(false);
    });
  });

  describe("setPreference", () => {
    it("should create a new preference override", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      const pref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(pref!.enabled).toBe(false);
      expect(pref!.isOverride).toBe(true);
    });

    it("should update an existing preference override (upsert)", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: true,
      });

      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      const pref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(pref!.enabled).toBe(true);
      expect(pref!.isOverride).toBe(true);
    });

    it("should set preferences independently per channel", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "in_app",
        enabled: false,
      });

      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      const emailPref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      const inAppPref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "in_app",
      );

      expect(emailPref!.enabled).toBe(false);
      expect(inAppPref!.enabled).toBe(false);
    });
  });

  describe("clearPreference", () => {
    it("should remove an override and revert to registry default", async () => {
      // Set override to disabled
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      // Verify it's overridden
      let prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      let pref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(pref!.enabled).toBe(false);
      expect(pref!.isOverride).toBe(true);

      // Clear the override
      await preferenceService.clearPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
      });

      // Should revert to registry default (true)
      prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      pref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(pref!.enabled).toBe(true);
      expect(pref!.isOverride).toBe(false);
    });

    it("should be a no-op when no override exists", async () => {
      // Should not throw
      await preferenceService.clearPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
      });

      const prefs = await preferenceService.getEffectivePreferences(userId, "volunteer");
      const pref = prefs.find(
        (p) => p.type === "shift.cancelled" && p.channel === "email",
      );
      expect(pref!.enabled).toBe(true);
      expect(pref!.isOverride).toBe(false);
    });
  });

  describe("getPreferencesForRecipients", () => {
    let user2Id: string;

    beforeEach(async () => {
      user2Id = randomUUID();
      await scope.db.insert(user).values({
        id: user2Id,
        name: "Test",
        lastName: "User2",
        email: `pref-test2-${Date.now()}-${randomUUID()}@test.com`,
        role: "volunteer",
        status: "active",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUserIds.push(user2Id);
    });

    it("should return registry defaults for all users when no overrides exist", async () => {
      const result = await preferenceService.getPreferencesForRecipients({
        type: "shift.cancelled",
        userIds: [userId, user2Id],
      });

      expect(result.size).toBe(2);

      for (const uid of [userId, user2Id]) {
        const channelMap = result.get(uid);
        expect(channelMap).toBeDefined();
        expect(channelMap!.get("email")).toBe(true);
        expect(channelMap!.get("in_app")).toBe(true);
      }
    });

    it("should apply overrides per-user while others keep defaults", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      const result = await preferenceService.getPreferencesForRecipients({
        type: "shift.cancelled",
        userIds: [userId, user2Id],
      });

      // user1 has email disabled
      expect(result.get(userId)!.get("email")).toBe(false);
      expect(result.get(userId)!.get("in_app")).toBe(true);

      // user2 keeps defaults
      expect(result.get(user2Id)!.get("email")).toBe(true);
      expect(result.get(user2Id)!.get("in_app")).toBe(true);
    });

    it("should handle empty userIds array", async () => {
      const result = await preferenceService.getPreferencesForRecipients({
        type: "shift.cancelled",
        userIds: [],
      });

      expect(result.size).toBe(0);
    });

    it("should only load overrides for the requested type", async () => {
      // Set override for shift.cancelled
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });

      // Query for coverage.requested — the shift.cancelled override should not apply
      const result = await preferenceService.getPreferencesForRecipients({
        type: "coverage.requested",
        userIds: [userId],
      });

      expect(result.get(userId)!.get("email")).toBe(true);
    });

    it("should handle multiple overrides for same user", async () => {
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "email",
        enabled: false,
      });
      await preferenceService.setPreference({
        userId,
        type: "shift.cancelled",
        channel: "in_app",
        enabled: false,
      });

      const result = await preferenceService.getPreferencesForRecipients({
        type: "shift.cancelled",
        userIds: [userId],
      });

      expect(result.get(userId)!.get("email")).toBe(false);
      expect(result.get(userId)!.get("in_app")).toBe(false);
    });
  });
});
