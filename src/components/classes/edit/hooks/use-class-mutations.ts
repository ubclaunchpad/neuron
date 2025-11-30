import { clientApi } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";

export function useClassMutations() {
  const [_, setQueryClassId] = useQueryState("class", parseAsString);
  const router = useRouter();
  const apiUtils = clientApi.useUtils();

  const { mutateAsync: createClass } = clientApi.class.create.useMutation({
    onSuccess: async (createdId) => {
      await setQueryClassId(createdId);
      await apiUtils.class.list.invalidate();
      router.back();
    },
  });

  const { mutateAsync: updateClass } = clientApi.class.update.useMutation({
    onSuccess: async (_, { id }) => {
      await apiUtils.class.byId.invalidate({ classId: id });
      await apiUtils.class.list.invalidate();
      router.back();
    },
  });

  const { mutateAsync: publishClass } = clientApi.class.publish.useMutation({
    onSuccess: async (_, { classId }) => {
      await apiUtils.class.byId.invalidate({ classId });
      router.back();
    },
  });

  return { createClass, updateClass, publishClass };
}