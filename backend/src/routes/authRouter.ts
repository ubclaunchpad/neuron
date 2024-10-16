import { Router, Request, Response } from "express";
import {
    registerUser,
    loginUser,
    verifyUser,
    resetPassword,
    verifyAndRedirect,
    sendResetPasswordEmail,
} from "../controllers/userController";

export const authRouter = Router();

authRouter.post("/register", (req: Request, res: Response) =>
    registerUser(req, res)
);

authRouter.post("/login", (req: Request, res: Response) => loginUser(req, res));

authRouter.post("/verify", (req: Request, res: Response) =>
    verifyUser(req, res)
);

authRouter.post("/send-reset-password-email", (req: Request, res: Response) =>
    sendResetPasswordEmail(req, res)
);

authRouter.get("/forgot-password/:id/:token", (req: Request, res: Response) =>
    verifyAndRedirect(req, res)
);

authRouter.post("/reset-password/:id/:token", (req: Request, res: Response) =>
    resetPassword(req, res)
);
