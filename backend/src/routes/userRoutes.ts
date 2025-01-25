import { imageUploadMiddleware } from "../config/fileUpload.js";
import { getUserById, insertProfilePicture } from "../controllers/userController.js";
import { RouteDefinition } from "./routes.js";

export const UserRoutes: RouteDefinition = {
    path: '/user/:user_id',
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
