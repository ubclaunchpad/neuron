import { toast } from "sonner";
import { clientApi } from "@/trpc/client";
import type { VolunteerProfileSchemaType } from "../schema";

export function useVolunteerProfileSubmit() {
  const utils = clientApi.useUtils();

  const mutation = clientApi.volunteer.updateVolunteerProfile.useMutation({
    onSuccess: async () => {
      void utils.volunteer.me.invalidate();
      toast.success("Your volunteer profile has been updated.");
    },
  });

  const onSubmit = async (data: VolunteerProfileSchemaType) => {
    await mutation.mutateAsync(data);
  };

  return {
    onSubmit,
    isPending: mutation.isPending,
  };
}
