import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { forceLogout } from "@/lib/auth/logout";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

import { FormInputField } from "@/components/form/FormInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, LogOut, Shield, Lock } from "lucide-react";

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
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [sessionMessage, setSessionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const {
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
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

  const onSubmit = async (data: ChangePasswordSchemaType) => {
    const { error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: false,
    });

    if (error) {
      setError("root", {
        type: "custom",
        message: getBetterAuthErrorMessage(error?.code),
      });
      return;
    }

    reset();
    setPasswordSuccess(true);
  };

  const handleRevokeAllSessions = async () => {
    try {
      setSessionLoading(true);
      await authClient.revokeOtherSessions();
      setSessionMessage({ type: "success", text: "All other sessions have been revoked." });
    } catch {
      setSessionMessage({ type: "error", text: "Failed to revoke sessions. Please try again." });
    } finally {
      setSessionLoading(false);
    }
  };

  const isPasswordSuccess = (errors.root as any)?.type === "success";

  return (
    <div className="space-y-6 px-1">
      <div>
        <p className="text-sm text-muted-foreground">
          Manage your account security and sessions
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            {errors.root?.message && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn't update password</AlertTitle>
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && !isDirty  && (
              <Alert variant="success" role="status" aria-live="polite">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Password changed successfully.</AlertDescription>
              </Alert>
            )}

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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionMessage && (
            <Alert
              variant={sessionMessage.type === "error" ? "destructive" : "default"}
              role={sessionMessage.type === "error" ? "alert" : "status"}
              aria-live={sessionMessage.type === "error" ? "assertive" : "polite"}
            >
              {sessionMessage.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>{sessionMessage.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Logout from all devices</p>
              <p className="text-sm text-muted-foreground">
                End all sessions except the current one
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRevokeAllSessions}
              disabled={sessionLoading}
            >
              {sessionLoading ? <Spinner /> : "Revoke All Sessions"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Logout
          </CardTitle>
          <CardDescription>Sign out of your account on this device</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={forceLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}