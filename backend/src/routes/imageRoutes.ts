import { param } from "express-validator";
import { getImage } from "../controllers/imageController.js";
import { RouteDefinition } from "./routes.js";

export const ImageRoutes: RouteDefinition = {
    path: '/image/:image_id',
    method: 'get',
    validation: [
        param('image_id').isUUID('4')
    ],
    action: getImage
}