import { Express, NextFunction, Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { RouteDefinition, RouteEndpoint, RouteGroup } from "../common/types.js";

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
                    return await route.action(
                        req,
                        res,
                        next,
                    );
                } catch (err: any) {
                    /* Send specific errors to the frontend */
                    if (err.status) {
                        res.status(err.status)
                        
                        if (err.message) {
                            res.json({
                                error: err.message
                            });
                        }
                        
                        return res;
                    }

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
