import { useFileUpload } from "@/hooks/use-file-upload";
import { clientApi } from "@/trpc/client";

export function useClassImageUpload() {
  const { mutateAsync: getPresignedUrl } =
    clientApi.storage.getPresignedUrl.useMutation();

  const { upload: uploadToStorage } = useFileUpload({
    getPresignedUrl: () => getPresignedUrl({ fileExtension: "webp" }),
  });

  const uploadImage = async (imageUrl: string): Promise<string> => {
    const blob = await fetch(imageUrl).then((r) => r.blob());

    try {
      return await uploadToStorage({
        data: blob,
        contentType: "image/webp",
      });
    } catch {
      throw new Error("Failed to upload Class image");
    }
  };

  return { uploadImage };
}