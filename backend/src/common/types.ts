import { Request } from "express";

export interface Instructor {
    instructor_id: string;
    fk_user_id?: string; // Foreign key (optional, since it might be nullable)
    f_name: string;
    l_name: string;
    email: string;
}

export interface AuthenticatedUserRequest extends Request {
    user?: {
        user_id: string;
    };
}

// Interface for the decoded data from the JWT
export interface DecodedJwtPayload {
    user_id: string;
}
