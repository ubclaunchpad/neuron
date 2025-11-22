import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const port = z.coerce.number().int().min(0).max(65535);

export const env = createEnv({
  /**
   * Server-side env vars
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Database
    DATABASE_URL: z.url(),
    DATABASE_PASSWORD: z.string(),

    // Redis
    REDIS_URL: z.url(),
    REDIS_PASSWORD: z.string(),

    // Email
    SMTP_HOST: z.string(),
    SMTP_PORT: port,
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    MAIL_FROM: z.string(),

    // MinIO
    MINIO_ROOT_USER: z.string(),
    MINIO_ROOT_PASSWORD: z.string(),
    MINIO_HOST: z.string(),
    MINIO_PORT: port,
    MINIO_BUCKET: z.string(),
    MINIO_USE_SSL: z.enum(["true", "false"]).transform((val) => val === "true")
  },

  /**
   * Client-side env vars (must start with NEXT_PUBLIC_)
   */
  client: {
    NEXT_PUBLIC_FILES_BASE_URL: z.string(),
    NEXT_PUBLIC_FILES_BUCKET: z.string(),
  },

  /**
   * Raw runtime env mapping
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,

    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM,

    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
    MINIO_HOST: process.env.MINIO_HOST,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,

    NEXT_PUBLIC_FILES_BASE_URL: process.env.NEXT_PUBLIC_FILES_BASE_URL,
    NEXT_PUBLIC_FILES_BUCKET: process.env.NEXT_PUBLIC_FILES_BUCKET,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
