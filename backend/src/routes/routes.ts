import { Express, NextFunction, Request, Response, Router } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { AdminRoutes } from './adminRoutes.js';
import { AuthRoutes } from './authRoutes.js';
import { ClassRoutes } from './classRoutes.js';
import { ImageRoutes } from './imageRoutes.js';
import { InstructorRoutes } from './instructorRoutes.js';
import { ScheduleRoutes } from './scheduleRoutes.js';
import { ShiftRoutes } from './shiftRoutes.js';
import { UserRoutes } from './userRoutes.js';
import { VolunteerRoutes } from './volunteerRoutes.js';

export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export interface RouteGroup {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    children: RouteDefinition[];
}

export interface RouteEndpoint {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    method: HTTPMethod;
    action: (req: Request, res: Response, next: NextFunction) => Promise<any>;
}

export type RouteDefinition = RouteGroup | RouteEndpoint;

export const Routes: RouteDefinition[] = [
    AdminRoutes,
    AuthRoutes,
    ClassRoutes,
    ImageRoutes,
    InstructorRoutes,
    ScheduleRoutes,
    ShiftRoutes,
    UserRoutes,
    VolunteerRoutes
]

export function registerRoutes(app: Express | Router, routes: RouteDefinition[]) {
    routes.forEach((route) => {
        if (isRouteGroup(route)) {
            const middlewares = [
                ...(route.middleware || []),
                ...(route.validation || [])
            ];

            const groupRouter: Router = Router({ mergeParams: true });

            if (middlewares.length > 0) {
                groupRouter.use(...middlewares);
            }

            // Recursively register child routes and then register router to app
            registerRoutes(groupRouter, route.children);
            app.use(route.path, groupRouter as Express);
        }
        else if (isRouteEndpoint(route)) {
            const middlewares = [
                ...(route.middleware || []),
                ...(route.validation || [])
            ];

            (app as any)[route.method](route.path, ...middlewares, async (req: Request, res: Response, next: NextFunction) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    /* If there are validation errors, send a response with the error messages */
                    return res.status(400).json({ errors: errors.array({ onlyFirstError: true }) });
                }

                try {
                    await route.action(
                        req,
                        res,
                        next,
                    );
                } catch (err) {
                    console.error(err);
                    return res.sendStatus(500); // Don't expose internal server workings
                }
            });
        }
    });
}

// Helpers for type narrowing
function isRouteGroup(route: RouteDefinition): route is RouteGroup {
    return (route as RouteGroup).children !== undefined;
}

function isRouteEndpoint(route: RouteDefinition): route is RouteEndpoint {
    return (route as RouteEndpoint).method !== undefined && (route as RouteEndpoint).action !== undefined;
}
