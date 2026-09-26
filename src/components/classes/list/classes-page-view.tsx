"use client";

import { PageLayout } from "@/components/page-layout";
import { parseAsString, useQueryState } from "nuqs";
import { ClassListView } from "./class-list-view";

export function ClassesPageView() {
  const [classId, setClassId] = useQueryState("classId", parseAsString);

  return (
    <PageLayout
      open={!!classId}
      onOpenChange={(open) => {
        if (!open) setClassId(null);
      }}
    >
      <ClassListView classId={classId} setClassId={setClassId} />
    </PageLayout>
  );
}
