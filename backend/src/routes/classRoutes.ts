import { body, param } from 'express-validator';
import { imageUploadMiddleware } from '../config/fileUpload.js';
import { addClass, deleteClass, getAllClasses, getClassById, getClassesByDay, updateClass, uploadClassImage } from '../controllers/classController.js';
import { RouteDefinition } from './routes.js';

export const ClassRoutes: RouteDefinition = {
    path: '/classes',
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
                body('fk_instructor_id').isUUID('4'),
                body('class_name').isString(),
                body('instructions').isString().optional(),
                body('zoom_link').isURL().optional(),
                body('start_date').isTime({ hourFormat: 'hour24'}),
                body('end_date').isTime({ hourFormat: 'hour24'}),
                body('category').isString().optional(),
            ],
            action: addClass
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
        {
            path: '/schedule/:day',
            method: 'get',
            validation: [
                param('day').isDate({ format: 'YYYY-MM-DD' }),
            ],
            action: getClassesByDay
        },
    ]
};