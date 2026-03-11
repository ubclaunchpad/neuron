import { createContainer, asValue, asClass, InjectionMode } from "awilix";
import { env } from "@/env";
import type { NeuronCradle, NeuronContainer } from "@/server/api/di-container";
import type { Session } from "@/lib/auth";
import type { IEmailService } from "@/server/services/emailService";
import type { IImageService } from "@/server/services/imageService";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";
import type { IJobService } from "@/server/services/jobService";
import { getTestDb } from "./test-db";
import { MockEmailService } from "./mocks/mock-email-service";
import { MockImageService } from "./mocks/mock-image-service";
import { MockCurrentSessionService } from "./mocks/mock-current-session-service";
import { MockJobService } from "./mocks/mock-job-service";

// Services that use real implementations with test DB
import {
  ClassService,
  type IClassService,
} from "@/server/services/entity/classService";
import {
  CoverageService,
  type ICoverageService,
} from "@/server/services/entity/coverageService";
import {
  ShiftService,
  type IShiftService,
} from "@/server/services/entity/shiftService";
import {
  TermService,
  type ITermService,
} from "@/server/services/entity/termService";
import {
  UserService,
  type IUserService,
} from "@/server/services/entity/userService";
import {
  VolunteerService,
  type IVolunteerService,
} from "@/server/services/entity/volunteerService";

export interface TestContainerOptions {
  session?: Session;
  headers?: Headers;
}

export interface TestContainerResult {
  container: NeuronContainer;
  mockJobService: MockJobService;
}

/**
 * Creates a test DI container with mocked external services.
 * Uses real implementations for domain services with the test database.
 */
export function createTestContainer(
  options: TestContainerOptions = {},
): TestContainerResult {
  const { session, headers = new Headers() } = options;

  const container = createContainer<NeuronCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const db = getTestDb();

  // Instantiate up front so the same instance is shared across all resolutions.
  // asClass(.transient()) would return a new instance on every cradle access,
  // making calls inspection impossible from tests.
  const mockJobService = new MockJobService();

  container.register({
    env: asValue(env),
    container: asValue(container),

    // Database - real test database
    db: asValue(db),

    // Request context
    session: asValue(session),
    headers: asValue(headers),

    // Mock services
    currentSessionService: asClass<ICurrentSessionService>(
      MockCurrentSessionService,
    ).singleton(),
    jobService: asValue<IJobService>(mockJobService),
    emailService: asClass<IEmailService>(MockEmailService).singleton(),
    imageService: asClass<IImageService>(MockImageService).singleton(),
    // cacheService: asClass(CacheService).scoped(),

    // Real services with test DB
    classService: asClass<IClassService>(ClassService).scoped(),
    shiftService: asClass<IShiftService>(ShiftService).scoped(),
    userService: asClass<IUserService>(UserService).singleton(),
    volunteerService: asClass<IVolunteerService>(VolunteerService).singleton(),
    termService: asClass<ITermService>(TermService).scoped(),
    coverageService: asClass<ICoverageService>(CoverageService).scoped(),
  });

  return { container, mockJobService };
}