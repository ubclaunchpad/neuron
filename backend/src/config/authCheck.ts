import dotenv from "dotenv";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import {
    AuthenticatedUserRequest,
    DecodedJwtPayload,
} from "../common/types.js";
import UserModel from "../models/userModel.js";

// Load environment variables
dotenv.config();

// Define environment variables
const TOKEN_SECRET = process.env.TOKEN_SECRET;

const userModel = new UserModel();

async function isAuthorized(
    req: AuthenticatedUserRequest,
    res: Response,
    next: NextFunction
): Promise<any> {
    // Get the token from the request body
    const token = req.body.token;

    // If the token is not provided, return an error message
    if (!token) {
        return res.status(400).json({
            error: "Missing required parameter: 'token'",
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

        try {
            const result = await userModel.getUserById(decoded.user_id);

            // Attach the user to the request
            req.user = result;
            // Call the next function
            next();
        } catch (error: any) {
            return res.status(error.status).json({
                error: error.message,
            });
        }
    } catch (err) {
        return res.status(401).json({
            error: "The token is either invalid or has expired",
        });
    }
}

async function isAdmin(
    req: AuthenticatedUserRequest,
    res: Response,
    next: NextFunction
): Promise<any> {
    if (!req.user) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "Forbidden",
        });
    }

    next();
}

export { isAdmin, isAuthorized };

