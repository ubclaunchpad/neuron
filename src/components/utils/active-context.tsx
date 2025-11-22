"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export type ActiveContextRenderProps = {
  isActive: boolean;
};

type ActiveContextProps = {
  url: string;
  type?: "exact" | "startsWith" | "endsWith";
  children?:
    | React.ReactNode
    | ((props: ActiveContextRenderProps) => React.ReactNode);
};

export function ActiveContext({
  children,
  type = "startsWith",
  url,
}: ActiveContextProps) {
  const pathname = usePathname();
  const norm = (p: string) =>
    p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;

  const isActive = useMemo(() => {
    switch (type) {
      case "exact":
        return norm(pathname) === norm(url);
      case "startsWith":
        return (
          norm(pathname) === norm(url) ||
          norm(pathname).startsWith(norm(url) + "/")
        );
      case "endsWith":
        return (
          norm(pathname) === norm(url) ||
          norm(pathname).endsWith(norm(url) + "/")
        );
    }
  }, [pathname, url, type]);

  return typeof children === "function" ? children({ isActive }) : children;
}
