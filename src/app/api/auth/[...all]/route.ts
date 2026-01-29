import { auth } from "@/lib/auth/index";
import { headers } from "next/headers";
import { toNextJsHandler } from "better-auth/next-js";

export async function GET(req: Request) {
  const h = await headers();
  console.log("host", h.get("host"));
  console.log("x-forwarded-host", h.get("x-forwarded-host"));
  console.log("x-forwarded-proto", h.get("x-forwarded-proto"));
  console.log("req.url", req.url);
  return Response.json({ ok: true });
}

export const { POST } = toNextJsHandler(auth.handler);
