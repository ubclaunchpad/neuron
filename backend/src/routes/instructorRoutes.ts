import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAdmin, isAuthorized } from '../config/authCheck.js';
import {
    deleteInstructor,
    editInstructor,
    getInstructors,
    insertInstructor
} from '../controllers/instructorController.js';

export const InstructorRoutes: RouteDefinition = {
    path: '/instructor',
    middleware: [
        isAuthorized,
        isAdmin
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
                body('f_name').isString(),
                body('l_name').isString(),
                body('email').isEmail(),
            ],
            action: insertInstructor
        },
        {
            path: '/:instructor_id',
            validation: [
                param('instructor_id').isUUID('4')
            ],
            children: [
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body('f_name').isString(),
                        body('l_name').isString(),
                        body('email').isEmail()
                    ],
                    action: editInstructor
                },
                {
                    path: '/',
                    method: 'delete',
                    action: deleteInstructor
                },
            ]
        },
    ]
};