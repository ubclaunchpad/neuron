import { NextFunction, Request, Response } from "express";
import { ValidationChain } from "express-validator";

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

export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export interface RouteGroup {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    children: RouteDefinition[];
}

export interface RouteEndpoint {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
    method: HTTPMethod;
    action: (req: Request, res: Response, next: NextFunction) => Promise<any>;
}

export type RouteDefinition = RouteGroup | RouteEndpoint;

