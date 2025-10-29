"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/alert";
import { Button } from "@/components/primitives/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/primitives/field";
import { Input, PasswordInput } from "@/components/primitives/input";
import { Spinner } from "@/components/primitives/spinner";

const LoginSchema = z.object({
  email: z
    .string()
    .nonempty("Please fill out this field.")
    .email("Please enter a valid email address."),
  password: z.string().nonempty("Please fill out this field."),
});
type LoginSchemaType = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange"
  });

  const onSubmit = async (data: LoginSchemaType) => {
    const { error } = await authClient.signIn.email({
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

    toast.success("Signed in successfully");
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
          <AlertTitle>Couldn’t sign you in</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Field data-invalid={!!errors.email}>
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

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="•••••••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <div className="flex items-center justify-between">
            <FieldError errors={errors.password}/>
            <Button asChild variant="link" size="sm" className="ms-auto">
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </Button>
          </div>
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Spinner /> Signing in...</> : "Log In"}
        </Button>
      </form>

      <p className="text-center text-foreground">
        Don&apos;t have an account?{" "}
        <Button asChild variant="link" className="p-0">
          <Link href="/auth/signup">
            <strong>Sign Up</strong>
          </Link>
        </Button>
      </p>
    </div>
  );
}
