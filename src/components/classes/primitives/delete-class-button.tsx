import { clientApi } from "@/trpc/client";
import { Trash2 } from "lucide-react";
import { Button } from "../../primitives/button";
import { ConfirmDialog } from "../../primitives/confirm-dialog";
import { WithPermission } from "../../utils/with-permission";

export function DeleteClassButton({
  className,
  classId,
  classLabel,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "variant"> & {
  classId: string;
  classLabel: string;
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
      <ConfirmDialog
        title={`Delete “${classLabel}”?`}
        description="This will permanently delete this class, including its schedules, shifts, assignments, and coverage requests. This action cannot be undone."
        confirmLabel="Delete class"
        cancelLabel="Keep class"
        confirmVariant="destructive"
      >
        <Button
          variant="destructive-outline"
          className={className}
          startIcon={<Trash2 />}
          pending={isPending}
          onClick={() => deleteClass({ classId })}
          {...props}
        >
          Delete
        </Button>
      </ConfirmDialog>
    </WithPermission>
  );
}
