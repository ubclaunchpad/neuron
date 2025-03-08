import { body } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import { isAdmin, isAuthorized } from "../config/authCheck.js";
import {
    getUnverifiedVolunteers,
    verifyVolunteer,
    deactivateVolunteer
} from "../controllers/adminController.js";
import {
    getVolunteers
} from "../controllers/volunteerController.js";
import {
    getInstructors,
    insertInstructor,
    deleteInstructor,
    editInstructor
} from "../controllers/instructorController.js"

export const AdminRoutes: RouteDefinition = {
    path: '/admin',
    middleware: [
        isAuthorized,
        isAdmin,
    ],
    children: [
        {
            path: '/all-volunteers',
            method: 'post',
            action: getVolunteers
        },
        {
            path: '/all-instructors',
            method: 'post',
            action: getInstructors
        },
        {
            path: '/add-instructor',
            method: 'post',
            validation: [
                body('f_name').isString(),
                body('l_name').isString(),
                body('email').isEmail(),
            ],
            action: insertInstructor
        },
        {
            path: '/edit-instructor',
            method: 'post',
            validation: [
                body('instructor_id').isUUID('4'),
                body('f_name').isString(),
                body('l_name').isString(),
                body('email').isEmail()
            ],
            action: editInstructor
        },
        {
            path: '/delete-instructor',
            method: 'post',
            validation: [
                body('instructor_id').isUUID('4')
            ],
            action: deleteInstructor
        },
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
        {
            path: '/deactivate-volunteer',
            method: 'post',
            validation: [
                body('volunteer_id').isUUID('4')
            ],
            action: deactivateVolunteer
        }
    ]
};
