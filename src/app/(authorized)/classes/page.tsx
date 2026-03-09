"use client";

import { ClassListView } from "@/components/classes/list/class-list-view";
import { PageLayout } from "@/components/page-layout";
import { parseAsString, useQueryState } from "nuqs";

export default function ClassesPage() {
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
