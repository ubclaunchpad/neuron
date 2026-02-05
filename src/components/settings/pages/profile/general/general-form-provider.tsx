"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { GeneralProfileSchema, type GeneralProfileSchemaType } from "./schema";

const GeneralProfileFormContext = createContext<{
  form: UseFormReturn<GeneralProfileSchemaType>;
} | null>(null);

export function GeneralProfileFormProvider({
  initial,
  onSubmit,
  children,
}: {
  initial: GeneralProfileSchemaType;
  onSubmit: (data: GeneralProfileSchemaType) => void;
  children: React.ReactNode;
}) {
  const form = useForm<GeneralProfileSchemaType>({
    resolver: zodResolver(GeneralProfileSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <GeneralProfileFormContext.Provider value={{ form }}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
    </GeneralProfileFormContext.Provider>
  );
}

export function useGeneralProfileForm() {
  const ctx = useContext(GeneralProfileFormContext);
  if (!ctx)
    throw new Error(
      "useGeneralProfileForm must be used inside GeneralProfileFormProvider",
    );
  return ctx;
}
