import { body, param } from 'express-validator';
import {
    getInstructorById,
    getInstructors,
    insertInstructor
} from '../controllers/instructorController.js';
import { RouteDefinition } from './routes.js';

export const InstructorRoutes: RouteDefinition = {
    path: '/instructors',
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