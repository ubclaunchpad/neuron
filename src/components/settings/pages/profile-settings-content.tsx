"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/primitives/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

import { WithPermission } from "@/components/utils/with-permission";
// import { ProfilePictureUpload } from "@/components/profile/profile-picture-upload";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";
import { authClient } from "@/lib/auth/client";

const ProfileSchema = z.object({
  firstName: z.string().nonempty("Please enter your first name."),
  lastName: z.string().nonempty("Please enter your last name."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .nonempty("Email is required."),
  preferredName: z.string().optional(),
  pronouns: z.string().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

type ProfileSchemaType = z.infer<typeof ProfileSchema>;

export function ProfileSettingsContent() {
  const { user } = useAuth();
  const { refetch: refetchSession } = authClient.useSession();

  const utils = clientApi.useUtils();
  const { data: volunteer } = clientApi.volunteer.byId.useQuery(
    { userId: user!.id },
    { enabled: !!user }
  );
  const updateProfile = clientApi.volunteer.updateVolunteerProfile.useMutation({
    onSuccess: async () => {
      await utils.volunteer.byId.invalidate({ userId: user!.id })
      await refetchSession(); // so we can keep user-level changes up to date
    },
  });  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(ProfileSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: user?.name ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      preferredName: "",
      pronouns: "",
      bio: "",
      city: "",
      province: "",
      profilePictureUrl: undefined,
    },
  });

  useEffect(() => {
    if (!volunteer) return;

    reset({
      firstName: user?.name ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      preferredName: volunteer.preferredName ?? "",
      pronouns: volunteer.pronouns ?? "",
      bio: volunteer.bio ?? "",
      city: volunteer.city ?? "",
      province: volunteer.province ?? "",
      profilePictureUrl: undefined,
    });
  }, [volunteer, user, reset]);

  const onSubmit = async (data: ProfileSchemaType) => {
    if (!user?.id) return;

    const result = await updateProfile.mutateAsync({
      volunteerUserId: user.id,
      ...data,
    });

    if (!result.ok) {
      setError("root", {
        type: "custom",
        message: "Something went wrong.",
      });
      return;
    }

    setSuccessMessage("Your profile has been successfully updated!");
  };

  return (
    <WithPermission permissions={{ permission: { profile: ["update"] } }}>
      {errors.root?.message && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn’t update profile</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card className="shadow-sm flex">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="flex gap-8">
              <div className="flex flex-col gap-2 justify-start">
                <FieldLabel>Profile Picture</FieldLabel>
                <div className="flex">
                  
                </div>
              </div>

              <div className="flex flex-grow flex-col gap-4">
                <Field data-invalid={!!errors.firstName}>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input id="firstName" {...register("firstName")} />
                  <FieldError errors={errors.firstName} />
                </Field>

                <Field data-invalid={!!errors.lastName}>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input id="lastName" {...register("lastName")} />
                  <FieldError errors={errors.lastName} />
                </Field>
              </div>
            </div>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" {...register("email")} />
              <FieldError errors={errors.email} />
            </Field>

            <Field data-invalid={!!errors.preferredName}>
              <FieldLabel htmlFor="preferredName">Preferred Name</FieldLabel>
              <Input id="preferredName" {...register("preferredName")} />
              <FieldError errors={errors.preferredName} />
            </Field>

            <Field data-invalid={!!errors.pronouns}>
              <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
              <Input id="pronouns" {...register("pronouns")} />
              <FieldError errors={errors.pronouns} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" {...register("city")} />
                <FieldError errors={errors.city} />
              </Field>

              <Field data-invalid={!!errors.province}>
                <FieldLabel htmlFor="province">Province</FieldLabel>
                <Input id="province" {...register("province")} />
                <FieldError errors={errors.province} />
              </Field>
            </div>

            <Field data-invalid={!!errors.bio}>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <Textarea id="bio" {...register("bio")} />
              <FieldError errors={errors.bio} />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-fit">
                {isSubmitting ? (
                  <>
                    <Spinner /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </WithPermission>
  );
}
