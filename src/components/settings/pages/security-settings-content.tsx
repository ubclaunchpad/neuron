import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { forceLogout } from "@/lib/auth/logout";

import { FormInputField } from "@/components/form/FormInput";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Lock, LogOut, Shield } from "lucide-react";
import { FieldGroup } from "@/components/ui/field";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().nonempty("Please fill out this field."),
    newPassword: z
      .string()
      .nonempty("Please fill out this field.")
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().nonempty("Please fill out this field."),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords don't match.",
      });
    }
  });

type ChangePasswordSchemaType = z.infer<typeof ChangePasswordSchema>;

export function SecuritySettingsContent() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync: changePassword } = useMutation({
    mutationFn: async (data: ChangePasswordSchemaType) => {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (error) {
        throw new Error(getBetterAuthErrorMessage(error.code));
      }
    },
    onSuccess: () => {
      reset();
      toast.success("Password changed successfully.");
    },
  });

  const { mutate: revokeOtherSessions, isPending: isRevokingSession } =
    useMutation({
      mutationFn: () => authClient.revokeOtherSessions(),
      onSuccess: () => {
        toast.success("All other sessions have been revoked.");
      },
    });

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit((data) => changePassword(data))}
          noValidate
          className="space-y-4"
        >
          <CardContent>
            <FieldGroup>
              <FormInputField
                control={control}
                type="password"
                name="currentPassword"
                placeholder="•••••••••••••"
                label="Current Password"
                className="gap-1"
              />
              <FormInputField
                control={control}
                type="password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="•••••••••••••"
                label="New Password (at least 8 characters)"
                className="gap-1"
              />
              <FormInputField
                control={control}
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="•••••••••••••"
                label="Confirm New Password"
                className="gap-1"
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" pending={isSubmitting}>
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Log out of this device
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              onClick={forceLogout}
              startIcon={<LogOut />}
            >
              Logout
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Log out of all devices
          </CardTitle>
          <CardDescription>
            Log out of all active sessions across all devices, including your
            current session.
          </CardDescription>
          <CardAction>
            <Button
              variant="destructive-outline"
              onClick={() => revokeOtherSessions()}
              pending={isRevokingSession}
            >
              Revoke All Sessions
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </>
  );
}
