import { Router, Response } from "express";
import {
    getUnverifiedVolunteers,
    verifyVolunteer,
} from "../controllers/adminController.js";
import { AuthenticatedUserRequest } from "../common/types.js";
import { isAuthorized, isAdmin } from "../config/authCheck.js";

const adminRouter = Router();

adminRouter.post(
    "/unverified-volunteers",
    isAuthorized,
    isAdmin,
    (req: AuthenticatedUserRequest, res: Response) => {
        getUnverifiedVolunteers(req, res);
    }
);

adminRouter.post(
    "/verify-volunteer",
    isAuthorized,
    isAdmin,
    (req: AuthenticatedUserRequest, res: Response) => {
        // Verify volunteer
        verifyVolunteer(req, res);
    }
);

export default adminRouter;
