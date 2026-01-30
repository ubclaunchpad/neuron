import { describe, it, expect } from "vitest";
import { MockEmailService } from "../mocks/mock-email-service";
import { MockImageService } from "../mocks/mock-image-service";

describe("MockEmailService", () => {
  it("should store sent emails", async () => {
    const emailService = new MockEmailService();

    await emailService.send("test@example.com", "Hello", "World");
    await emailService.send("other@example.com", "Subject", "Body", "<p>Body</p>");

    expect(emailService.getAllEmails()).toHaveLength(2);
    expect(emailService.getLastEmail()?.to).toBe("other@example.com");
    expect(emailService.getEmailsTo("test@example.com")).toHaveLength(1);
  });

  it("should clear emails", async () => {
    const emailService = new MockEmailService();

    await emailService.send("test@example.com", "Hello", "World");
    emailService.clear();

    expect(emailService.getAllEmails()).toHaveLength(0);
  });
});

describe("MockImageService", () => {
  it("should generate presigned URLs", async () => {
    const imageService = new MockImageService();

    const { url, key } = await imageService.getPresignedUrl("png");

    expect(url).toContain("mock-minio.test");
    expect(key).toMatch(/\.png$/);
  });

  it("should track uploaded images", async () => {
    const imageService = new MockImageService();

    const { key } = await imageService.getPresignedUrl("jpg");
    imageService.simulateUpload(key);

    expect(imageService.storedImages.has(key)).toBe(true);
  });

  it("should delete images", async () => {
    const imageService = new MockImageService();

    const { key } = await imageService.getPresignedUrl("jpg");
    imageService.simulateUpload(key);
    await imageService.deleteImage(key);

    expect(imageService.storedImages.has(key)).toBe(false);
  });
});
