import { Request, Response } from "express";
import ImageModel from "../models/imageModel.js";

const imageService = new ImageModel();

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
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}