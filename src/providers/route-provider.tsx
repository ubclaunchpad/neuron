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
      navigate={(to: string, options: NextPushOptions) => {
        if (options && "replace" in options && options.replace) {
          router.replace(to, options);
        } else {
          router.push(to, options);
        }
      }}
    >
      {children}
    </RouterProvider>
  );
}
