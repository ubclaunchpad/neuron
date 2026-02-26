"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { clientApi } from "@/trpc/client";
import { diffEntityArray } from "@/utils/formUtils";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { toast } from "sonner";
import { TermForm } from "./content/term-form";
import { TermFormFooter } from "./content/term-form-footer";
import { TermFormProvider } from "./term-form-provider";
import { toFormValues, type TermEditSchemaOutput } from "./schema";

export const TermFormDialog = NiceModal.create(
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

    const { data: termData, isLoading: isLoadingTerm } =
      clientApi.term.byId.useQuery(
        { termId: editingId ?? "" },
        { enabled: !!editing },
      );

    const { mutate: createTermMutation, isPending: isCreatingTerm } =
      clientApi.term.create.useMutation({
        onSuccess: async (createdTermId, { name }) => {
          onCreated?.(createdTermId);
          await apiUtils.term.all.invalidate();
          toast.success(`"${name}" created successfully`);
          await modal.hide();
        },
      });

    const { mutate: updateTermMutation, isPending: isUpdatingTerm } =
      clientApi.term.update.useMutation({
        onSuccess: async (_, { id, name }) => {
          await apiUtils.term.byId.invalidate({ termId: id });
          await apiUtils.term.all.invalidate();
          toast.success(`"${name}" updated successfully`);
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

    const submitting = isCreatingTerm || isUpdatingTerm;
    const initial = toFormValues(editing ? termData : undefined);

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => (open ? modal.show() : modal.hide())}
      >
        <TermFormProvider
          key={editing ? editingId : "create"}
          initial={initial}
          onSubmit={onSubmit}
          submitting={submitting}
          editing={editing}
          termId={editingId ?? undefined}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit term` : "Add a new term"}
              </DialogTitle>
              <DialogDescription>
                {editing && termData
                  ? `Editing "${termData.name}".`
                  : "Terms group classes into a named date range. This range controls when classes run."}
              </DialogDescription>
            </DialogHeader>

            {editing && (isLoadingTerm || !termData) ? (
              <Spinner />
            ) : (
              <TermForm termData={termData} />
            )}

            <TermFormFooter />
          </DialogContent>
        </TermFormProvider>
      </Dialog>
    );
  },
);
