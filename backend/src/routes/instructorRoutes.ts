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
            action: insertInstructor
        },
        {
            path: '/:instructor_id',
            method: 'get',
            action: getInstructorById
        },
    ]
};