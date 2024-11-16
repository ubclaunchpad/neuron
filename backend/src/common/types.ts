import { Request } from "express";

export interface AuthenticatedUserRequest extends Request {
    user?: {
        password: any;
        user_id: string;
        role: string;
    };
}

// Interface for the decoded data from the JWT
export interface DecodedJwtPayload {
    user_id: string;
}
