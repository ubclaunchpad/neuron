import { useState } from "react";
import { clientApi } from "@/trpc/client";
import { authClient } from "@/lib/auth/client";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { ProfileSchemaType } from "../schema";

export function useProfileUpsert(userId: string, isVolunteer: boolean) {
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

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: ProfileSchemaType) => {
    setIsUpdating(true);
    
    try {
      const payload = { ...data };

      if (data.image) {
        payload.image = await uploadImage(data.image);
      }

      if (isVolunteer) {
        const result = await updateProfile.mutateAsync({
          volunteerUserId: userId,
          ...payload,
        });

        if (!result.ok) {
          throw new Error("Something went wrong.");
        }
      } else {
        await authClient.updateUser({
          name: payload.firstName,
          lastName: payload.lastName,
          image: payload.image,
        });
        
        await refetchSession();
      }

      setSuccessMessage("Your profile has been successfully updated!");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    onSubmit,
    successMessage,
    isPending: isVolunteer ? updateProfile.isPending : isUpdating,
  };
}