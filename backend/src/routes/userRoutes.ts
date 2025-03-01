import { param } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from "../config/authCheck.js";
import { imageUploadMiddleware } from "../config/fileUpload.js";
import { getUserById, insertProfilePicture } from "../controllers/userController.js";

export const UserRoutes: RouteDefinition = {
    path: '/user/:user_id',
    middleware: [
        isAuthorized,
    ],
    validation: [
        param('user_id').isUUID('4')
    ],
    children: [
        {
            path: '/',
            method: 'get',
            action: getUserById
        },
        {
            path: '/upload',
            method: 'post',
            middleware: [imageUploadMiddleware],
            action: insertProfilePicture
        },
    ]
};
