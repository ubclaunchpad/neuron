import { param } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import { getImage } from "../controllers/imageController.js";

export const ImageRoutes: RouteDefinition = {
    path: '/image/:image_id',
    method: 'get',
    validation: [
        param('image_id').isUUID('4')
    ],
    action: getImage
}