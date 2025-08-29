'use client';

import { authClient } from "@/lib/auth/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import { Form } from 'react-aria-components';
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import '../form.scss';

import { Button } from "@/app/_components/primitives/Button";
import { RootError } from "@/app/_components/primitives/FormErrors/RootError";
import { TextInput } from "@/app/_components/primitives/TextInput";
import { getBetterAuthErrorMessage } from "@/lib/auth/getError";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Please fill out this field."),
  password: Yup.string().required("Please fill out this field."),
});

type LoginSchemaType = Yup.InferType<typeof LoginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(LoginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('root', {
        type: 'custom',
        message: getBetterAuthErrorMessage(error.code),
      });
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Welcome!</h2>

      <Form onSubmit={handleSubmit(onSubmit)} validationBehavior="aria" className="form-content">
        <RootError id="form-error" message={errors.root?.message} />
        
        <TextInput
          type="email"
          label="Email"
          placeholder="Enter your email"
          errorMessage={errors.email?.message}
          {...register('email')}
        />

        <TextInput
          type="password"
          label="Password"
          description={(
            <Button variant="link" href="/auth/forgot-password">
              Forgot password?
            </Button>
          )}
          inlineDescription={true}
          placeholder="Enter your password"
          errorMessage={errors.password?.message}
          {...register('password')}
        />
        
        <Button type="submit">
          {isSubmitting ? 'Signing in...' : 'Log In'}
        </Button>

        <p className="form-footer">
          Don't have an account?{" "}
          <Button variant="link" href="/auth/signup">
            <strong>Sign Up</strong>
          </Button>
        </p>
      </Form>
    </div>
  );
}
