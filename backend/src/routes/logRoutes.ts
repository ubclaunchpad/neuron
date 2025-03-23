import { query } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import { isAdmin, isAuthorized } from "../config/authCheck.js";
import { getLogs } from "../controllers/logController.js";

export const LogRoutes: RouteDefinition = {
    path: '/logs',
    method: 'get',
    middleware: [
        isAuthorized,
        isAdmin
    ],
    validation: [
        query('q').isString().optional(),
        query('page').isInt().optional(),
        query('perPage').isInt().optional()
    ],
    action: getLogs
}