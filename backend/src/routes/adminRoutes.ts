import { body } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import { isAdmin, isAuthorized } from "../config/authCheck.js";
import {
    getUnverifiedVolunteers,
    verifyVolunteer,
} from "../controllers/adminController.js";

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
            validation: [
                body('volunteer_id').isUUID('4')
            ],
            action: verifyVolunteer
        },
    ]
};
