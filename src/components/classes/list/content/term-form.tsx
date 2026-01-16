import { FormDateInputField } from "@/components/form/FormDatePicker";
import { FormInputField } from "@/components/form/FormInput";
import { ArrayController } from "@/components/form/utils/ArrayController";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DateRangeInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { isoDateToJSDate, jsDateToIsoDate } from "@/lib/temporal-conversions";
import type { Term } from "@/models/term";
import { clientApi } from "@/trpc/client";
import { diffEntityArray } from "@/utils/formUtils";
import { getUpcomingSemester } from "@/utils/miscUtils";
import type { DeepAllUnionFields } from "@/utils/typeUtils";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Temporal } from "@js-temporal/polyfill";
import AddIcon from "@public/assets/icons/add.svg";
import { XIcon } from "lucide-react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import z from "zod";

const TermHolidaySchema = z
  .object({
    id: z.uuid().optional(),
    from: z.iso.date("Please fill out this field."),
    to: z.iso.date("Please fill out this field."),
  })
  .superRefine((value, ctx): void => {
    if (value.from && value.to) {
      const from = Temporal.PlainDate.from(value.from);
      const to = Temporal.PlainDate.from(value.to);
      if (Temporal.PlainDate.compare(from, to) > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["to"],
          message: "End date must be after start date.",
        });
      }
    }
  });
export type TermHolidaySchemaType = z.input<typeof TermHolidaySchema>;

const TermEditSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().nonempty("Please fill out this field."),
    startDate: z.iso.date("Please fill out this field."),
    endDate: z.iso.date("Please fill out this field."),
    holidays: z.array(TermHolidaySchema).default([]),
  })
  .superRefine((value, ctx): void => {
    if (value.startDate && value.endDate) {
      const from = Temporal.PlainDate.from(value.startDate);
      const to = Temporal.PlainDate.from(value.endDate);
      if (Temporal.PlainDate.compare(from, to) >= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["startDate"],
          message: "End date must be after start date.",
        });
      }
    }
  });
export type TermEditSchemaInput = z.input<typeof TermEditSchema>;
export type TermEditSchemaOutput = z.output<typeof TermEditSchema>;

function toFormValues(term?: Term): TermEditSchemaInput {
  return {
    id: term?.id,
    name: term?.name ?? "",
    startDate: term?.startDate ?? "",
    endDate: term?.endDate ?? "",
    holidays:
      term?.holidays.map((holiday) => ({
        id: holiday.id,
        from: holiday.startsOn,
        to: holiday.endsOn,
      })) ?? [],
  } as const;
}

function TermFormShell({
  initial,
  onSubmit,
  submitting,
}: {
  initial: TermEditSchemaInput;
  onSubmit: (data: TermEditSchemaOutput) => void;
  submitting: boolean;
  editing: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(TermEditSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Deep union to get all type combinations for errors
  const fullErrors: FieldErrors<DeepAllUnionFields<TermEditSchemaInput>> =
    form.formState.errors;

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <FormInputField
          control={form.control}
          name="name"
          label="Term Name"
          placeholder={`${getUpcomingSemester()} ${Temporal.Now.plainDateISO().year}`}
          required
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
          <FormDateInputField
            control={form.control}
            name="startDate"
            label="Start Date"
            required
          />

          <FormDateInputField
            control={form.control}
            name="endDate"
            label="End Date"
            required
          />
        </div>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Holidays</FieldLegend>
          <FieldDescription>
            Add holidays to exclude certain dates or date ranges from all
            classes in the term.
          </FieldDescription>

          <ArrayController
            control={form.control}
            name="holidays"
            keyName="key"
            render={({ fields, append, remove }) => (
              <>
                <FieldGroup>
                  {fields.map((value, index) => (
                    <Controller
                      key={value.key}
                      name={`holidays.${index}`}
                      control={form.control}
                      render={({
                        field: { value, onChange, ...field },
                        fieldState,
                      }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <ButtonGroup className="w-full">
                            <DateRangeInput
                              value={{
                                from: isoDateToJSDate(value.from),
                                to: isoDateToJSDate(value.to),
                              }}
                              onChange={(dateRange) =>
                                onChange({
                                  from: jsDateToIsoDate(dateRange?.from),
                                  to: jsDateToIsoDate(dateRange?.to),
                                })
                              }
                              className="flex-1"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-lg"
                              aria-label={`Remove holiday ${index + 1}`}
                              className="shrink-0"
                              onClick={() => remove(index)}
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </ButtonGroup>
                          <FieldError
                            errors={
                              fullErrors.holidays?.[index]?.root ??
                              fullErrors.holidays?.[index]?.from ??
                              fullErrors.holidays?.[index]?.to
                            }
                          />
                        </Field>
                      )}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start px-0 text-muted-foreground hover:text-foreground"
                    onClick={() => append({ from: "", to: "" })}
                  >
                    <AddIcon />
                    <span>Add holiday</span>
                  </Button>
                </FieldGroup>
                <FieldError errors={form.formState.errors.holidays?.root} />
              </>
            )}
          />
        </FieldSet>
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm" disabled={submitting}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Spinner />} Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export const TermForm = NiceModal.create(
  ({
    editingId,
    onCreated,
  }: {
    editingId: string | null;
    onCreated?: (termId: string) => void;
  }) => {
    const modal = useModal();
    const apiUtils = clientApi.useUtils();
    const editing = !!editingId;

    const { data: termData, isPending: isLoadingTerm } =
      clientApi.term.byId.useQuery(
        { termId: editingId ?? "" },
        { enabled: !!editing },
      );

    const { mutate: createTermMutation, isPending: isUpdatingTerm } =
      clientApi.term.create.useMutation({
        onSuccess: async (createdTermId) => {
          onCreated?.(createdTermId);
          await apiUtils.term.all.invalidate();
          await modal.hide();
        },
      });

    const { mutate: updateTermMutation, isPending: isCreatingTerm } =
      clientApi.term.update.useMutation({
        onSuccess: async (_, { id }) => {
          await apiUtils.term.byId.invalidate({ termId: id });
          await apiUtils.term.all.invalidate();
          await modal.hide();
        },
      });

    const onSubmit = (data: TermEditSchemaOutput) => {
      if (editing) {
        const { holidays, ...updateData } = data;
        const originalHolidays = termData?.holidays ?? [];
        const { added, edited, deletedIds } = diffEntityArray(
          originalHolidays,
          holidays.map((h) => ({
            id: h.id,
            startsOn: h.from,
            endsOn: h.to,
          })),
          "id",
        );

        updateTermMutation({
          id: editingId,
          addedHolidays: added,
          updatedHolidays: edited,
          deletedHolidays: deletedIds,
          ...updateData,
        });
      } else {
        createTermMutation({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          holidays: data.holidays.map((h) => ({
            startsOn: h.from,
            endsOn: h.to,
          })),
        });
      }
    };

    const initial = toFormValues(editing ? termData : undefined);

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => (open ? modal.show() : modal.hide())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit term` : "Add a new term"}
            </DialogTitle>
            <DialogDescription>
              Terms group classes into a named date range. This range controls
              when classes run.
            </DialogDescription>
          </DialogHeader>

          {editing && (isLoadingTerm || !termData) ? (
            <Spinner />
          ) : (
            <TermFormShell
              key={editing ? editingId : "create"}
              initial={initial}
              onSubmit={onSubmit}
              submitting={isUpdatingTerm || isCreatingTerm}
              editing={editing}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  },
);
