import { clientApi } from "@/trpc/client";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { Button } from "../../primitives/button";
import { WithPermission } from "../../utils/with-permission";

export function PublishClassButton({
  className,
  classId,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  classId: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const apiUtils = clientApi.useUtils();
  const { mutate: publishClass, isPending } =
    clientApi.class.publish.useMutation({
      onSuccess: (_, { classId }) => {
        void apiUtils.class.byId.invalidate({ classId });
        onSuccess?.();
      },
    });

  return (
    <WithPermission permissions={{ permission: { classes: ["create"] } }}>
      <Button
        onClick={() => publishClass({ classId })}
        startIcon={<ClassIcon className="scale-90" />}
        pending={isPending}
        {...props}
      >
        Publish
      </Button>
    </WithPermission>
  );
}
