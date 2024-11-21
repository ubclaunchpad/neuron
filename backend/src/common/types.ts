import { Request } from "express";

export interface AuthenticatedUserRequest extends Request {
    user?: {
        user_id: string;
    };
}

// Interface for the decoded data from the JWT
export interface DecodedJwtPayload {
    user_id: string;
}
