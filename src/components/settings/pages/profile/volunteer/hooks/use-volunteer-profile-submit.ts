import { toast } from "sonner";
import { clientApi } from "@/trpc/client";
import type { VolunteerProfileSchemaType } from "../schema";

export function useVolunteerProfileSubmit(userId: string) {
  const utils = clientApi.useUtils();

  const mutation = clientApi.volunteer.updateVolunteerProfile.useMutation({
    onSuccess: async () => {
      void utils.volunteer.byId.invalidate({ userId });
      toast.success("Your volunteer profile has been successfully updated!");
    },
  });

  const onSubmit = async (data: VolunteerProfileSchemaType) => {
    await mutation.mutateAsync({
      volunteerUserId: userId,
      ...data,
    });
  };

  return {
    onSubmit,
    isPending: mutation.isPending,
  };
}
