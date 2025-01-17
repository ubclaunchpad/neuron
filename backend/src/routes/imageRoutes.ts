import { Request, Response, Router } from "express";
import { getImage } from "../controllers/imageController.js";

const router = Router();

// create profile picture for a volunteer
router.get("/:image_id", (req: Request, res: Response) => {
    getImage(req, res);
});

export default router;
