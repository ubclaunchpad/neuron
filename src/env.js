import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const port = z.coerce.number().int().min(0).max(65535);

export const env = createEnv({
  /**
   * Server-side env vars
   */
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string().min(32),
    SMTP_HOST: z.string(),
    SMTP_PORT: port,
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    MAIL_FROM: z.string(),
    REDIS_URL: z.url(),
    MINIO_ROOT_USER: z.string(),
    MINIO_ROOT_PASSWORD: z.string(),
    MINIO_HOST: z.string(),
    MINIO_PORT: port,
    MINIO_BUCKET: z.string(),
    MINIO_USE_SSL: z.string().transform((val) => val === "true"),
    FILES_BASE_URL: z.url(),
    FILES_BUCKET: z.string(),
  },

  /**
   * Client-side env vars (must start with NEXT_PUBLIC_)
   */
  client: {},

  /**
   * Raw runtime env mapping
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: Number(process.env.SMTP_PORT),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM,
    REDIS_URL: process.env.REDIS_URL,
    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
    MINIO_HOST: process.env.MINIO_HOST,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,

    FILES_BASE_URL: process.env.FILES_BASE_URL,
    FILES_BUCKET: process.env.FILES_BUCKET,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
