import { isAdmin, isAuthorized } from "../config/authCheck.js";
import {
    getUnverifiedVolunteers,
    verifyVolunteer,
} from "../controllers/adminController.js";
import { RouteDefinition } from "./routes.js";

export const AdminRoutes: RouteDefinition = {
    path: '/admin',
    middleware: [
        isAuthorized,
        isAdmin,
    ],
    children: [
        {
            path: '/unverified-volunteers',
            method: 'post',
            action: getUnverifiedVolunteers
        },
        {
            path: '/verify-volunteer',
            method: 'post',
            action: verifyVolunteer
        },
    ]
};
