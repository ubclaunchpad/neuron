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
import { CreateUserInput } from "@/models/api/user";
import { Role, RoleEnum } from "@/models/interfaces";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type CreateUserSchemaType = z.infer<typeof CreateUserInput>;

export const CreateUserDialog = NiceModal.create(() => {
  const modal = useModal();
  const apiUtils = clientApi.useUtils();

  const form = useForm({
    resolver: zodResolver(CreateUserInput),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      role: "" as Role,
      name: "",
      lastName: "",
      email: "",
    },
  });

  const { mutate: createUserMutation, isPending: isCreating } =
    clientApi.user.create.useMutation({
      onSuccess: async () => {
        await apiUtils.user.list.invalidate();
        toast.success("User created successfully");
        modal.hide();
        form.reset();
      },
    });

  const onSubmit = (data: CreateUserSchemaType) => {
    createUserMutation(data);
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => (open ? modal.show() : modal.hide())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>Create a new user account.</DialogDescription>
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

            <FieldGroup className="sm:flex-row">
              <FormInputField
                control={form.control}
                name="name"
                label="First Name"
                placeholder="Jane"
                required
              />
              <FormInputField
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                required
              />
            </FieldGroup>

            <FormInputField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              required
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" pending={isCreating}>
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
