import { env } from "@/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    filesBaseUrl: env.FILES_BASE_URL,
    filesBucket: env.FILES_BUCKET,
  });
}
