"use client";

import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { RouterProvider } from "react-aria-components";

type NextPushOptions = Parameters<ReturnType<typeof useRouter>["push"]>[1];
declare module "react-aria-components" {
  interface RouterConfig {
    // Allow aria <Link replace /> to type-check and flow through
    routerOptions: (NextPushOptions & { replace?: boolean }) | undefined;
  }
}

export function RouteProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <RouterProvider
      navigate={(to, options) => {
        if (options && "replace" in options && options.replace) {
          router.replace(to as any, options as any);
        } else {
          router.push(to as any, options as any);
        }
      }}
    >
      {children}
    </RouterProvider>
  );
}
