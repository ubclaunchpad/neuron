import { Request } from "express";

export type AuthenticatedUserRequest = Request & {
    user?: {
        password: string;
        user_id: string;
        role: string;
    };
}

// Interface for the decoded data from the JWT
export interface DecodedJwtPayload {
    user_id: string;
}
