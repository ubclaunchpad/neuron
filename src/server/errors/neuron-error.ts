import { TRPCError } from "@trpc/server";

export class NeuronError extends TRPCError {
  constructor(message: string, code: TRPCError["code"]) {
    super({ message, code });
  }
}

export const NeuronErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;