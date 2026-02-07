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
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const ReportIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type ReportIssueSchemaType = z.infer<typeof ReportIssueSchema>;

const defaultValues: ReportIssueSchemaType = {
  title: "",
  description: "",
  email: "",
};

export const ReportIssueDialog = NiceModal.create(() => {
  const modal = useModal();

  const form = useForm<ReportIssueSchemaType>({
    resolver: zodResolver(ReportIssueSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = (data: ReportIssueSchemaType) => {
    // No functionality - just for UI display
    console.log("Report Issue (No Functionality):", data);
    modal.hide();
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
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
