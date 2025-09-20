"use client";

import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Select } from "@/components/primitives/Select";
import { api } from "@/trpc/client";
import { useEffect, useState } from "react";
import "./page.scss";

export default function ClassesPage() {
  const classesQuery = api.class.list.useQuery({ term: "current" });
  const termsQuery = api.term.all.useQuery();

  // Set the selected term id to the first term id by default
  useEffect(() => {
    if (termsQuery.data) {
      setSelectedTermId(termsQuery.data[0]?.id ?? null);
    }
  }, [termsQuery.data]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  return (
    <PageLayout
      title="Classes"
      open={sidebarOpen}
    >
      <PageLayout.Header>
        <PageTitle title="Classes">
          <PageTitle.RightContent>
            <Select 
              items={termsQuery.data ?? []} 
              isDisabled={termsQuery.isLoading || termsQuery.isFetching || termsQuery.data?.length === 1}
              selectedKey={selectedTermId}
              onSelectionChange={(id) => setSelectedTermId(id as string | null)}
            >
              {(item) => (
                <Select.Item>{item.name}</Select.Item>
              )}
            </Select>
          </PageTitle.RightContent>
        </PageTitle>
      </PageLayout.Header>

      <PageLayout.Sidebar>
        <div>This is the sidebar</div>
      </PageLayout.Sidebar>
    </PageLayout>
  );
}
