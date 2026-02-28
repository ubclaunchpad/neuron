"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, type ComponentProps } from "react";
import { useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import {
  TermEditSchema,
  type TermEditSchemaInput,
  type TermEditSchemaOutput,
} from "./schema";
import type { DeepAllUnionFields } from "@/utils/typeUtils";

type TermFormContextValue = {
  form: UseFormReturn<TermEditSchemaInput, any, TermEditSchemaOutput>;
  fullErrors: FieldErrors<DeepAllUnionFields<TermEditSchemaInput>>;
  submitting: boolean;
  isDirty: boolean;
  editing: boolean;
  termId?: string;
};

const TermFormContext = createContext<TermFormContextValue | null>(null);

export function TermFormProvider({
  initial,
  onSubmit,
  submitting,
  editing,
  termId,
  children,
  ...props
}: {
  initial: TermEditSchemaInput;
  onSubmit: (data: TermEditSchemaOutput) => void;
  submitting: boolean;
  editing: boolean;
  termId?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"form">, "onSubmit">) {
  const form = useForm({
    resolver: zodResolver(TermEditSchema),
    values: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Deep union to get all type combinations for errors
  const fullErrors: FieldErrors<DeepAllUnionFields<TermEditSchemaInput>> =
    form.formState.errors;
  const { isDirty } = form.formState;

  return (
    <TermFormContext.Provider
      value={{ form, fullErrors, submitting, isDirty, editing, termId }}
    >
      <form {...props} onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </TermFormContext.Provider>
  );
}

export function useTermForm() {
  const context = useContext(TermFormContext);
  if (!context)
    throw new Error("useTermForm must be used within TermFormProvider");
  return context;
}
