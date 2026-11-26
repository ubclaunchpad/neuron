import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  bucketExistsMock,
  makeBucketMock,
  setBucketPolicyMock,
  removeObjectMock,
} = vi.hoisted(() => ({
  bucketExistsMock: vi.fn(),
  makeBucketMock: vi.fn(),
  setBucketPolicyMock: vi.fn(),
  removeObjectMock: vi.fn(),
}));

vi.mock("minio", () => ({
  Client: vi.fn(function () {
    return {
      bucketExists: bucketExistsMock,
      makeBucket: makeBucketMock,
      setBucketPolicy: setBucketPolicyMock,
      removeObject: removeObjectMock,
    };
  }),
}));

import { ImageService } from "@/server/services/imageService";

describe("ImageService bucket readiness recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries bucket initialization after a transient failure and succeeds on retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    bucketExistsMock
      .mockRejectedValueOnce(new Error("MinIO starting up"))
      .mockResolvedValueOnce(true);
    setBucketPolicyMock.mockResolvedValue(undefined);
    removeObjectMock.mockResolvedValue(undefined);

    const imageService = new ImageService();

    await expect(imageService.deleteImage("stale.webp")).rejects.toThrow(
      "Error deleting image from storage",
    );
    await expect(
      imageService.deleteImage("stale.webp"),
    ).resolves.toBeUndefined();

    expect(bucketExistsMock).toHaveBeenCalledTimes(2);
    expect(setBucketPolicyMock).toHaveBeenCalledTimes(1);
    expect(removeObjectMock).toHaveBeenCalledTimes(1);
    expect(removeObjectMock).toHaveBeenCalledWith(
      expect.any(String),
      "stale.webp",
    );
  });

  it("re-applies bucket policy on retry if makeBucket succeeded before setBucketPolicy failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    bucketExistsMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    makeBucketMock.mockResolvedValueOnce(undefined);
    setBucketPolicyMock
      .mockRejectedValueOnce(new Error("policy write failed"))
      .mockResolvedValueOnce(undefined);
    removeObjectMock.mockResolvedValue(undefined);

    const imageService = new ImageService();

    await expect(imageService.deleteImage("stale.webp")).rejects.toThrow(
      "Error deleting image from storage",
    );
    await expect(
      imageService.deleteImage("stale.webp"),
    ).resolves.toBeUndefined();

    expect(makeBucketMock).toHaveBeenCalledTimes(1);
    expect(setBucketPolicyMock).toHaveBeenCalledTimes(2);
    expect(removeObjectMock).toHaveBeenCalledTimes(1);
  });
});
