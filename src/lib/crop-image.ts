export type CroppedImageResult = {
    blob: Blob;
    previewUrl: string;
    width: number;
    height: number;
    contentType: string;
    fileName: string;
};

export type CropImageOptions = {
    size?: number;
    mimeType?: string;
    quality?: number;
};

/**
 * Center-crops an image to a 1:1 square and resizes to `size`x`size`.
 * Returns a blob + preview URL. Runs entirely in the browser.
 */
export async function cropImageToSquare(
    file: File,
    {
        size = 512,
        mimeType = "image/webp",
        quality = 0.8,
    }: CropImageOptions = {},
): Promise<CroppedImageResult> {
    const img = new Image();
    const src = URL.createObjectURL(file);

    try {
        // Load the image
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = src;
        });

        // Prepare canvas
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get 2D context");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Center crop
        const cropSize = Math.min(img.width, img.height);
        const sourceX = (img.width - cropSize) / 2;
        const sourceY = (img.height - cropSize) / 2;

        ctx.drawImage(
            img,
            sourceX,
            sourceY,
            cropSize,
            cropSize,
            0,
            0,
            size,
            size,
        );

        // Canvas to blob
        const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => {
                    if (!b) {
                        reject(new Error("Failed to create image blob"));
                        return;
                    }
                    resolve(b);
                },
                mimeType,
                quality,
            );
        });

        const previewUrl = URL.createObjectURL(blob);

        // Build filename with new extension
        const extension =
            mimeType === "image/webp"
                ? "webp"
                : mimeType === "image/jpeg"
                    ? "jpg"
                    : mimeType === "image/png"
                        ? "png"
                        : "";
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const fileName = extension ? `${baseName}.${extension}` : file.name;

        return {
            blob,
            previewUrl,
            width: size,
            height: size,
            contentType: mimeType,
            fileName,
        };
    } finally {
        // Clean up original object URL
        URL.revokeObjectURL(src);
    }
}
