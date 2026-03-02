import { toast } from "sonner";
import { clientApi } from "@/trpc/client";
import type { AvailabilitySchemaOutput } from "../schema";

export function useAvailabilitySubmit(userId: string, onSaveSuccess?: () => void) {
  const utils = clientApi.useUtils();

  const mutation = clientApi.volunteer.updateVolunteerAvailability.useMutation({
    onSuccess: async () => {
      void utils.volunteer.byId.invalidate({ userId });
      toast.success("Your availability has been successfully updated!");
      onSaveSuccess?.();
    },
  });

  const onSubmit = async (data: AvailabilitySchemaOutput) => {
    await mutation.mutateAsync({
      volunteerUserId: userId,
      availability: data.availability,
      preferredTimeCommitmentHours: data.preferredTimeCommitment,
    });
  };

  return {
    onSubmit,
    isPending: mutation.isPending,
  };
}