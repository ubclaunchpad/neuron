"use client";

import * as React from "react";

import { usePageSidebar } from "@/components/page-layout";

export type ClassesPageContextValue = {
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  openSidebarFor: (id: string) => void;
};

const Ctx = React.createContext<ClassesPageContextValue | null>(null);

export function useClassesPage() {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error("useClassesPage must be used within ClassesPageProvider");
  return ctx;
}

export function ClassesPageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setOpen } = usePageSidebar();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(
    null,
  );

  const openSidebarFor = React.useCallback(
    (id: string) => {
      setSelectedClassId(id);
      setOpen(true);
    },
    [setOpen],
  );

  const value = React.useMemo(
    () => ({ selectedClassId, setSelectedClassId, openSidebarFor }),
    [selectedClassId, openSidebarFor],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
