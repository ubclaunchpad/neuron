import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import {
  VolunteerProfileSchema,
  type VolunteerProfileSchemaType,
} from "./schema";

const VolunteerProfileFormContext = createContext<{
  form: UseFormReturn<VolunteerProfileSchemaType>;
} | null>(null);

export function VolunteerProfileFormProvider({
  initial,
  onSubmit,
  children,
}: {
  initial: VolunteerProfileSchemaType;
  onSubmit: (data: VolunteerProfileSchemaType) => void;
  children: React.ReactNode;
}) {
  const form = useForm<VolunteerProfileSchemaType>({
    resolver: zodResolver(VolunteerProfileSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <VolunteerProfileFormContext.Provider value={{ form }}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
    </VolunteerProfileFormContext.Provider>
  );
}

export function useVolunteerProfileForm() {
  const ctx = useContext(VolunteerProfileFormContext);
  if (!ctx)
    throw new Error(
      "useVolunteerProfileForm must be used inside VolunteerProfileFormProvider",
    );
  return ctx;
}
