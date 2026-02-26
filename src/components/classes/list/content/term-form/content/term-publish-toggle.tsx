"use client";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";
import { Eye, EyeOff, Globe } from "lucide-react";
import { toast } from "sonner";

export function TermPublishToggle({
  termId,
  termName,
  published,
}: {
  termId: string;
  termName: string;
  published: boolean;
}) {
  const apiUtils = clientApi.useUtils();

  const { mutate: publishTerm, isPending: isPublishing } =
    clientApi.term.publish.useMutation({
      onSuccess: async () => {
        await apiUtils.term.byId.invalidate({ termId });
        await apiUtils.term.all.invalidate();
        toast.success(`"${termName}" published successfully`);
      },
    });

  const { mutate: unpublishTerm, isPending: isUnpublishing } =
    clientApi.term.unpublish.useMutation({
      onSuccess: async () => {
        await apiUtils.term.byId.invalidate({ termId });
        await apiUtils.term.all.invalidate();
        toast.success(`"${termName}" unpublished successfully`);
      },
    });

  const toggling = isPublishing || isUnpublishing;

  return (
    <WithPermission permissions={{ permission: { terms: ["publish"] } }}>
      <Item size="sm">
        <ItemMedia className="*:text-muted-foreground">
          {published ? <Eye /> : <EyeOff />}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{published ? "Published" : "Unpublished"}</ItemTitle>
          <ItemDescription>
            {published
              ? "Visible to volunteers or instructors"
              : "Not visible to volunteers or instructors"}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            checked={published}
            disabled={toggling}
            onCheckedChange={(checked) => {
              if (checked) {
                publishTerm({ termId });
              } else {
                unpublishTerm({ termId });
              }
            }}
          />
        </ItemActions>
      </Item>
      <Separator />
    </WithPermission>
  );
}
