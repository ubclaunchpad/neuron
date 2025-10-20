import { Button } from "@/components/primitives/button";
import { DateInput } from "@/components/primitives/date-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/primitives/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { clientApi } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Temporal } from "@js-temporal/polyfill";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const TermEditSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, "Please fill out this field."),
  startDate: z.iso.date().min(1, "Please fill out this field."),
  endDate: z.iso.date().min(1, "Please fill out this field."),
  // holidays: z.array(z.iso.date()).default([])
});
export type TermEditSchemaType = z.infer<typeof TermEditSchema>;

function toFormValues(term?: {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}) {
  return {
    id: term?.id,
    name: term?.name ?? "",
    startDate: term?.startDate ?? "",
    endDate: term?.endDate ?? "",
  } as const;
}

function TermFormShell({
  initial,
  onSubmit,
  editing,
  triggerAsChild,
  children,
}: {
  initial: { id?: string; name: string; startDate: string; endDate: string };
  onSubmit: (data: TermEditSchemaType) => void;
  editing: boolean;
  triggerAsChild?: boolean;
  children?: React.ReactNode;
}) {
  const form = useForm<TermEditSchemaType>({
    resolver: zodResolver(TermEditSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <DialogHeader>
        <DialogTitle>
          {editing ? `Edit ${initial?.name}` : "Add a new term"}
        </DialogTitle>
        <DialogDescription>
          Terms group classes into a named date range. This range controls when
          classes run.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="term-name">
                <span>
                  Term Name <i className="text-muted-foreground">(Required)</i>
                </span>
              </FieldLabel>
              <Input
                id="term-name"
                placeholder={`Fall ${Temporal.Now.plainDateISO().year}`}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="start-date">
                  <span>
                    Start Date{" "}
                    <i className="text-muted-foreground">(Required)</i>
                  </span>
                </FieldLabel>
                <DateInput
                  id="start-date"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  {...field}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="end-date">
                  <span>
                    End Date <i className="text-muted-foreground">(Required)</i>
                  </span>
                </FieldLabel>
                <DateInput
                  id="end-date"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  {...field}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" size="sm">
          {editing ? "Save changes" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TermForm({
  editingId,
  triggerAsChild = true,
  children,
}: {
  editingId?: string;
  triggerAsChild?: boolean;
  children?: React.ReactNode;
}) {
  const apiUtils = clientApi.useUtils();
  const editing = !!editingId;

  const { data: termData, isPending: isLoadingTerm } =
    clientApi.term.byId.useQuery(
      { termId: editingId ?? "" },
      { enabled: !!editing },
    );

  const { mutate: createTermMutation, isPending: isUpdatingTerm } =
    clientApi.term.create.useMutation({
      onSuccess: () => {
        apiUtils.term.all.invalidate();
      },
    });

  const { mutate: updateTermMutation, isPending: isCreatingTerm } =
    clientApi.term.update.useMutation({
      onSuccess: (_, { id }) => {
        apiUtils.term.byId.invalidate({ termId: id });
        apiUtils.term.all.invalidate();
      },
    });

  const onSubmit = (data: TermEditSchemaType) => {
    if (editing) {
      updateTermMutation({ id: editingId!, ...data });
    } else {
      createTermMutation(data);
    }
  };

  // For editing: wait for data before mounting the form (or render a skeleton)
  if (editing && (isLoadingTerm || !termData)) {
    return (
      <Dialog>
        <DialogTrigger asChild={triggerAsChild}>{children}</DialogTrigger>
        <DialogContent>
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        </DialogContent>
      </Dialog>
    );
  }

  const initial = toFormValues(editing ? termData : undefined);

  return (
    <Dialog>
      <DialogTrigger asChild={triggerAsChild}>{children}</DialogTrigger>
      <DialogContent>
        <TermFormShell
          key={editing ? editingId : "create"}
          initial={initial}
          onSubmit={onSubmit}
          editing={editing}
          triggerAsChild={triggerAsChild}
        >
          {children}
        </TermFormShell>
      </DialogContent>
    </Dialog>
  );
}
