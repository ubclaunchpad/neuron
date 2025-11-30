import type { SingleClass } from "@/models/class";
import type { Term } from "@/models/term";
import { useEffect } from "react";
import {
  PageLayout,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "../../page-layout";
import { ClassFormActions } from "./class-form-actions";
import { ClassFormProvider } from "./class-form-provider";
import { ClassGeneralSection } from "./content/class-general-section";
import { ClassSchedulesSection } from "./content/class-schedules-sections";
import { useClassUpsert } from "./hooks/use-class-upsert";
import { classToFormValues } from "./utils";

export function ClassEditShell({
  editingClass,
  currentTerm,
  queryTermId,
  isLoading,
}: {
  editingClass?: SingleClass;
  currentTerm?: Term;
  queryTermId: string | null;
  isLoading: boolean;
}) {
  const isEditing = !!editingClass;
  const initial = classToFormValues(editingClass);

  const { onSubmit, isPending, handleSaveAndPublish } = useClassUpsert({
    isEditing,
    editingClass,
    currentTerm,
    queryTermId,
  });

  // Warn before navigating away during submission
  useEffect(() => {
    if (!isPending) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPending]);

  return (
    <ClassFormProvider
      initial={initial}
      onSubmit={onSubmit}
      isEditing={isEditing}
      editingClassId={editingClass?.id}
      isClassPublished={isEditing && (editingClass?.published ?? false)}
    >
      <PageLayout>
        <PageLayoutHeader border="scroll">
          <PageLayoutHeaderContent showBackButton>
            <PageLayoutHeaderTitle>
              {isEditing ? "Edit Class" : "Create Class"}
            </PageLayoutHeaderTitle>
            {!isLoading && (
              <ClassFormActions
                isPending={isPending}
                onSaveAndPublish={handleSaveAndPublish}
              />
            )}
          </PageLayoutHeaderContent>
        </PageLayoutHeader>

        <PageLayoutContent>
          <div className="flex flex-col gap-8 p-9 pt-4">
            {isLoading ? (
              <div>Loading Class Data...</div>
            ) : (
              <>
                <ClassGeneralSection />
                <ClassSchedulesSection />
              </>
            )}
          </div>
        </PageLayoutContent>
      </PageLayout>
    </ClassFormProvider>
  );
}
