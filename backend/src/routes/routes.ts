import { RouteDefinition } from "../common/types.js";
import { AdminRoutes } from './adminRoutes.js';
import { AuthRoutes } from './authRoutes.js';
import { ClassRoutes } from './classRoutes.js';
import { ImageRoutes } from './imageRoutes.js';
import { InstructorRoutes } from './instructorRoutes.js';
import { ScheduleRoutes } from './scheduleRoutes.js';
import { ShiftRoutes } from './shiftRoutes.js';
import { UserRoutes } from './userRoutes.js';
import { VolunteerRoutes } from './volunteerRoutes.js';
import { CoverageRoutes } from "./coverageRoutes.js";

export const Routes: RouteDefinition[] = [
  AdminRoutes,
  AuthRoutes,
  ClassRoutes,
  ImageRoutes,
  InstructorRoutes,
  ScheduleRoutes,
  ShiftRoutes,
  UserRoutes,
  VolunteerRoutes,
  CoverageRoutes,
];
