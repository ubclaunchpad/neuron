"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogClose } from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScheduleAdvancedDatesSection } from "./content/schedule-advanced-dates-section";
import { ScheduleRecurrenceFields } from "./content/schedule-recurrence-fields";
import { ScheduleUsersSection } from "./content/schedule-users-section";
import {
  ScheduleEditSchema,
  type ScheduleEditSchemaInput,
  type ScheduleEditSchemaOutput,
} from "./schema";
import { FormInputField } from "@/components/form/FormInput";
import { Separator } from "@/components/ui/separator";

export const ScheduleFormDialog = NiceModal.create(
  ({
    initial,
    isEditing,
  }: {
    initial: ScheduleEditSchemaInput;
    isEditing?: boolean;
  }) => {
    const modal = useModal();
    const { control, handleSubmit, reset } = useForm({
      resolver: zodResolver(ScheduleEditSchema),
      values: initial,
      mode: "onSubmit",
      reValidateMode: "onChange",
    });

    // Reset the form on open
    useEffect(() => {
      if (modal.visible) reset(initial);
    }, [initial, reset, modal.visible]);

    const onSubmit = useCallback(
      async (data: ScheduleEditSchemaOutput) => {
        modal.resolve(data);
        await modal.hide();
      },
      [modal],
    );

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={async (open) => {
          if (open) {
            await modal.show();
          } else {
            modal.reject();
            await modal.hide();
          }
        }}
      >
        <DialogContent className="!max-w-[37.5rem]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit schedule" : "Add a schedule"}
              </DialogTitle>
              <DialogDescription>
                Configure the timing and recurrence for this class schedule.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <FieldGroup className="flex-row">
                <FormInputField
                  control={control}
                  name="localStartTime"
                  type="time"
                  label="Start Time"
                  required
                />
                <FormInputField
                  control={control}
                  name="localEndTime"
                  type="time"
                  label="End Time"
                  required
                />
              </FieldGroup>
              <ScheduleRecurrenceFields control={control} initial={initial} />
              <Separator />
              <ScheduleUsersSection control={control} />
              <ScheduleAdvancedDatesSection control={control} />
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm">
                Done
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);
