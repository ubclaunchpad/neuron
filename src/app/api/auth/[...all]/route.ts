import { auth } from "@/lib/auth/index";
import { toNextJsHandler } from "better-auth/next-js";

// Provide better debugging
const originalHandler = auth.handler;
const handler = async (request: Request) => {
  try {
    return await originalHandler.call(auth, request);
  } catch (error) {
    console.error(
      `Error stack:`,
      error instanceof Error ? error.stack : "No stack trace",
    );
    throw error;
  }
};

export const { GET, POST } = toNextJsHandler(handler);
