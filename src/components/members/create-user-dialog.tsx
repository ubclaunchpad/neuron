"use client";

import { FormInput } from "@/components/form/FormInput";
import { FormSelect } from "@/components/form/FormSelect";
import { Button } from "@/components/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog";
import { FieldGroup } from "@/components/primitives/field";
import { SelectItem } from "@/components/primitives/select";
import { Spinner } from "@/components/primitives/spinner";
import { CreateUserInput } from "@/models/api/user";
import { Role, RoleEnum } from "@/models/interfaces";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const CreateUserSchema = CreateUserInput;
type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;

const defaultValues: CreateUserSchemaType = {
  role: Role.instructor,
  name: "",
  lastName: "",
  email: "",
};

export const CreateUserDialog = NiceModal.create(() => {
  const modal = useModal();
  const apiUtils = clientApi.useUtils();

  const form = useForm<CreateUserSchemaType>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { mutate: createUserMutation, isPending: isCreating } =
    clientApi.user.create.useMutation({
      onSuccess: async () => {
        await apiUtils.user.list.invalidate();
        toast.success("User created successfully");
        modal.hide();
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
          <DialogDescription>
            Create a new user account.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FormSelect
              control={form.control}
              name="role"
              label="Role"
              placeholder="Select role"
              required
            >
              {RoleEnum.options.filter(r => r !== Role.volunteer).map((roleValue) => (
                <SelectItem key={roleValue} value={roleValue}>
                  {Role.getName(roleValue)}
                </SelectItem>
              ))}
            </FormSelect>

            <FieldGroup className="sm:flex-row">
              <FormInput
                control={form.control}
                name="name"
                label="First Name"
                placeholder="Jane"
                required
              />
              <FormInput
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                required
              />
            </FieldGroup>

            <FormInput
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              required
            />

          <p className="text-sm text-muted-foreground text-center">
            The user will receive an email to set their password.
          </p>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating && <Spinner />}
              <span>Create User</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

