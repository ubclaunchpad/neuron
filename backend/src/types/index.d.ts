import {User} from "lucia";

declare global {
    namespace Express {
        interface Locals {
            user: {
                email: string;
                id: string;
            } & User | null;
        }

        interface Response {
            locals: Locals;
        }
    }
}

export {};