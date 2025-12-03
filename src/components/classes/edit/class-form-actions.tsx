import { DeleteClassButton } from "@/components/classes/primitives/delete-class-button";
import { Button } from "@/components/primitives/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { PublishClassButton } from "../primitives/publish-class-button";
import { useClassForm } from "./class-form-provider";
import { useRouter } from "next/navigation";

export function ClassFormActions({
  isPending,
  onSaveAndPublish,
}: {
  isPending: boolean;
  onSaveAndPublish: () => void;
}) {
  const {
    form: { formState },
    isClassPublished,
    isEditing,
    editingClassId,
  } = useClassForm();
  const router = useRouter();
  const isDirty = formState.isDirty;

  const canPublish = !isEditing || !isClassPublished;
  const showSaveAndPublish = canPublish && isDirty;
  const showPublishOnlyButton = !showSaveAndPublish;

  return (
    <ButtonGroup className="self-justify-end">
      <ButtonGroup>
        {showSaveAndPublish && (
          <Button
            type="submit"
            variant="outline"
            size="icon-sm"
            pending={isPending}
            startIcon={<ClassIcon className="scale-90" />}
            onClick={onSaveAndPublish}
            tooltip={"Save and publish"}
          >
            Save and publish
          </Button>
        )}
        {showPublishOnlyButton && (
          <PublishClassButton
            variant="outline"
            size="icon-sm"
            pending={isPending}
            disabled={isClassPublished}
            tooltip="Publish"
            classId={editingClassId!}
          />
        )}
        {isEditing && (
          <DeleteClassButton
            size="icon-sm"
            classId={editingClassId!}
            tooltip="Delete"
            onSuccess={() => router.push("/classes")}
          />
        )}
      </ButtonGroup>
      <ButtonGroupSeparator />
      <ButtonGroup>
        <Button type="submit" size="sm" pending={isPending} disabled={!isDirty}>
          Save
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  );
}
