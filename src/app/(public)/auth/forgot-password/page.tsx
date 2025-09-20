"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Form } from "react-aria-components";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import "../form.scss";

import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import useCountdown from "@/hooks/use-countdown";
import { authClient } from "@/lib/auth/client";
import BackIcon from "@public/assets/icons/caret-left.svg";

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address.")
    .required("Please fill out this field."),
});

type ForgotPasswordSchemaType = Yup.InferType<typeof ForgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const { formatted, reset, start, isActive } = useCountdown({
    minutes: 1,
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchemaType) => {
    // Ignore error to prevent user enumeration
    await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/auth/password-reset",
    });

    // Restart countdown
    reset();
    start();
  };

  return (
    <div className="form-container">
      <h1 className="form-title">
        {isSubmitSuccessful ? "Check your mail" : "Reset your password"}
      </h1>

      <Form
        onSubmit={handleSubmit(onSubmit)}
        validationBehavior="aria"
        className="form-content"
      >
        {isSubmitSuccessful ? (
          <p>
            We have sent the password reset instructions to{" "}
            <strong>{getValues("email")}</strong>
            <br />
            Did not receive the email? Check your spam folder or click below to
            resend instructions.
          </p>
        ) : (
          <TextInput
            type="email"
            label="Email"
            placeholder="Enter your email"
            errorMessage={errors.email?.message}
            {...register("email")}
          />
        )}

        <Button type="submit" isDisabled={isActive}>
          {isActive ? (
            <strong>{formatted}</strong>
          ) : isSubmitSuccessful ? (
            "Resend Instructions"
          ) : (
            "Send Instructions"
          )}
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
