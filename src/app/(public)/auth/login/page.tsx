"use client";

import { authClient } from "@/lib/auth/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { Form } from "react-aria-components";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import "../index.scss";

import { Button } from "@/components/primitives/Button";
import { RootError } from "@/components/primitives/FormErrors/RootError";
import { TextInput } from "@/components/primitives/TextInput";
import { getBetterAuthErrorMessage } from "@/lib/auth/extensions/get-better-auth-error";
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
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
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
    <div className="form-container">
      <h1 className="form-title">Welcome!</h1>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        validationBehavior="aria"
        className="form-content"
      >
        <RootError id="form-error" message={errors.root?.message} />

        <TextInput
          type="email"
          label="Email"
          placeholder="Enter your email"
          errorMessage={errors.email?.message}
          {...register("email")}
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
          {...register("password")}
        />

        <Button type="submit">
          {isSubmitting ? "Signing in..." : "Log In"}
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
