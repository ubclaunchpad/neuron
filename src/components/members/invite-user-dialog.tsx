"use client";

import { FormInputField } from "@/components/form/FormInput";
import { FormSelectField } from "@/components/form/FormSelect";
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
import { SelectItem } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { authClient } from "@/lib/auth/client";
import { Role } from "@/models/interfaces";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const InviteUserSchema = z.object({
  email: z.email("Please enter a valid email address."),
  role: z.enum([Role.admin, Role.instructor]),
});

type InviteUserSchemaType = z.infer<typeof InviteUserSchema>;

const defaultValues: InviteUserSchemaType = {
  email: "",
  role: Role.instructor,
};

export const InviteUserDialog = NiceModal.create(() => {
  const modal = useModal();
  const form = useForm<InviteUserSchemaType>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: InviteUserSchemaType) => {
    const { error } = await authClient.inviteUser({
      type: "personal",
      email: data.email,
      additionalFields: {
        role: data.role,
      },
    });

    if (error) {
      form.setError("root", {
        type: "custom",
        message: getBetterAuthErrorMessage(error.code),
      });
      return;
    }

    toast.success(`Invitation sent to ${data.email}`);
    modal.hide();
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => (open ? modal.show() : modal.hide())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to an admin or instructor.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FormInputField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              required
            />

            <FormSelectField
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select role"
              required
            >
              <SelectItem value={Role.admin}>{Role.getName(Role.admin)}</SelectItem>
              <SelectItem value={Role.instructor}>
                {Role.getName(Role.instructor)}
              </SelectItem>
            </FormSelectField>

            {form.formState.errors.root?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              <span>Send Invite</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
