"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Field, FieldError, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Spinner } from "@/components/primitives/spinner";
import useCountdown from "@/hooks/use-countdown";
import { authClient } from "@/lib/auth/client";

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Please fill out this field.")
    .email("Please enter a valid email address."),
});

type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const cooldown = useCountdown({ minutes: 1 });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordSchemaType) => {
    // Ignore error to prevent user enumeration
    await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/auth/password-reset",
    });

    // Restart cooldown
    cooldown.reset();
    cooldown.start();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-3xl space-y-8 p-8"
    >
      <h1 className="text-2xl font-display font-medium leading-none text-primary">
        {isSubmitSuccessful ? "Check your mail" : "Reset your password"}
      </h1>

      <div className="space-y-5">
        {!isSubmitSuccessful ? (
          <Field data-invalid={!!errors.email} className="gap-1">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john.doe@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={errors.email} />
          </Field>
        ) : (
          <p aria-live="polite" className="text-foreground">
            We’ve sent password reset instructions to{" "}
            <strong>{getValues("email")}</strong>.
            <br />
            Didn’t receive the email? Check your spam folder or click below to
            resend instructions.
          </p>
        )}
      </div>

      <div className="space-y-5">
        <Button
          type="submit"
          disabled={cooldown.isActive || isSubmitting}
          data-cooldown={cooldown.isActive}
          className="w-full data-[cooldown=true]:bg-[var(--ring)] data-[cooldown=true]:text-foreground data-[cooldown=true]:opacity-100"
        >
          {isSubmitting ? (
            <>
              <Spinner /> Sending…
            </>
          ) : cooldown.isActive ? (
            <strong>{cooldown.formatted}</strong>
          ) : isSubmitSuccessful ? (
            "Resend Instructions"
          ) : (
            "Send Instructions"
          )}
        </Button>

        <p className="text-center text-foreground">
          <Button asChild variant="link" className="p-0">
            <Link prefetch href="/auth/login">
              <ChevronLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </p>
      </div>
    </form>
  );
}
