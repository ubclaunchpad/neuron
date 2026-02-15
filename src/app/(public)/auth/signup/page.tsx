"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const isInviteFlow = !!invitationId;

  const {
    handleSubmit,
    setError,
    setValue,
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

  useEffect(() => {
    let mounted = true;

    const loadInvitation = async () => {
      if (!invitationId) {
        if (!mounted) return;
        setInvitationError(null);
        setInvitedEmail(null);
        setInvitedRole(null);
        return;
      }

      setIsLoadingInvitation(true);
      const { data, error } = await authClient.getAppInvitation({
        query: { id: invitationId },
      });

      if (!mounted) return;

      if (error || !data) {
        setInvitationError(
          "This invitation is invalid or expired. Please request a new invitation.",
        );
        setInvitedEmail(null);
        setInvitedRole(null);
        setIsLoadingInvitation(false);
        return;
      }

      setInvitationError(null);
      setInvitedEmail(data.email ?? null);

      const roleFromInvitation =
        typeof (data as { additionalFields?: { role?: unknown } }).additionalFields
          ?.role === "string"
          ? (data as { additionalFields?: { role?: string } }).additionalFields?.role
          : null;
      setInvitedRole(roleFromInvitation ?? null);

      if (data.email) {
        setValue("email", data.email, { shouldValidate: true });
      }

      setIsLoadingInvitation(false);
    };

    void loadInvitation();

    return () => {
      mounted = false;
    };
  }, [invitationId, setValue]);

  const inviteRoleLabel = useMemo(() => {
    if (invitedRole === "admin") return "admin";
    if (invitedRole === "instructor") return "instructor";
    return null;
  }, [invitedRole]);

  const onSubmit = async (data: SignupSchemaType) => {
    if (invitationId) {
      if (invitationError) {
        setError("root", {
          type: "custom",
          message: invitationError,
        });
        return;
      }

      if (invitedEmail && invitedEmail.toLowerCase() !== data.email.toLowerCase()) {
        setError("email", {
          type: "custom",
          message: "This invitation is for a different email address.",
        });
        return;
      }

      const { error } = await authClient.acceptInvitation({
        invitationId,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        additionalFields: {
          lastName: data.lastName,
        },
      });

      if (error) {
        setError("root", {
          type: "custom",
          message: getBetterAuthErrorMessage(error?.code),
        });
        return;
      }

      setSuccessMessage(
        "Your invitation has been accepted. You can now log in with your new account.",
      );
      setTimeout(() => router.replace("/auth/login"), 3000);
      return;
    }

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

      {isInviteFlow && isLoadingInvitation && (
        <Alert role="status" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Loading invitation...</AlertTitle>
          <AlertDescription>
            Verifying your invitation details.
          </AlertDescription>
        </Alert>
      )}

      {isInviteFlow && !isLoadingInvitation && !invitationError && (
        <Alert role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Invitation found</AlertTitle>
          <AlertDescription>
            {inviteRoleLabel
              ? `You were invited as an ${inviteRoleLabel}. Complete the form to continue.`
              : "Complete the form to accept your invitation."}
          </AlertDescription>
        </Alert>
      )}

      {invitationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid invitation</AlertTitle>
          <AlertDescription>{invitationError}</AlertDescription>
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
          readOnly={!!invitedEmail}
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
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingInvitation || !!invitationError}
            className="w-full"
          >
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
