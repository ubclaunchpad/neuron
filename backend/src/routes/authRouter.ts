import { Router, Request, Response } from "express";
import {
    registerUser,
    loginUser,
    verifyUser,
    resetPassword,
    verifyAndRedirect,
    sendResetPasswordEmail,
    updatePassword,
} from "../controllers/userController";
import { isAuthorized } from "../config/isAuthorized";
import { AuthenticatedUserRequest } from "../common/types";

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

authRouter.post(
    "/update-password",
    isAuthorized,
    (req: AuthenticatedUserRequest, res: Response) => updatePassword(req, res)
);
