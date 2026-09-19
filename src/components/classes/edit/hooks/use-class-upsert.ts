import type { CreateClassInput, UpdateClassInput } from "@/models/api/class";
import type { SingleClass } from "@/models/class";
import type { Term } from "@/models/term";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ClassFormValues } from "../schema";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useClassMutations } from "./use-class-mutations";
import { useRouter } from "next/navigation";

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
  const saveAndPublishRef = useRef(false);
  const router = useRouter();

  const { createClass, updateClass, publishClass } = useClassMutations();
  const { uploadImage } = useImageUpload();

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
      lowerLevel: payload.lowerLevel ?? null,
      upperLevel: payload.upperLevel ?? null,
      category: payload.category!,
      subcategory: payload.subcategory ?? undefined,
      image: payload.image ?? undefined,
      description: payload.description ?? undefined,
      location: payload.location ?? undefined,
      locationType: payload.locationType ?? undefined,
      schedules: payload.addedSchedules,
    } satisfies CreateClassInput);

    return createdId;
  };

  const onSubmit = async (data: ClassFormValues) => {
    try {
      setIsSubmitting(true);
      const classId = await submitHandler(data);

      if (saveAndPublishRef.current) {
        await publishClass({ classId });
      }
      router.back();
    } catch (e: any) {
      toast.error(
        e.message || `Failed to ${isEditing ? "update" : "create"} class.`,
      );
    } finally {
      saveAndPublishRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPublish = () => {
    saveAndPublishRef.current = true;
  };

  return {
    onSubmit,
    isPending,
    handleSaveAndPublish,
  };
}
