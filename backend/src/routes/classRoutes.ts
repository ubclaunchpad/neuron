import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from '../config/authCheck.js';
import { imageUploadMiddleware } from '../config/fileUpload.js';
import { addClass, deleteClass, getAllClasses, getClassById, getClassesByDay, updateClass, uploadClassImage } from '../controllers/classController.js';
import { Frequency } from '../common/interfaces.js';

export const ClassRoutes: RouteDefinition = {
    path: '/classes',
    middleware: [
        isAuthorized,
    ],
    children: [
        {
            path: '/',
            method: 'get',
            action: getAllClasses
        },
        {
            path: '/',
            method: 'post',
            validation: [
                body('class_name').isString(),
                body('instructions').isString().optional(),
                body('zoom_link').isURL().optional(),
                body('start_date').isDate({ format: 'YYYY-MM-DD' }),
                body('end_date').isDate({ format: 'YYYY-MM-DD' }),
                body('category').isString().optional(),
                body('subcategory').isString().optional(),
                body('schedules').isArray({ min: 0 }).optional(),
                body('schedules.*.day').isInt({ min: 0, max: 6 }),
                body('schedules.*.start_time').isTime({ hourFormat: 'hour24' }),
                body('schedules.*.end_time').isTime({ hourFormat: 'hour24' }),
                body('schedules.*.frequency').isIn(Object.values(Frequency)),
                body('schedules.*.volunteer_ids').isArray({ min: 0 }).optional(),
                body('schedules.*.volunteer_ids.*').isUUID('4'),
                body('schedules.*.fk_instructor_id').isUUID('4').optional(),
            ],
            action: addClass
        },
        {
            path: '/schedule/:day',
            method: 'get',
            validation: [
                param('day').isDate({ format: 'YYYY-MM-DD' }),
            ],
            action: getClassesByDay
        },
        {
            path: '/:class_id',
            validation: [
                param('class_id').isInt({ min: 0 })
            ],
            children: [
                {
                    path: '/',
                    method: 'get',
                    action: getClassById
                },
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body('class_name').isString().optional(),
                        body('instructions').isString().optional(),
                        body('zoom_link').isURL().optional(),
                        body('start_date').isDate({ format: 'YYYY-MM-DD' }).optional(),
                        body('end_date').isDate({ format: 'YYYY-MM-DD' }).optional(),
                        body('category').isString().optional(),
                        body('subcategory').isString().optional(),
                    ],
                    action: updateClass
                },
                {
                    path: '/',
                    method: 'delete',
                    action: deleteClass
                },
                {
                    path: '/upload',
                    method: 'put',
                    middleware: [imageUploadMiddleware],
                    action: uploadClassImage
                }
            ]
        },
    ]
};