"use client";

import { FormInputField } from "@/components/form/FormInput";
import { FormTextareaField } from "@/components/form/FormTextarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { SubmitBugReportInput } from "@/models/api/bug-report";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

type ReportIssueSchemaType = z.infer<typeof SubmitBugReportInput>;

export const ReportIssueDialog = NiceModal.create(() => {
  const modal = useModal();

  const form = useForm<ReportIssueSchemaType>({
    resolver: zodResolver(SubmitBugReportInput),
    defaultValues: {
      title: "",
      description: "",
      email: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const submitBugReport = clientApi.bugReport.submit.useMutation({
    onSuccess: () => {
      toast.success("Issue reported successfully. Thank you!");
      modal.hide();
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to report issue: ${error.message}`);
    },
  });

  const onSubmit = (data: ReportIssueSchemaType) => {
    submitBugReport.mutate(data);
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => (open ? modal.show() : modal.hide())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
          <DialogDescription>
            Let us know about any issues you&apos;re experiencing.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name="title"
              label="Title"
              placeholder="Brief description of the issue"
              maxLength={200}
              required
            />

            <FormTextareaField
              control={form.control}
              name="description"
              label="What happened?"
              placeholder="Describe the issue in detail..."
              rows={5}
              required
            />

            <FormInputField
              control={form.control}
              name="email"
              label="Contact Email"
              placeholder="your.email@example.com"
              type="email"
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={submitBugReport.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={submitBugReport.isPending}
            >
              {submitBugReport.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
