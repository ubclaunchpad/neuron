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

type SubmitResult = {
  didRequestEmailChange: boolean;
  currentSessionEmail?: string;
  requestedEmail?: string;
};

function getRequestedEmail(data: GeneralProfileSchemaType): string {
  return data.email.trim();
}

function getCurrentSessionEmail(session: Session | null): string {
  return session?.user?.email?.trim() ?? "";
}

function getImageKeyFromValue(image: string | null | undefined): string | null {
  if (!image) return null;
  const parts = image.split("/");
  return parts[parts.length - 1] ?? image;
}

function buildProfileUpdateSuccessMessage(requestedEmail?: string): string {
  if (!requestedEmail) {
    return "Your profile has been successfully updated!";
  }

  return `Your profile has been successfully updated! A confirmation link was sent to your current email. After you click it, we will send a verification email to ${requestedEmail}.`;
}

async function requestEmailChangeIfNeeded({
  requestedEmail,
  currentSessionEmail,
}: {
  requestedEmail: string;
  currentSessionEmail: string;
}): Promise<boolean> {
  if (!requestedEmail || !currentSessionEmail) return false;
  if (requestedEmail === currentSessionEmail) return false;

  const changeEmailResult = await authClient.changeEmail({
    newEmail: requestedEmail,
    callbackURL: window.location.origin,
  });

  if (!changeEmailResult) {
    throw new Error("Profile updated, but email change could not be started. Please try again.");
  }
  if (changeEmailResult.error) {
    throw new Error(getBetterAuthErrorMessage(changeEmailResult.error.code));
  }
  return true;
}

export function useGeneralProfileSubmit() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { uploadImage } = useImageUpload();

  const mutation = useMutation({
    mutationFn: async (data: GeneralProfileSchemaType) => {
      const requestedEmail = getRequestedEmail(data);
      const currentSessionEmail = getCurrentSessionEmail(session);
      let imageKey = getImageKeyFromValue(data.image);

      if (data.image?.startsWith("blob:")) {
        // New image selected - upload it
        imageKey = await uploadImage(data.image);
      }

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
        didRequestEmailChange = await requestEmailChangeIfNeeded({
          requestedEmail,
          currentSessionEmail,
        });
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

      toast.success(
        buildProfileUpdateSuccessMessage(
          didRequestEmailChange ? requestedEmail : undefined,
        ),
        didRequestEmailChange ? { duration: 30000, dismissible: true } : undefined,
      );

      return {
        didRequestEmailChange,
        currentSessionEmail,
        requestedEmail,
      } satisfies SubmitResult;
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
      setPendingEmailChange(result.requestedEmail ?? getRequestedEmail(data));

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
