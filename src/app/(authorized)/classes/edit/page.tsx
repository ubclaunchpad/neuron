"use client";

import { parseAsString, useQueryState } from "nuqs";

import {
  ClassForm,
  type ClassEditSchemaType,
  type ClassFormValues,
} from "@/components/classes/forms/class-form";
import {
  PageLayout,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/primitives/spinner";
import { Loader } from "@/components/utils/loader";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getImageUrlFromKey } from "@/lib/build-image-url";
import type { CreateClassInput, UpdateClassInput } from "@/models/api/class";
import type { SingleClass } from "@/models/class";
import { clientApi } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function toFormValues(cls?: SingleClass): ClassEditSchemaType {
  return {
    name: cls?.name ?? "",
    description: cls?.description ?? "",
    meetingURL: cls?.meetingURL ?? "",
    category: cls?.category ?? "",
    subcategory: cls?.subcategory ?? "",
    image: getImageUrlFromKey(cls?.image) ?? null,
    levelRange: [cls?.lowerLevel ?? 1, cls?.upperLevel ?? 4],
    schedules:
      cls?.schedules.map((s) => ({
        id: s.id,
        localStartTime: s.localStartTime,
        localEndTime: s.localEndTime,
        tzid: s.tzid,
        volunteerUserIds: s.volunteers.map((v) => v.id),
        instructorUserIds: s.instructors.map((i) => i.id),
        rule: {
          type: s.rule.type,
          extraDates: s.rule.type === "single" ? s.rule.extraDates : [],
          weekday: s.rule.type !== "single" ? s.rule.weekday : "MO",
          nth: s.rule.type === "monthly" ? s.rule.nth : 1,
          interval: s.rule.type === "weekly" ? s.rule.interval : 1,
        },
        effectiveStart: s.effectiveStart,
        effectiveEnd: s.effectiveEnd,
      })) ?? [],
  };
}

export default function ClassesEditView() {
  const [queryClassId, setQueryClassId] = useQueryState("class", parseAsString);
  const [queryTermId] = useQueryState("term", parseAsString);
  const router = useRouter();
  const apiUtils = clientApi.useUtils();
  const isEditing = !!queryClassId;

  const { data: editingClassData, isPending: isLoadingEditingClass } =
    clientApi.class.byId.useQuery(
      { classId: queryClassId ?? "" },
      { enabled: isEditing },
    );

  const { data: currentTermData, isPending: isLoadingCurrentTerm } =
    clientApi.term.current.useQuery(undefined, {
      enabled: !queryTermId && !isEditing,
    });

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

  const { mutateAsync: getPresignedUrl } =
    clientApi.storage.getPresignedUrl.useMutation();
  const { upload: uploadToStorage } = useFileUpload({
    getPresignedUrl: () => getPresignedUrl({ fileExtension: "webp" }),
  });

  const loading = isEditing ? isLoadingEditingClass : isLoadingCurrentTerm;
  const initial = toFormValues(editingClassData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit = async (data: ClassFormValues) => {
    try {
      setIsSubmitting(true);
      await submitHandler(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHandler = async (data: ClassFormValues) => {
    const payload: ClassFormValues = { ...data };

    // New image uploaded, we have a blob url
    if (!!data.image) {
      // Grab blob from browser and clean up
      const blob = await fetch(payload.image!).then((r) => r.blob());

      // Upload to storage
      let remoteImageUrl;
      try {
        remoteImageUrl = await uploadToStorage({
          data: blob,
          contentType: "image/webp",
        });
      } catch {
        toast.error("Failed to upload Class image.");
        return;
      }

      // Update the image field to remote url
      payload.image = remoteImageUrl;
    }

    if (isEditing) {
      updateClass({
        id: queryClassId,
        ...payload,
      } satisfies UpdateClassInput);
    } else {
      const {
        meetingURL,
        description,
        addedSchedules,
        category,
        subcategory,
        name,
        lowerLevel,
        upperLevel,
        image,
      } = payload;

      const termId =
        !queryTermId || queryTermId === "current"
          ? currentTermData!.id
          : queryTermId;

      await createClass({
        termId,
        name: name!,
        lowerLevel: lowerLevel!,
        upperLevel: upperLevel!,
        category: category!,
        subcategory: subcategory ?? undefined,
        image: image ?? undefined,
        meetingURL: meetingURL ?? undefined,
        description: description ?? undefined,
        schedules: addedSchedules,
      } satisfies CreateClassInput);
    }
  };

  return (
    <PageLayout>
      <PageLayoutHeader border="scroll">
        <PageLayoutHeaderContent showBackButton>
          <PageLayoutHeaderTitle>
            {isEditing ? "Edit Class" : "Create Class"}
          </PageLayoutHeaderTitle>

          <Button
            form="class-form"
            type="submit"
            size="sm"
            className="self-justify-end"
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            <span>Save</span>
          </Button>
        </PageLayoutHeaderContent>
      </PageLayoutHeader>

      <PageLayoutContent>
        <Loader isLoading={loading} fallback={"Loading class data"}>
          <ClassForm
            key={isEditing ? queryClassId : "create"}
            initial={initial}
            onSubmit={onSubmit}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
          />
        </Loader>
      </PageLayoutContent>
    </PageLayout>
  );
}
