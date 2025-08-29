'use client';

import { authClient } from "@/lib/auth/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Form } from 'react-aria-components';
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import '../form.scss';

import { Button } from '@/app/_components/primitives/Button';
import { Card } from "@/app/_components/primitives/Card";
import { RootError } from "@/app/_components/primitives/FormErrors/RootError";
import { TextInput } from "@/app/_components/primitives/TextInput";
import { getBetterAuthErrorMessage } from "@/lib/auth/getError";
import BackIcon from '@public/assets/caret-left-icon.svg';

const PasswordResetSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long.")
    .required("Please fill out this field."),
  confirmPassword: Yup.string()
    .required("Please fill out this field.")
    .oneOf([Yup.ref("password"), null], "Passwords don't match."),
});

type PasswordResetSchemaType = Yup.InferType<typeof PasswordResetSchema>;

export default function PasswordResetForm() {
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<React.ReactNode>(null);
  const params = useSearchParams();
  const token = params.get('token');
  const error = params.get('error') ? "Invalid or expired token. Please try resetting your password again." : null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(PasswordResetSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordResetSchemaType) => {
    const { error } = await authClient.resetPassword({
      token,
      newPassword: data.password,
    });

    if (error) {
      setError('root', {
        type: 'custom',
        message: getBetterAuthErrorMessage(error.code),
      });
    } else {
      setSuccessMessage('Password successfully reset!');
      setTimeout(() => router.replace('/auth/login'), 3000);
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Set your new password</h2>

      <Form onSubmit={handleSubmit(onSubmit)} validationBehavior="aria" className="form-content">
        <RootError id="form-error" message={error || errors.root?.message} />

        { successMessage && (
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
          {...register('password')}
        />

        <TextInput
          type="password"
          disabled={!!error}
          label="Confirm password"
          placeholder="Confirm your password"
          errorMessage={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        <Button type="submit" isDisabled={!!error}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>

        <p className="form-footer">
          <Button variant="link" href="/auth/login">
            <BackIcon />
            <span>Back to login</span>
          </Button>
        </p>
      </Form>
    </div>
  );
}