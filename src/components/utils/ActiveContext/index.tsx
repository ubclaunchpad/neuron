"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export type ActiveContextRenderProps = {
  isActive: boolean;
};

type ActiveContextProps = {
  href: string;
  type?: "exact" | "startsWith" | "endsWith";
  children?:
    | React.ReactNode
    | ((props: ActiveContextRenderProps) => React.ReactNode);
};

export function ActiveContext({
  children,
  type = "startsWith",
  href,
}: ActiveContextProps) {
  const pathname = usePathname();
  const norm = (p: string) =>
    p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;

  const isActive = useMemo(() => {
    switch (type) {
      case "exact":
        return norm(pathname) === norm(href);
      case "startsWith":
        return (
          norm(pathname) === norm(href) ||
          norm(pathname).startsWith(norm(href) + "/")
        );
      case "endsWith":
        return (
          norm(pathname) === norm(href) ||
          norm(pathname).endsWith(norm(href) + "/")
        );
    }
  }, [pathname, href, type]);

  return typeof children === "function" ? children({ isActive }) : children;
}
