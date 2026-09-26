import * as React from "react";

export type AsChildProps = {
  asChild?: boolean;
};

export function renderFromAsChild<TRender>(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: TRender,
) {
  return asChild && React.isValidElement(children) ? children : render;
}

export function childrenFromAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
) {
  return asChild ? undefined : children;
}
