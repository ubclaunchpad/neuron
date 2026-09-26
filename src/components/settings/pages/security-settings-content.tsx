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
import { ConfirmDialog } from "@/components/primitives/confirm-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut } from "lucide-react";

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
    <div className="space-y-6">
      <form onSubmit={handleSubmit((data) => changePassword(data))} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormInputField
              control={control}
              type="password"
              name="currentPassword"
              placeholder="•••••••••••••"
              label="Current Password"
            />
            <FormInputField
              control={control}
              type="password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="•••••••••••••"
              label="New Password (at least 8 characters)"
            />
            <FormInputField
              control={control}
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="•••••••••••••"
              label="Confirm New Password"
            />

            <div className="flex justify-end">
              <Button type="submit" pending={isSubmitting}>
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Log Out of This Device</CardTitle>
          <CardDescription>
            Sign out of your account on this device.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              onClick={forceLogout}
              startIcon={<LogOut />}
            >
              Log Out
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Out of Other Devices</CardTitle>
          <CardDescription>
            Log out of all other active sessions while staying signed in on this
            device.
          </CardDescription>
          <CardAction>
            <ConfirmDialog
              title="Log out of all other devices?"
              description="This will end every other active session for your account. You will remain signed in on this device."
              confirmLabel="Log out other devices"
              cancelLabel="Keep sessions"
              confirmVariant="destructive"
            >
              <Button
                variant="destructive-outline"
                onClick={() => revokeOtherSessions()}
                pending={isRevokingSession}
              >
                Log Out Other Devices
              </Button>
            </ConfirmDialog>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
