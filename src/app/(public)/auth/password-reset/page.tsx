"use client";

import { authClient } from "@/lib/auth/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Form } from 'react-aria-components';
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import "../index.scss";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { FormContent } from "@/components/primitives/form";
import { RootError } from "@/components/primitives/form/errors/RootError";
import { TextInput } from "@/components/primitives/form/TextInput";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import BackIcon from "@public/assets/icons/caret-left.svg";

const PasswordResetSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long.")
    .required("Please fill out this field."),
  confirmPassword: Yup.string()
    .required("Please fill out this field.")
    .oneOf([Yup.ref("password")], "Passwords don't match."),
});

// export const PasswordResetSchema2 = z
//   .object({
//     password: z.string()
//       .nonempty("Please fill out this field.")
//       .min(8, "Password must be at least 8 characters long."),
//     confirmPassword: z.string().nonempty("Please fill out this field."),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match.",
//     path: ["confirmPassword"],
//   });

type PasswordResetSchemaType = Yup.InferType<typeof PasswordResetSchema>;

export default function PasswordResetForm() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<React.ReactNode>(null);
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error")
    ? "Invalid or expired token. Please try resetting your password again."
    : null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(PasswordResetSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordResetSchemaType) => {
    const { error } = await authClient.resetPassword({
      token: token ?? undefined,
      newPassword: data.password,
    });

    if (error) {
      setError("root", {
        type: "custom",
        message: getBetterAuthErrorMessage(error?.code),
      });
    } else {
      setSuccessMessage("Password successfully reset!");
      setTimeout(() => router.replace("/auth/login"), 3000);
    }
  };

  return (
    <div className="auth-form-container">
      <h1 className="auth-form-title">Set your new password</h1>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        validationBehavior="aria"
      >
        <FormContent>
          <RootError id="form-error" message={error || errors.root?.message} />

          {successMessage && (
            <Card variant="success" size="small" role="alert">
              {successMessage}
            </Card>
          )}

          <TextInput
            type="password"
            disabled={!!error}
            label="Create password (at least 8 characters)"
            placeholder="Create a password"
            errorMessage={errors.password?.message}
            autoComplete="new-password"
            {...register("password")}
          />

          <TextInput
            type="password"
            disabled={!!error}
            label="Confirm password"
            placeholder="Confirm your password"
            errorMessage={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />

          <Button type="submit" isDisabled={!!error}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>

          <p className="auth-form-footer">
            <Button variant="link" href="/auth/login">
              <BackIcon />
              <span>Back to login</span>
            </Button>
          </p>
        </FormContent>
      </Form>
    </div>
  );
}
