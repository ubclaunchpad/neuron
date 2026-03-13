import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { GeneralProfileSchemaType } from "../schema";
import type { Session } from "@/lib/auth";

type GeneralProfileFormApi = {
  setValue: (
    name: "email",
    value: string,
    options?: {
      shouldDirty?: boolean;
      shouldTouch?: boolean;
      shouldValidate?: boolean;
    },
  ) => void;
};

async function emailSubmit(
  data: GeneralProfileSchemaType,
  session: Session | null,
): Promise<boolean> {
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
      `Profile updated. A confirmation link was sent to your current email. After you click it, we will send another verification email to ${nextEmail}.`,
    );
    return true;
  }

  return false;
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

      let emailChangeErrorMessage: string | null = null;
      let didRequestEmailChange = false;
      try {
        didRequestEmailChange = await emailSubmit(data, session);
      } catch (error) {
        emailChangeErrorMessage =
          error instanceof Error
            ? error.message
            : "Failed to start email change request.";
      }
      await refetchSession();
      if (emailChangeErrorMessage) {
        toast.warning(
          `Everything except your email was updated. ${emailChangeErrorMessage}`,
        );
        return { didRequestEmailChange: false };
      }
      return {
        didRequestEmailChange,
        currentSessionEmail: session?.user?.email?.trim(),
        requestedEmail: data.email.trim(),
      };
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const currentSessionEmail = session?.user?.email?.trim();
    if (
      pendingEmailChange &&
      currentSessionEmail &&
      pendingEmailChange === currentSessionEmail
    ) {
      setPendingEmailChange(null);
    }
  }, [pendingEmailChange, session?.user?.email]);

  return {
    onSubmit: async (
      data: GeneralProfileSchemaType,
      form: GeneralProfileFormApi,
    ) => {
      const result = await mutation.mutateAsync(data);
      if (!result?.didRequestEmailChange) return;
      setPendingEmailChange(result.requestedEmail ?? data.email.trim());

      const currentSessionEmail = result.currentSessionEmail;
      if (!currentSessionEmail) return;

      form.setValue("email", currentSessionEmail, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    },
    isPending: mutation.isPending,
    pendingEmailChange,
  };
}
