"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";

import { FormFieldController } from "@/components/form/FormField";
import { FormInput, FormInputField } from "@/components/form/FormInput";
import { FormError, FormField, FormLabel } from "@/components/form/FormLayout";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    }
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
          <AlertTitle>Couldn’t sign you in</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        <FormInputField
          control={control}
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="john.doe@example.com"
          className="gap-1"
        />

        <FormFieldController name="password" control={control}>
          {(field) => (
            <FormField>
              <FormLabel>Password</FormLabel>
              <FormInput
                type="password"
                autoComplete="current-password"
                placeholder="•••••••••••••"
                {...field}
              />
              <div className="flex items-center justify-between">
                <FormError />
                <Button asChild variant="link" size="sm" className="ms-auto">
                  <Link href="/auth/forgot-password">Forgot password?</Link>
                </Button>
              </div>
            </FormField>
          )}
        </FormFieldController>
      </div>

        <div className="space-y-5">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner /> Signing in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
          <p className="text-center text-foreground">
            Don&apos;t have an account?{" "}
            <Button asChild variant="link" className="p-0">
              <Link href="/auth/signup">
                <strong>Sign Up</strong>
              </Link>
            </Button>
          </p>
        </div>
    </form>
  );
}
