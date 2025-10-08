"use client";

import { authClient } from "@/lib/auth/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import "../index.scss";

import { Button } from "@/components/primitives/Button";
import { FormContent } from "@/components/primitives/form";
import { RootError } from "@/components/primitives/form/errors/RootError";
import { TextInput } from "@/components/primitives/form/TextInput";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
import { Form } from "react-aria-components";
import { toast } from "sonner";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Please fill out this field."),
  password: Yup.string().required("Please fill out this field."),
});

type LoginSchemaType = Yup.InferType<typeof LoginSchema>;

export default function LoginForm() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(LoginSchema),
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
    } else {
      toast.success("Signed in successfully");
    }
  };

  return (
    <div className="auth-form-container">
      <h1 className="auth-form-title">Welcome!</h1>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        validationBehavior="aria"
      >
        <FormContent>
          <RootError id="form-error" message={errors.root?.message} />

          <TextInput
            type="email"
            label="Email"
            placeholder="Enter your email"
            errorMessage={errors.email?.message}
            control={control}
            name="email"
          />

          <TextInput
            type="password"
            label="Password"
            description={
              <Button variant="link" href="/auth/forgot-password">
                Forgot password?
              </Button>
            }
            inlineDescription={true}
            placeholder="Enter your password"
            errorMessage={errors.password?.message}
            control={control}
            name="password"
          />

          <Button type="submit">
            {isSubmitting ? "Signing in..." : "Log In"}
          </Button>

          <p className="auth-form-footer">
            Don't have an account?{" "}
            <Button variant="link" href="/auth/signup">
              <strong>Sign Up</strong>
            </Button>
          </p>
        </FormContent>
      </Form>
    </div>
  );
}
