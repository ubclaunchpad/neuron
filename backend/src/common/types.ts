import { NextFunction, Request, Response } from "express";
import { ValidationChain } from "express-validator";
import { UserDB, VolunteerDB } from "./databaseModels.js";

export type AuthenticatedRequest = Request & {
    user: UserDB
    volunteer?: VolunteerDB
}

/**
 * Interface for the decoded data from a JWT
 */
export interface DecodedJwtPayload {
    user_id: string;
}

export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export interface RouteGroup<T extends Request = Request> {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: T, res: Response, next: NextFunction) => void>;
    children: RouteDefinition[];
}

export interface RouteEndpoint<T extends Request = Request> {
    path: string;
    validation?: ValidationChain[];
    middleware?: Array<(req: T, res: Response, next: NextFunction) => void>;
    method: HTTPMethod;
    action: (req: T, res: Response, next: NextFunction) => Promise<any>;
}

/* We know the correct Request subtype, this prevents ts from getting mad */
export type RouteDefinition = RouteGroup<any> | RouteEndpoint<any>;


export type ListRequestOptions = {
    page?: number;
    perPage?: number;
    search?: string;
}

export type ListResponse<T> = {
    data: T[];
    totalCount: number;
}