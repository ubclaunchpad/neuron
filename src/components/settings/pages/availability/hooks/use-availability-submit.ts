import { toast } from "sonner";
import { clientApi } from "@/trpc/client";
import type { AvailabilitySchemaOutput } from "../schema";

export function useAvailabilitySubmit(onSaveSuccess?: () => void) {
  const utils = clientApi.useUtils();

  const mutation = clientApi.volunteer.updateVolunteerAvailability.useMutation({
    onSuccess: async () => {
      void utils.volunteer.me.invalidate();
      toast.success("Your availability has been updated.");
      onSaveSuccess?.();
    },
  });

  const onSubmit = async (data: AvailabilitySchemaOutput) => {
    await mutation.mutateAsync({
      availability: data.availability,
      preferredTimeCommitmentHours: data.preferredTimeCommitment,
    });
  };

  return {
    onSubmit,
    isPending: mutation.isPending,
  };
}
