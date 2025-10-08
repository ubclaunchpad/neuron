import { env } from "@/env";
import type { Session } from "@/lib/auth";
import {
  asClass,
  asValue,
  createContainer,
  type AwilixContainer,
} from "awilix";
import type { Sql } from "postgres";
import { registerDb, type Drizzle } from "../db";
import { registerCacheClient, type CacheClient } from "../db/cache";
import { CacheService } from "../services/cacheService";
import { EmailService } from "../services/emailService";
import { ClassService } from "../services/entity/classService";
import { InstructorService } from "../services/entity/instructorService";
import { ShiftService } from "../services/entity/shiftService";
import { TermService } from "../services/entity/termService";
import { VolunteerService } from "../services/entity/volunteerService";

export type NeuronCradle = {
  env: typeof env;

  dbConn: Sql;
  db: Drizzle;
  cacheClient: CacheClient;

  // current request info
  session?: Session;
  headers: Headers;

  // services
  emailService: EmailService;
  classService: ClassService;
  cacheService: CacheService;
  instructorService: InstructorService;
  volunteerService: VolunteerService;
  termService: TermService;
  shiftService: ShiftService;
};

export type NeuronContainer = AwilixContainer<NeuronCradle>;

const createRootContainer = (): NeuronContainer => {
  const container = createContainer<NeuronCradle>({
    injectionMode: "CLASSIC",
    strict: true,
  });

  container.register({
    env: asValue(env),
  });

  registerDb(container);
  registerCacheClient(container);
  registerServices(container);

  return container;
};

const registerServices = (container: NeuronContainer) => {
  container.register({
    emailService: asClass<EmailService>(EmailService).singleton(),
    classService: asClass<ClassService>(ClassService).singleton(),
    shiftService: asClass<ShiftService>(ShiftService).singleton(),
    instructorService: asClass<InstructorService>(InstructorService).singleton(),
    volunteerService: asClass<VolunteerService>(VolunteerService).singleton(),
    termService: asClass<TermService>(TermService).singleton(),

    cacheService: asClass<CacheService>(CacheService).scoped(),
  });
};

export const rootContainer = createRootContainer();
export const createRequestScope = () => rootContainer.createScope();
