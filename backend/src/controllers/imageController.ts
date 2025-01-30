import { Request, Response } from "express";
import ImageModel from "../models/imageModel.js";

const imageService = new ImageModel();

export async function getImage(req: Request, res: Response) {
    const { image_id } = req.params;

    const image = await imageService.getImage(image_id);
    
    res.type('image/png').send(image.image);
}