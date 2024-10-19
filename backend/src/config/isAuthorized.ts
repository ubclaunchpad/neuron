import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Response, NextFunction } from "express";
import { AuthenticatedUserRequest, DecodedJwtPayload } from "../common/types";
import { getUserById } from "../controllers/userController";

// Load environment variables
dotenv.config();

// Define environment variables
const TOKEN_SECRET = process.env.TOKEN_SECRET;

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
            const result = await getUserById(decoded.user_id);

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
        return res.status(400).json({
            error: "The token is either invalid or has expired",
        });
    }
}

export { isAuthorized };
