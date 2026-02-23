"use client";

import { FormInputField } from "@/components/form/FormInput";
import { FormSelectField } from "@/components/form/FormSelect";
import { Button } from "@/components/primitives/button";
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
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { authClient } from "@/lib/auth/client";
import { Role, RoleEnum } from "@/models/interfaces";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const InviteUserSchema = z.object({
  email: z.email("Please enter a valid email address."),
  role: z.enum([Role.admin, Role.instructor]),
});

type InviteUserSchemaType = z.infer<typeof InviteUserSchema>;

export const InviteUserDialog = NiceModal.create(() => {
  const modal = useModal();
  const form = useForm({
    resolver: zodResolver(InviteUserSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      role: "" as Exclude<Role, "volunteer">,
    },
  });

  const { mutateAsync: inviteUserMutation, isPending: isInvitingUser } =
    useMutation({
      mutationFn: async (data: InviteUserSchemaType) => {
        console.log(data);
        const { error } = await authClient.inviteUser({
          type: "personal",
          email: data.email,
          additionalFields: {
            role: data.role,
          },
        });

        if (error) {
          throw new Error(getBetterAuthErrorMessage(error.code));
        }
      },
      onSuccess: (_, data) => {
        toast.success(`Invitation sent to ${data.email}`);
        modal.hide();
      },
    });

  const onSubmit = async (data: InviteUserSchemaType) => {
    await inviteUserMutation(data);
  };

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
            <FormSelectField
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select role"
              required
            >
              {RoleEnum.options
                .filter((r) => r !== Role.volunteer)
                .map((roleValue) => (
                  <SelectItem key={roleValue} value={roleValue}>
                    {Role.getName(roleValue)}
                  </SelectItem>
                ))}
            </FormSelectField>

            <FormInputField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              required
            />

            <p className="text-sm text-muted-foreground text-center">
              The user will receive an email to create their account.
            </p>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isInvitingUser}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" pending={isInvitingUser}>
              <span>Send Invite</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
