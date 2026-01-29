import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { ProfileSchema, type ProfileSchemaType } from "./schema";

const ProfileFormContext = createContext<{
  form: UseFormReturn<ProfileSchemaType>;
} | null>(null);

export function ProfileFormProvider({
  initial,
  onSubmit,
  children,
}: {
  initial: ProfileSchemaType;
  onSubmit: (data: ProfileSchemaType) => void;
  children: React.ReactNode;
}) {
  const form = useForm<ProfileSchemaType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <ProfileFormContext.Provider value={{ form }}>
      <ProfileFormWrapper onSubmit={onSubmit}>
        {children}
      </ProfileFormWrapper>
    </ProfileFormContext.Provider>
  );
}

function ProfileFormWrapper({
  onSubmit,
  children,
}: {
  onSubmit: (data: ProfileSchemaType) => void;
  children: React.ReactNode;
}) {
  const { form } = useProfileForm();
  return <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>;
}

export function useProfileForm() {
  const ctx = useContext(ProfileFormContext);
  if (!ctx)
    throw new Error("useProfileForm must be used inside ProfileFormProvider");
  return ctx;
}
