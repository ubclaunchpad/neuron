import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { GeneralProfileSchemaType } from "../schema";
import type { Session } from "@/lib/auth";

async function emailSubmit(
  data: GeneralProfileSchemaType,
  session: Session | null,
) {
  const nextEmail = data.email.trim();
  const currentEmail = session?.user?.email?.trim();
  if (nextEmail && currentEmail && nextEmail !== currentEmail) {
    const changeEmailResult = await authClient.changeEmail({
      newEmail: nextEmail,
      callbackURL: window.location.origin,
    });

    if (!changeEmailResult) {
      throw new Error(
        "Profile updated, but email change could not be started. Please try again.",
      );
    }

    if (changeEmailResult.error) {
      throw new Error(getBetterAuthErrorMessage(changeEmailResult.error.code));
    }

    toast.success(
      `A request to change your email address has been sent to the ${nextEmail}. Please check your inbox to confirm the change.`,
    );
  }
}

export function useGeneralProfileSubmit() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
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
      const updateResult = await authClient.updateUser({
        name: data.firstName,
        lastName: data.lastName,
        image: imageKey,
      });

      if (!updateResult) {
        throw new Error("Failed to update profile. Please try again.");
      }

      if (updateResult.error) {
        throw new Error(getBetterAuthErrorMessage(updateResult.error.code));
      }
      toast.success("Your profile has been successfully updated!");

      await emailSubmit(data, session);

      await refetchSession();
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
