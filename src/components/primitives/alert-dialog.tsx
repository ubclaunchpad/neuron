import {
  AlertDialog as UIAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import React, { type ComponentProps } from "react";

type AlertDialogComponentProps = Omit<
  React.ComponentProps<typeof UIAlertDialog>,
  "children"
> & {
  alertTitle?: React.ReactNode;
  alertDescription: React.ReactNode;
  alertActionContent?: React.ReactNode;
  alertActionProps?: ComponentProps<typeof AlertDialogAction>;
  alertActionAsOverride?: boolean;
  alertCancelContent?: React.ReactNode;
  alertCancelProps?: ComponentProps<typeof AlertDialogCancel>;
  alertCancelOverride?: boolean;
  children?: React.ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
};

export function AlertDialog({
  alertTitle,
  alertDescription,
  alertActionContent,
  alertActionProps,
  alertActionAsOverride,
  alertCancelContent,
  alertCancelProps,
  alertCancelOverride,
  onAccept,
  onReject,
  children,
  ...dialogProps
}: AlertDialogComponentProps) {
  return (
    <UIAlertDialog {...dialogProps}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertTitle ?? "Are you absolutely sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertCancelOverride ? (
            alertCancelContent
          ) : (
            <AlertDialogCancel onClick={onReject} {...alertCancelProps}>
              {alertCancelContent ?? "Cancel"}
            </AlertDialogCancel>
          )}
          {alertActionAsOverride ? (
            alertActionContent
          ) : (
            <AlertDialogAction onClick={onAccept} {...alertActionProps}>
              {alertActionContent ?? "Accept"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </UIAlertDialog>
  );
}
