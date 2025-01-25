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
            action: addClass
        },
        {
            path: '/:class_id',
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
            action: getClassesByDay
        },
    ]
};