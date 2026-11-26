import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";
import { Star } from "lucide-react";
import { Button } from "../../primitives/button";
import { Toggle } from "../../ui/toggle";
import { WithPermission } from "../../utils/with-permission";

export function StarClassButton({
  className,
  classId,
  ...props
}: Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "value" | "onChange"
> & {
  classId: string;
}) {
  const { user: currentUser } = useAuth();
  const apiUtils = clientApi.useUtils();
  const { data: preferenceData, isPending: preferenceLoading } =
    clientApi.volunteer.getClassPreference.useQuery(
      {
        classId,
      },
      {
        enabled: !!currentUser,
      },
    );

  const { mutate: setPreference, isPending } =
    clientApi.volunteer.setClassPreference.useMutation({
      async onMutate({ classId, preferred }) {
        await apiUtils.volunteer.getClassPreference.cancel({ classId }); // stop in-flight fetches
        const previous = apiUtils.volunteer.getClassPreference.getData({
          classId,
        });

        // optimistically update
        apiUtils.volunteer.getClassPreference.setData(
          { classId },
          { preferred },
        );

        return { previous };
      },
      onError(_, { classId }, ctx) {
        // rollback
        apiUtils.volunteer.getClassPreference.setData(
          { classId },
          ctx?.previous,
        );
      },
      async onSettled(_, __, { classId }) {
        // finally, grab the canonical state from the server
        await apiUtils.volunteer.getClassPreference.invalidate({
          classId,
        });
      },
    });

  return (
    <Button
      variant="outline"
      className={cn(
        "data-[toggle-state=on]:*:[svg]:fill-primary data-[toggle-state=on]:*:[svg]:stroke-primary",
        className,
      )}
      startIcon={<Star />}
      loading={preferenceLoading || !preferenceData || !currentUser}
      tooltip="Mark this class as preferred"
      asChild
      {...props}
    >
      <Toggle
        unstyled
        data-toggle-state={preferenceData?.preferred ? "on" : "off"}
        pressed={preferenceData?.preferred}
        onPressedChange={(next) =>
          setPreference({
            classId,
            preferred: next,
          })
        }
      >
        Star
      </Toggle>
    </Button>
  );
}
