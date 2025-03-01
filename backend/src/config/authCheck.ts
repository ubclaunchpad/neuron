import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../common/interfaces.js";
import {
    AuthenticatedRequest,
    DecodedJwtPayload
} from "../common/types.js";
import { userModel } from "./models.js";

// Load environment variables
dotenv.config();

// Define environment variables
const TOKEN_SECRET = process.env.TOKEN_SECRET;

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
        
        const result = await userModel.getUserById(decoded.user_id);

        // Attach the user to the request
        (req as AuthenticatedRequest).user = result;

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

