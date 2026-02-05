import type { IImageService } from "@/server/services/imageService";
import { randomUUID } from "crypto";

interface StoredImage {
  key: string;
  uploadedAt: Date;
}

export class MockImageService implements IImageService {
  public storedImages: Map<string, StoredImage> = new Map();
  public presignedUrls: string[] = [];

  async getPresignedUrl(
    fileExtension: string,
  ): Promise<{ url: string; key: string }> {
    const safeExt = (fileExtension ?? "").replace(/^\./, "");
    const key = safeExt ? `${randomUUID()}.${safeExt}` : randomUUID();
    const url = `https://mock-minio.test/upload/${key}`;

    this.presignedUrls.push(url);

    return { url, key };
  }

  async deleteImage(key: string): Promise<void> {
    this.storedImages.delete(key);
  }

  /**
   * Simulate an upload completing (for tests that need to verify uploaded images)
   */
  simulateUpload(key: string): void {
    this.storedImages.set(key, {
      key,
      uploadedAt: new Date(),
    });
  }

  clear(): void {
    this.storedImages.clear();
    this.presignedUrls = [];
  }
}
