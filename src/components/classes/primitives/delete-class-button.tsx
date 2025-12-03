import { cn } from "@/lib/utils";
import { clientApi } from "@/trpc/client";
import { Trash2 } from "lucide-react";
import { Button } from "../../primitives/button";
import { WithPermission } from "../../utils/with-permission";

export function DeleteClassButton({
  className,
  classId,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "variant"> & {
  classId: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const apiUtils = clientApi.useUtils();
  const { mutate: deleteClass, isPending } = clientApi.class.delete.useMutation(
    {
      onSuccess: (_, { classId }) => {
        onSuccess?.();
        apiUtils.class.byId.setData({ classId }, undefined);
        void apiUtils.class.byId.invalidate(
          { classId },
          { refetchType: "none" },
        );
        void apiUtils.class.list.invalidate();
      },
    },
  );

  return (
    <WithPermission permissions={{ permission: { classes: ["delete"] } }}>
      <Button
        variant="outline"
        className={cn(
          "text-destructive hover:text-destructive hover:bg-destructive/10",
          className,
        )}
        startIcon={<Trash2 />}
        pending={isPending}
        onClick={() => deleteClass({ classId })}
        {...props}
      >
        Delete
      </Button>
    </WithPermission>
  );
}
