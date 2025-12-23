"use client";

import { Button } from "@/components/primitives/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { SingleShift } from "@/models/shift";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { FormTextareaField } from "../../form/FormTextarea";
import { FieldGroup } from "../../ui/field";

const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

const timeOptions: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

const ClassCancellationSchema = z.object({
  reason: z.string().nonempty("Please fill out this field."),
});
type ClassCancellationSchemaType = z.infer<typeof ClassCancellationSchema>;

function CancelShiftForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: ClassCancellationSchemaType) => void;
  isSubmitting: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(ClassCancellationSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      reason: "",
    },
  });

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <FormTextareaField
          control={form.control}
          name="reason"
          label="Enter the reason for cancellation..."
          rows={5}
          required
        />
      </FieldGroup>

      <DialogFooter>
        <Button size="sm" variant="outline" disabled={isSubmitting}>
          Close
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          pending={isSubmitting}
          startIcon={<X />}
        >
          Cancel Class
        </Button>
      </DialogFooter>
    </form>
  );
}

export const CancelShiftModal = NiceModal.create(({ shift }: { shift: SingleShift }) => {
  const modal = useModal();

  const apiUtils = clientApi.useUtils();
  const { mutate: cancelShift, isPending } = clientApi.shift.cancel.useMutation(
    {
      onSuccess: (_, variables) => {
        void apiUtils.shift.list.invalidate();
        void apiUtils.shift.byId.invalidate({ shiftId: variables.shiftId });
        modal.hide();
      },
    },
  );

  const onSubmit = (formData: ClassCancellationSchemaType) => {
    cancelShift({
      shiftId: shift.id,
      cancelReason: formData.reason,
    });
  };

  // Format date/time text
  const day = shift.startAt.toLocaleDateString("en-US", dateOptions);
  const startTime = shift.startAt.toLocaleTimeString("en-US", timeOptions);
  const endTime = shift.endAt.toLocaleTimeString("en-US", timeOptions);

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => (open ? modal.show() : modal.hide())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Class cancellation notice</DialogTitle>
          <DialogDescription>
            {day} {startTime} {endTime}
          </DialogDescription>
        </DialogHeader>

        <CancelShiftForm
          key={shift.id}
          onSubmit={onSubmit}
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  );
});
