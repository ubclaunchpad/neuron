import { NextFunction, Request, Response } from "express";
import { ValidationChain } from "express-validator";
import { UserDB } from "./generated.js";

export type AuthenticatedRequest = Request & {
    user?: RequestUser
}

/**
 * UserDB with password excluded
 */
export type RequestUser = Pick<UserDB, Exclude<keyof UserDB, "password">>;

/**
 * Interface for the decoded data from a JWT
 */
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

