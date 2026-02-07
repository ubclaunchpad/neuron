import { env } from "@/env";
import type { Session } from "@/lib/auth";
import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import type { Sql } from "postgres";
import { registerDb, type Drizzle } from "../db";
// import { registerCacheClient, type CacheClient } from "../db/cache";
// import { CacheService, type ICacheService } from "../services/cacheService";
import { EmailService, type IEmailService } from "../services/emailService";
import {
  ClassService,
  type IClassService,
} from "../services/entity/classService";
import {
  CoverageService,
  type ICoverageService,
} from "../services/entity/coverageService";
import {
  ShiftService,
  type IShiftService,
} from "../services/entity/shiftService";
import { TermService, type ITermService } from "../services/entity/termService";
import { UserService, type IUserService } from "../services/entity/userService";
import {
  VolunteerService,
  type IVolunteerService,
} from "../services/entity/volunteerService";
import { ImageService, type IImageService } from "../services/imageService";
import {
  CurrentSessionService,
  type ICurrentSessionService,
} from "../services/currentSessionService";

export type NeuronCradle = {
  env: typeof env;

  db: Drizzle;
  // cacheClient: CacheClient;

  // current request info
  session?: Session;
  headers: Headers;

  // services
  currentSessionService: ICurrentSessionService;
  imageService: IImageService;
  emailService: IEmailService;
  classService: IClassService;
  // cacheService: ICacheService;
  userService: IUserService;
  volunteerService: IVolunteerService;
  termService: ITermService;
  shiftService: IShiftService;
  coverageService: ICoverageService;
};

export type NeuronContainer = AwilixContainer<NeuronCradle>;

const createRootContainer = (): NeuronContainer => {
  const container = createContainer<NeuronCradle>({
    // PROXY is resilient to build-time minification (CLASSIC breaks when
    // constructor/function parameter names get mangled).
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    env: asValue(env),
  });

  registerDb(container);
  //registerCacheClient(container);
  registerServices(container);

  return container;
};

const registerServices = (container: NeuronContainer) => {
  container.register({
    currentSessionService: asClass<ICurrentSessionService>(
      CurrentSessionService,
    ).scoped(),
    imageService: asClass<IImageService>(ImageService).singleton(),
    emailService: asClass<IEmailService>(EmailService).singleton(),
    classService: asClass<IClassService>(ClassService).scoped(),
    shiftService: asClass<IShiftService>(ShiftService).scoped(),
    userService: asClass<IUserService>(UserService).singleton(),
    volunteerService: asClass<IVolunteerService>(VolunteerService).singleton(),
    termService: asClass<ITermService>(TermService).singleton(),
    coverageService: asClass<ICoverageService>(CoverageService).scoped(),
    // cacheService: asClass<ICacheService>(CacheService).scoped(),
  });
};

let _rootContainer: NeuronContainer | null = null;

export const getRootContainer = (): NeuronContainer => {
  if (!_rootContainer) {
    _rootContainer = createRootContainer();
  }
  return _rootContainer;
};

export const createRequestScope = () => getRootContainer().createScope();
