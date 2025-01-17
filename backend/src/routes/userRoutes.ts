import { Request, Response, Router } from "express";
import multer from 'multer';
import { getUserById, insertProfilePicture } from "../controllers/userController.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// create profile picture for a user
router.post("/:user_id/upload", upload.single('image'), (req: Request, res: Response) => {
    insertProfilePicture(req, res);
});

// get user profile by id
router.get("/:user_id", (req: Request, res: Response) => {
    getUserById(req, res);
});

export default router;
