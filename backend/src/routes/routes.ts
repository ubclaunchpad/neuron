import { RouteDefinition } from "../common/types.js";
import { AuthRoutes } from './authRoutes.js';
import { ClassRoutes } from './classRoutes.js';
import { CoverageRoutes } from "./coverageRoutes.js";
import { ImageRoutes } from './imageRoutes.js';
import { InstructorRoutes } from './instructorRoutes.js';
import { LogRoutes } from "./logRoutes.js";
import { ScheduleRoutes } from './scheduleRoutes.js';
import { ShiftRoutes } from './shiftRoutes.js';
import { UserRoutes } from './userRoutes.js';
import { VolunteerRoutes } from './volunteerRoutes.js';

export const Routes: RouteDefinition[] = [
    AuthRoutes,
    ClassRoutes,
    ImageRoutes,
    InstructorRoutes,
    ScheduleRoutes,
    ShiftRoutes,
    UserRoutes,
    VolunteerRoutes,
    CoverageRoutes,
    LogRoutes,
]
