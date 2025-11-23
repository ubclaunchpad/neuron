"use client";

import { parseAsString, useQueryState } from "nuqs";
import "./page.scss";

import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { clientApi } from "@/trpc/client";

export default function ClassesEditView() {
  const [queryClassId, setQueryClassId] = useQueryState("classId", parseAsString);
  const apiUtils = clientApi.useUtils();

  const { 
    data: classData, 
    isPending: isLoadingClass, 
    isError: isClassError 
  } = clientApi.class.byId.useQuery(
    { classId: queryClassId ?? "" },
    { enabled: !!queryClassId }
  );

  const { mutate: createClass, isPending: isCreatingClass, isError: isCreatingClassError } = clientApi.class.create.useMutation({
    onSuccess: (createdId) => {
      void setQueryClassId(createdId);
      void apiUtils.class.list.invalidate();
    },
  });

  const { mutate: updateClass, isPending: isUpdatingClass, isError: isUpdatingClassError } = clientApi.class.update.useMutation({
    onSuccess: (_, { id }) => {
      void apiUtils.class.byId.invalidate({ classId: id });
      void apiUtils.class.list.invalidate();
    },
  });

  return (
    <PageLayout>
      <PageLayout.Header>
        <PageTitle title={queryClassId ? "Edit Class" : "Create Class"}/>
      </PageLayout.Header>

      <div className="classes__content">
        
      </div>
    </PageLayout>
  );
}
