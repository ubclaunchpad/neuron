"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form } from "react-aria-components";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import "../form.scss";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { RootError } from "@/components/primitives/FormErrors/RootError";
import { TextInput } from "@/components/primitives/TextInput";
import { authClient } from "@/lib/auth/client";
import { getBetterAuthErrorMessage, type ErrorCode } from "@/lib/auth/extensions/get-better-auth-error";

const SignupSchema = Yup.object().shape({
  firstName: Yup.string().required("Please fill out this field."),
  lastName: Yup.string().required("Please fill out this field."),
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Please fill out this field."),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long.")
    .required("Please fill out this field."),
  confirmPassword: Yup.string()
    .required("Please fill out this field.")
    .oneOf([Yup.ref("password")], "Passwords don't match."),
});

type SignupSchemaType = Yup.InferType<typeof SignupSchema>;

export default function SignupForm() {
  const [successMessage, setSuccessMessage] = useState<React.ReactNode>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(SignupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
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
        message: getBetterAuthErrorMessage(error.code as ErrorCode),
      });
    } else {
      setSuccessMessage(
        "Your account has been successfully created! Please check your email to verify your account."
      );

      // Redirect to login page after 5 seconds on success
      setTimeout(() => router.replace("/auth/login"), 5000);
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

        {successMessage && (
          <Card variant="success" size="small" role="alert">
            {successMessage}
          </Card>
        )}

        <div className="form-group">
          <TextInput
            label="First name"
            placeholder="Enter your first name"
            errorMessage={errors.firstName?.message}
            {...register("firstName")}
          />

          <TextInput
            label="Last name"
            placeholder="Enter your last name"
            errorMessage={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <TextInput
          type="email"
          label="Email"
          placeholder="Enter your email"
          errorMessage={errors.email?.message}
          {...register("email")}
        />

        <TextInput
          type="password"
          label="Create password (at least 8 characters)"
          placeholder="Create a password"
          errorMessage={errors.password?.message}
          {...register("password")}
        />

        <TextInput
          type="password"
          label="Confirm password"
          placeholder="Confirm your password"
          errorMessage={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit">
          {isSubmitting ? "Creating..." : "Create an Account"}
        </Button>

        <p className="form-footer">
          Already have an account?{" "}
          <Button variant="link" href="/auth/login">
            <strong>Log In</strong>
          </Button>
        </p>
      </Form>
    </div>
  );
}
