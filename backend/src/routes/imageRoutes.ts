import { getImage } from "../controllers/imageController.js";
import { RouteDefinition } from "./routes.js";

export const ImageRoutes: RouteDefinition = {
    path: '/image/:image_id',
    method: 'get',
    action: getImage
}