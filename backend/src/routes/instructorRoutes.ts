import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from '../config/authCheck.js';
import {
    getInstructorById,
    getInstructors,
    insertInstructor
} from '../controllers/instructorController.js';

export const InstructorRoutes: RouteDefinition = {
    path: '/instructors',
    middleware: [
        isAuthorized,
    ],
    children: [
        {
            path: '/',
            method: 'get',
            action: getInstructors
        },
        {
            path: '/',
            method: 'post',
            validation: [
                body('instructor_id').isUUID('4'),
                body('f_name').isString(),
                body('l_name').isString(),
                body('email').isEmail(),
            ],
            action: insertInstructor
        },
        {
            path: '/:instructor_id',
            method: 'get',
            validation: [
                param('instructor_id').isUUID('4')
            ],
            action: getInstructorById
        },
    ]
};