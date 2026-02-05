import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { GeneralProfileSchemaType } from "../schema";

export function useGeneralProfileSubmit() {
  const { refetch: refetchSession } = authClient.useSession();
  const { uploadImage } = useImageUpload();

  const mutation = useMutation({
    mutationFn: async (data: GeneralProfileSchemaType) => {
      let imageKey: string | null = null;

      if (data.image?.startsWith("blob:")) {
        // New image selected - upload it
        imageKey = await uploadImage(data.image);
      } else if (data.image) {
        // Existing image URL - extract key from URL or use as-is
        const parts = data.image.split("/");
        imageKey = parts[parts.length - 1] ?? data.image;
      }
      // If data.image is null/undefined, imageKey stays null (clear image)

      const { error } = await authClient.updateUser({
        name: data.firstName,
        lastName: data.lastName,
        image: imageKey,
      });

      if (error) {
        throw new Error(getBetterAuthErrorMessage(error.code));
      }

      await refetchSession();
    },
    onSuccess: () => {
      toast.success("Your profile has been successfully updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    onSubmit: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
