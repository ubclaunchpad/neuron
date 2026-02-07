import { env } from "@/env";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";

import { randomUUID } from "crypto";
import * as Minio from "minio";

export interface IImageService {
  getPresignedUrl(fileExtension: string): Promise<{ url: string; key: string }>;
  deleteImage(key: string): Promise<void>;
}

export class ImageService implements IImageService {
  private readonly minio: Minio.Client;
  private readonly expiration = 5 * 60; // 5 mins
  private readonly bucket = env.MINIO_BUCKET ?? "neuron";
  private readonly bucketReady: Promise<void>;

  constructor() {
    const accessKey = env.MINIO_ROOT_USER;
    const secretKey = env.MINIO_ROOT_PASSWORD;

    if (!accessKey || !secretKey) {
      throw new Error(
        "MinIO credentials missing: set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD",
      );
    }

    const host = env.MINIO_HOST ?? "localhost";
    const port = env.MINIO_PORT ?? 9000;
    const useSSL = env.MINIO_USE_SSL ?? true;

    this.minio = new Minio.Client({
      endPoint: host,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.bucketReady = this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.minio.bucketExists(this.bucket);

      if (!exists) {
        await this.minio.makeBucket(this.bucket);
        await this.minio.setBucketPolicy(
          this.bucket,
          this.buildNeuronBucketPolicy(),
        );
      }
    } catch (error) {
      console.error("Error Ensuring Bucket: ", error);
      throw new NeuronError(
        "Storage bucket not available",
        NeuronErrorCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a presigned PUT URL for uploading an image.
   *
   * @param fileExtension - Extension of the file, e.g. "jpg", "png"
   * @returns `{ url, key }` where `key` is the MinIO object key
   */
  async getPresignedUrl(
    fileExtension: string,
  ): Promise<{ url: string; key: string }> {
    try {
      await this.bucketReady;

      const safeExt = (fileExtension ?? "").replace(/^\./, "");
      const key = safeExt ? `${randomUUID()}.${safeExt}` : randomUUID();

      const url = await this.minio.presignedUrl(
        "PUT",
        this.bucket,
        key,
        this.expiration,
      );

      return { url, key };
    } catch (error) {
      console.error("Error getting presigned PUT URL", error);
      throw new NeuronError(
        "Error getting presigned PUT URL",
        NeuronErrorCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete an image from storage by its object key.
   *
   * @param key - MinIO object key to delete
   */
  async deleteImage(key: string): Promise<void> {
    try {
      await this.bucketReady;

      await this.minio.removeObject(this.bucket, key);
    } catch (error: any) {
      // If you want "delete is idempotent", you can swallow not-found errors:
      if (error?.code === "NoSuchKey" || error?.code === "NotFound") {
        return;
      }

      console.error("Error deleting image from storage", error);
      throw new NeuronError(
        "Error deleting image from storage",
        NeuronErrorCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildNeuronBucketPolicy() {
    return JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
  }
}
