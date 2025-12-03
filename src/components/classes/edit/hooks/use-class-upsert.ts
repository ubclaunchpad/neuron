import type { CreateClassInput, UpdateClassInput } from "@/models/api/class";
import type { SingleClass } from "@/models/class";
import type { Term } from "@/models/term";
import { useState } from "react";
import { toast } from "sonner";
import type { ClassFormValues } from "../schema";
import { useClassImageUpload } from "./use-class-image-upload";
import { useClassMutations } from "./use-class-mutations";

export function useClassUpsert({
  isEditing,
  editingClass,
  currentTerm,
  queryTermId,
}: {
  isEditing: boolean;
  editingClass?: SingleClass;
  currentTerm?: Term;
  queryTermId: string | null;
}) {
  const [isPending, setIsSubmitting] = useState(false);
  const [isSaveAndPublish, setSaveAndPublish] = useState(false);

  const { createClass, updateClass, publishClass } = useClassMutations();
  const { uploadImage } = useClassImageUpload();

  const submitHandler = async (data: ClassFormValues): Promise<string> => {
    const payload = { ...data };

    // Handle image upload
    if (data.image) {
      payload.image = await uploadImage(data.image);
    }

    if (isEditing) {
      await updateClass({
        id: editingClass!.id,
        ...payload,
      } satisfies UpdateClassInput);
      return editingClass!.id;
    }

    const termId =
      !queryTermId || queryTermId === "current" ? currentTerm!.id : queryTermId;

    const createdId = await createClass({
      termId,
      name: payload.name!,
      lowerLevel: payload.lowerLevel!,
      upperLevel: payload.upperLevel!,
      category: payload.category!,
      subcategory: payload.subcategory ?? undefined,
      image: payload.image ?? undefined,
      meetingURL: payload.meetingURL ?? undefined,
      description: payload.description ?? undefined,
      schedules: payload.addedSchedules,
    } satisfies CreateClassInput);

    return createdId;
  };

  const onSubmit = async (data: ClassFormValues) => {
    try {
      setIsSubmitting(true);
      const classId = await submitHandler(data);

      if (isSaveAndPublish) {
        await publishClass({ classId });
      }
    } catch (e: any) {
      toast.error(
        e.message || `Failed to ${isEditing ? "update" : "create"} class.`,
      );
    } finally {
      setSaveAndPublish(false);
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPublish = () => setSaveAndPublish(true);

  return {
    onSubmit,
    isPending,
    handleSaveAndPublish,
  };
}
