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
import React from "react";

type AlertDialogComponentProps = Omit<
  React.ComponentProps<typeof UIAlertDialog>,
  "children"
> & {
  alertTitle?: React.ReactNode;
  alertDescription: React.ReactNode;
  alertActionContent?: React.ReactNode;
  alertActionAsOverride?: boolean;
  alertCancelContent?: React.ReactNode;
  alertCancelOverride?: boolean;
  children?: React.ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
};

export function AlertDialog({
  alertTitle,
  alertDescription,
  alertActionContent,
  alertActionAsOverride,
  alertCancelContent,
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
            <AlertDialogCancel onClick={onReject}>
              {alertCancelContent ?? "Continue"}
            </AlertDialogCancel>
          )}
          {alertActionAsOverride ? (
            alertActionContent
          ) : (
            <AlertDialogAction onClick={onAccept}>
              {alertActionContent ?? "Continue"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </UIAlertDialog>
  );
}
