"use client";

import { FormCheckboxField } from "@/components/form/FormCheckbox";
import { FormFieldController } from "@/components/form/FormField";
import { FormError, FormLabel } from "@/components/form/FormLayout";
import { FormSelectField } from "@/components/form/FormSelect";
import { Button } from "@/components/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectItem } from "@/components/ui/select";
import {
  CoverageRequestCategory,
  CoverageRequestCategoryEnum,
} from "@/models/api/coverage";
import type { SingleShift } from "@/models/shift";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
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

const RequestCoverageSchema = z.object({
  category: z
    .string("Please select a reason for the request.")
    .min(1, "Please select a reason for the request.")
    .pipe(CoverageRequestCategoryEnum),
  details: z.string().nonempty("Please fill out this field."),
  comments: z.string().optional(),
  ack: z.boolean().pipe(
    z.literal(true, {
      error:
        "Please acknowledge the statement before the form can be submitted",
    }),
  ),
});
type RequestCoverageSchemaType = z.infer<typeof RequestCoverageSchema>;

function RequestCoverageSchemaForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: RequestCoverageSchemaType) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RequestCoverageSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      category: "",
      details: "",
      comments: "",
      ack: false,
    },
  });

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <FormFieldController control={control} name="category">
          <FormLabel required>Why are you requesting this absence?</FormLabel>
          <FormSelectField
            control={control}
            name="category"
            label="Category"
            placeholder="Select category"
            orientation="horizontal"
            hideErrors
          >
            {CoverageRequestCategory.getSelectOptions().map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </FormSelectField>

          <FormTextareaField
            control={control}
            name="details"
            placeholder="Enter the reason for requesting coverage..."
            rows={5}
            hideErrors
          />

          <FormError errors={errors.details ?? errors.category} />
        </FormFieldController>

        <FormTextareaField
          control={control}
          name="comments"
          label="Additionally Comments"
          placeholder="Provide any additional information..."
          rows={3}
        />
      </FieldGroup>

      <FieldGroup>
        <FormCheckboxField
          control={control}
          name="ack"
          label="By checking this box I acknowledge that submitting form does not guarantee that this shift will be covered."
        />
      </FieldGroup>

      <DialogFooter>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancel?.()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" pending={isSubmitting}>
          Request Coverage
        </Button>
      </DialogFooter>
    </form>
  );
}

export const RequestCoverageModal = NiceModal.create(
  ({ shift }: { shift: SingleShift }) => {
    const modal = useModal();

    const apiUtils = clientApi.useUtils();
    const { mutate: requestCoverage, isPending } =
      clientApi.coverage.requestCoverage.useMutation({
        onSuccess: (_, variables) => {
          void apiUtils.shift.list.invalidate();
          void apiUtils.shift.byId.invalidate({ shiftId: variables.shiftId });
          modal.hide();
        },
      });

    const onSubmit = (formData: RequestCoverageSchemaType) => {
      requestCoverage({
        shiftId: shift.id,
        category: formData.category,
        details: formData.details,
        comments: formData.comments,
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
            <DialogTitle>Request Coverage for {shift.class.name}</DialogTitle>
            <DialogDescription>
              {day} at {startTime} to {endTime}
            </DialogDescription>
          </DialogHeader>

          <RequestCoverageSchemaForm
            key={shift.id}
            onSubmit={onSubmit}
            isSubmitting={isPending}
            onCancel={() => modal.hide()}
          />
        </DialogContent>
      </Dialog>
    );
  },
);
