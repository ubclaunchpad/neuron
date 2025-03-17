import { Response } from "express";
import { AuthenticatedRequest } from "../common/types.js";
import { userModel } from "../config/models.js";

async function getUserById(req: AuthenticatedRequest, res: Response) {
    const { user_id } = req.params;

    const users = await userModel.getUsersByIds(user_id);

    if (users.length === 0) {
        res.status(400).json({
            error: 'No user found with the given user_id'
        });
    }
    
    res.status(200).json(users[0]);
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

