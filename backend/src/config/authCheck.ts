import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../common/interfaces.js";
import {
    AuthenticatedRequest,
    DecodedJwtPayload
} from "../common/types.js";
import { TOKEN_SECRET } from "./environment.js";
import { userModel, volunteerModel } from "./models.js";

async function isAuthorized(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    // Get the token from the request body
    const bearer = req.headers.authorization;

    // Grab token from "Bearer {token}"
    const token = bearer?.match(/Bearer (.+)/)?.[1];

    // If the token is not provided, return an error message
    if (!token) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    if (!TOKEN_SECRET) {
        return res.status(500).json({
            error: "Server configuration error: TOKEN_SECRET is not defined",
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, TOKEN_SECRET) as DecodedJwtPayload;
        
        const results = await userModel.getUsersByIds(decoded.user_id);

        // If the user does not exist, return an error message
        if (results.length === 0) {
            return res.status(401).json({
                error: "The token is either invalid or has expired",
            });
        }

        const user = results[0];

        // Attach the user to the request
        (req as AuthenticatedRequest).user = user;

         // If the user is a volunteer, attach the volunteer to the request as well
        if (user.role === Role.volunteer) {
            const volunteer = await volunteerModel.getVolunteerByUserId(user.user_id);
            (req as AuthenticatedRequest).volunteer = volunteer;
        }

        // Call the next function
        return next();
    } catch (err) {
        return res.status(401).json({
            error: "The token is either invalid or has expired",
        });
    }
}

async function isAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<any> {
    if (req.user.role !== Role.admin) {
        return res.status(403).json({
            error: "Forbidden",
        });
    }

    next();
}

export { isAdmin, isAuthorized };

