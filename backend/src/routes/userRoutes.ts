import { Request, Response, Router } from "express";
import { imageUploadMiddleware } from "../config/fileUpload.js";
import { getUserById, insertProfilePicture } from "../controllers/userController.js";

const router = Router();

// create profile picture for a user
router.post("/:user_id/upload", imageUploadMiddleware, (req: Request, res: Response) => {
    insertProfilePicture(req, res);
});

// get user profile by id
router.get("/:user_id", (req: Request, res: Response) => {
    getUserById(req, res);
});

export default router;
