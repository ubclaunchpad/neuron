"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Button } from "@/components/ui/button";

type ConfirmableChildProps = {
  onClick?: React.MouseEventHandler<HTMLElement>;
  ref?: React.Ref<HTMLElement>;
};

type ConfirmDialogProps = {
  children: React.ReactElement<ConfirmableChildProps>;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
};

type BaseUIClickEvent = React.MouseEvent<HTMLElement> & {
  preventBaseUIHandler?: () => void;
};

/**
 * Intercepts a child's click and re-dispatches a fresh click only after the
 * user confirms. Re-dispatching preserves the child's original click handler,
 * default browser behavior, and normal event bubbling.
 */
export function ConfirmDialog({
  children,
  title,
  description,
  confirmLabel = "Yes",
  cancelLabel = "No",
  confirmVariant = "default",
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  const replayingClickRef = React.useRef(false);
  const originalOnClick = children.props.onClick;
  const originalRef = children.props.ref;

  const setTriggerRef = React.useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;

      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef) {
        originalRef.current = node;
      }
    },
    [originalRef],
  );

  const handleChildClick = React.useCallback(
    (event: BaseUIClickEvent) => {
      if (replayingClickRef.current) {
        replayingClickRef.current = false;
        originalOnClick?.(event);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      event.preventBaseUIHandler?.();
      setOpen(true);
    },
    [originalOnClick],
  );

  const handleConfirm = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    replayingClickRef.current = true;
    trigger.click();

    // A disabled element does not dispatch a click.
    replayingClickRef.current = false;
  }, []);

  const trigger = React.cloneElement(children, {
    onClick: handleChildClick,
    ref: setTriggerRef,
  });

  return (
    <>
      {trigger}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction variant={confirmVariant} onClick={handleConfirm}>
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
