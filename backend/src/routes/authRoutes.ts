import { Router, Request, Response } from "express";
import {
    registerUser,
    loginUser,
    sendVolunteerData,
    resetPassword,
    verifyAndRedirect,
    sendResetPasswordEmail,
    updatePassword,
} from "../controllers/userController.js";
import { isAuthorized } from "../config/authCheck.js";
import { AuthenticatedUserRequest } from "../common/types.js";

const authRouter = Router();

authRouter.post(
    "/is-authenticated",
    isAuthorized,
    (req: AuthenticatedUserRequest, res: Response) => {
        sendVolunteerData(req, res);
    }
);

authRouter.post("/register", (req: Request, res: Response) =>
    registerUser(req, res)
);

authRouter.post("/login", (req: Request, res: Response) => loginUser(req, res));

authRouter.post("/send-reset-password-email", (req: Request, res: Response) =>
    sendResetPasswordEmail(req, res)
);

authRouter.get("/forgot-password/:id/:token", (req: Request, res: Response) =>
    verifyAndRedirect(req, res)
);

authRouter.post("/reset-password", (req: Request, res: Response) =>
    resetPassword(req, res)
);

authRouter.post(
    "/update-password",
    isAuthorized,
    (req: AuthenticatedUserRequest, res: Response) => updatePassword(req, res)
);

export default authRouter;
