import { Request, Response } from "express";
import ImageService from "../models/ImageService.js";

const imageService = new ImageService();

export async function getImage(req: Request, res: Response) {
    const { image_id } = req.params;

    if (!image_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'image_id'",
        });
    }

    try {
        const image = await imageService.getImage(image_id);

        res.type('image/png').send(image.image);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`,
        });
    }
}