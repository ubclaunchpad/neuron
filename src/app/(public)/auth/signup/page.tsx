"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/primitives/alert";
import { Button } from "@/components/primitives/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/primitives/field";
import { Input, PasswordInput } from "@/components/primitives/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Spinner } from "@/components/primitives/spinner";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

const SignupSchema = z.object({
    firstName: z.string().nonempty("Please fill out this field."),
    lastName: z.string().nonempty("Please fill out this field."),
    email: z
      .email("Please enter a valid email address.")
      .nonempty("Please fill out this field."),
    password: z.string()
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

type SignupSchemaType = z.infer<typeof SignupSchema>;

export default function SignupForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(SignupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: SignupSchemaType) => {
    const { error } = await authClient.signUp.email({
      name: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", {
        type: "custom",
        message: getBetterAuthErrorMessage(error?.code),
      });
      return;
    }

    setSuccessMessage(
      "Your account has been successfully created! Please check your email to verify your account."
    );

    // Redirect to login page after 5 seconds on success
    setTimeout(() => router.replace("/auth/login"), 5000);
  };

  return (
    <div className="w-full max-w-3xl space-y-8 p-8">
      <h1 className="text-2xl font-display font-medium leading-none text-primary">
        Welcome!
      </h1>

      {/* Root error */}
      {errors.root?.message && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn’t create account</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
            <Field data-invalid={!!errors.firstName} className="gap-1">
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <Input
                id="firstName"
                placeholder="John"
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              <FieldError errors={errors.firstName}/>
            </Field>

            <Field data-invalid={!!errors.lastName} className="gap-1">
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <Input
                id="lastName"
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              <FieldError errors={errors.lastName}/>
            </Field>
          </div>

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
            <FieldError errors={errors.email}/>
          </Field>

          <Field data-invalid={!!errors.password} className="gap-1">
            <FieldLabel htmlFor="password">
              Create password (at least 8 characters)
            </FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="•••••••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={errors.password}/>
          </Field>

          <Field data-invalid={!!errors.confirmPassword} className="gap-1">
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="•••••••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={errors.confirmPassword}/>
          </Field>

          <Field orientation="horizontal">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <><Spinner /> Creating...</> : "Create an Account"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <p className="text-center text-foreground">
        Already have an account?{" "}
        <Button asChild variant="link" className="p-0">
          <Link href="/auth/login">
            <strong>Log In</strong>
          </Link>
        </Button>
      </p>
    </div>
  );
}
