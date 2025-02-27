import { Response } from "express";
import { AuthenticatedRequest } from "../common/types.js";
import { userModel } from "../config/models.js";

async function getUserById(req: AuthenticatedRequest, res: Response) {
    const { user_id } = req.params;

    const user = await userModel.getUserById(user_id);
    
    res.status(200).json(user);
}

async function insertProfilePicture(req: AuthenticatedRequest, res: Response) {
    const { user_id } = req.params;
    const image = req.file!.buffer;

    const imageId = await userModel.upsertUserProfileImage(user_id, image);

    return res.status(201).json(imageId);
}

export {
    getUserById, insertProfilePicture
};

