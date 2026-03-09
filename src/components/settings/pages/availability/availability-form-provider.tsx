import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import {
  AvailabilitySchema,
  type AvailabilitySchemaInput,
  type AvailabilitySchemaOutput,
} from "./schema";

const AvailabilityFormContext = createContext<{
  form: UseFormReturn<AvailabilitySchemaInput, any, AvailabilitySchemaOutput>;
} | null>(null);

export function AvailabilityFormProvider({
  initial,
  onSubmit,
  children,
}: {
  initial: AvailabilitySchemaInput;
  onSubmit: (data: AvailabilitySchemaOutput) => void;
  children: React.ReactNode;
}) {
  const form = useForm<AvailabilitySchemaInput, any, AvailabilitySchemaOutput>({
    resolver: zodResolver(AvailabilitySchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <AvailabilityFormContext.Provider value={{ form }}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
    </AvailabilityFormContext.Provider>
  );
}

export function useAvailabilityForm() {
  const ctx = useContext(AvailabilityFormContext);
  if (!ctx)
    throw new Error(
      "useAvailabilityForm must be used inside AvailabilityFormProvider",
    );
  return ctx;
}