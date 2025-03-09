import { Response } from "express";
import { AuthenticatedRequest } from "../common/types.js";
import { imageModel } from "../config/models.js";

export async function getImage(req: AuthenticatedRequest, res: Response) {
    const { image_id } = req.params;

    const image = await imageModel.getImage(image_id);
    
    res.type('image/png').send(image.image);
}