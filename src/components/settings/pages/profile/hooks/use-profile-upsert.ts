import { useState } from "react";
import { clientApi } from "@/trpc/client";
import { authClient } from "@/lib/auth/client";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { ProfileSchemaType } from "../schema";

export function useProfileUpsert(userId: string) {
  const utils = clientApi.useUtils();
  const { refetch: refetchSession } = authClient.useSession();
  const { uploadImage } = useImageUpload();

  const updateProfile =
    clientApi.volunteer.updateVolunteerProfile.useMutation({
      onSuccess: async () => {
        await utils.volunteer.byId.invalidate({ userId });
        await refetchSession();
      },
    });

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const onSubmit = async (data: ProfileSchemaType) => {
    const payload = { ...data };

    if (data.image) {
      payload.image = await uploadImage(data.image);
    }

    const result = await updateProfile.mutateAsync({
      volunteerUserId: userId,
      ...payload,
    });

    if (!result.ok) {
      throw new Error("Something went wrong.");
    }

    setSuccessMessage("Your profile has been successfully updated!");
  };

  return {
    onSubmit,
    successMessage,
    isPending: updateProfile.isPending,
  };
}
