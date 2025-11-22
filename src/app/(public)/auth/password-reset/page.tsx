"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/alert";
import { Button } from "@/components/primitives/button";
import { Field, FieldError, FieldLabel } from "@/components/primitives/field";
import { PasswordInput } from "@/components/primitives/input";
import { Spinner } from "@/components/primitives/spinner";

const PasswordResetSchema = z
  .object({
    password: z
      .string()
      .nonempty("Please fill out this field.")
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().nonempty("Please fill out this field."),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords don't match.",
      });
    }
  });

type PasswordResetSchemaType = z.infer<typeof PasswordResetSchema>;

export default function PasswordResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? undefined;
  const tokenError = params.get("error")
    ? "Invalid or expired token. Please try resetting your password again."
    : null;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: PasswordResetSchemaType) => {
    const { error } = await authClient.resetPassword({
      token,
      newPassword: data.password,
    });

    if (error) {
      setError("root", {
        type: "custom",
        message: getBetterAuthErrorMessage(error?.code),
      });
      return;
    }

    setSuccessMessage("Password successfully reset!");
    setTimeout(() => router.replace("/auth/login"), 3000);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-3xl space-y-8 p-8"
    >
      <h1 className="text-2xl font-display font-medium leading-none text-primary">
        Set your new password
      </h1>

      {/* Token error from query param */}
      {tokenError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn’t reset your password</AlertTitle>
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>
      )}

      {/* Root error from submit */}
      {errors.root?.message && !tokenError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn’t reset your password</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {successMessage && (
        <Alert variant="success" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        <Field data-invalid={!!errors.password} className="gap-1">
          <FieldLabel htmlFor="password">
            Create password (at least 8 characters)
          </FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="•••••••••••••"
            aria-invalid={!!errors.password}
            disabled={!!tokenError}
            {...register("password")}
          />
          <FieldError errors={errors.password} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword} className="gap-1">
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="•••••••••••••"
            aria-invalid={!!errors.confirmPassword}
            disabled={!!tokenError}
            {...register("confirmPassword")}
          />
          <FieldError errors={errors.confirmPassword} />
        </Field>
      </div>

      <div className="space-y-5">
        <Button
          type="submit"
          disabled={!!tokenError || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Spinner /> Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
        <p className="text-center text-foreground">
          <Button asChild variant="link" className="p-0">
            <Link href="/auth/login">
              <ChevronLeft className="me-1 h-4 w-4" />
              <strong>Back to login</strong>
            </Link>
          </Button>
        </p>
      </div>
    </form>
  );
}
