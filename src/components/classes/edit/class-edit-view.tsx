"use client";

import { parseAsString, useQueryState } from "nuqs";

import { ClassEditShell } from "@/components/classes/edit/class-form-shell";
import { clientApi } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function ClassEditView() {
  const router = useRouter();
  const [queryClassId] = useQueryState("class", parseAsString);
  const [queryTermId] = useQueryState("term", parseAsString);
  const isEditing = !!queryClassId;

  const {
    data: editingClassData,
    isPending: isLoadingEditingClass,
    isError: isErrorFetchingClass,
  } = clientApi.class.byId.useQuery(
    { classId: queryClassId ?? "" },
    {
      enabled: isEditing,
      retry: false,
      meta: { suppressToast: true },
    },
  );

  const { data: currentTermData, isPending: isLoadingCurrentTerm } =
    clientApi.term.current.useQuery(undefined, {
      enabled: !queryTermId && !isEditing,
    });

  const isLoading = isEditing ? isLoadingEditingClass : isLoadingCurrentTerm;

  // Navigate user how if class doesn't exist
  useEffect(() => {
    if (isEditing && isErrorFetchingClass) {
      router.replace("/classes");
    }
  }, [queryClassId, isErrorFetchingClass, router]);

  return (
    <ClassEditShell
      key={editingClassData ? `edit-${editingClassData.id}` : "create"}
      editingClass={editingClassData}
      currentTerm={currentTermData}
      queryTermId={queryTermId}
      isLoading={isLoading}
    />
  );
}
