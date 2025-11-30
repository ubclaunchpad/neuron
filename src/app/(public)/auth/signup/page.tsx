"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field
} from "@/components/ui/field";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { FormInputField } from "@/components/form/FormInput";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

const SignupSchema = z
  .object({
    firstName: z.string().nonempty("Please fill out this field."),
    lastName: z.string().nonempty("Please fill out this field."),
    email: z
      .email("Please enter a valid email address.")
      .nonempty("Please fill out this field."),
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

type SignupSchemaType = z.infer<typeof SignupSchema>;

export default function SignupForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(SignupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
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
      "Your account has been successfully created! Please check your email to verify your account.",
    );

    // Redirect to login page after 5 seconds on success
    setTimeout(() => router.replace("/auth/login"), 5000);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-3xl space-y-8 p-8"
    >
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

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
          <FormInputField
            control={control}
            name="firstName"
            placeholder="John"
            label="First name"
            className="gap-1"
          />

          <FormInputField
            control={control}
            name="lastName"
            placeholder="Doe"
            label="Last name"
            className="gap-1"
          />
        </div>

        <FormInputField
          control={control}
          type="email"
          name="email"
          placeholder="john.doe@example.com"
          label="Email"
          className="gap-1"
        />

        <FormInputField
          control={control}
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="•••••••••••••"
          label="Create password (at least 8 characters)"
          className="gap-1"
        />

        <FormInputField
          control={control}
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="•••••••••••••"
          label="Confirm password"
          className="gap-1"
        />
      </div>

      <div className="space-y-5">
        <Field orientation="horizontal">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner /> Creating...
              </>
            ) : (
              "Create an Account"
            )}
          </Button>
        </Field>

        <p className="text-center text-foreground">
          Already have an account?{" "}
          <Button asChild variant="link" className="p-0">
            <Link href="/auth/login">
              <strong>Log In</strong>
            </Link>
          </Button>
        </p>
      </div>
    </form>
  );
}
