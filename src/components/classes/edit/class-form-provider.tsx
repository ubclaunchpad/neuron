import type { UpdateClassInput } from "@/models/api/class";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import {
  ClassEditSchema,
  type ClassEditSchemaInput,
  type ClassEditSchemaOutput,
  type ClassEditSchemaType,
} from "./schema";
import { useClassFormSubmit } from "./hooks/use-class-form-submit";

const ClassFormContext = createContext<{
  form: UseFormReturn<ClassEditSchemaInput, any, ClassEditSchemaOutput>;
  initial: ClassEditSchemaType;
  isClassPublished: boolean;
  isEditing: boolean;
  editingClassId?: string;
} | null>(null);

export type ClassFormValues = Omit<UpdateClassInput, "id">;

export function ClassFormProvider({
  initial,
  onSubmit,
  isClassPublished,
  isEditing,
  editingClassId,
  children,
}: {
  initial: ClassEditSchemaType;
  onSubmit: (data: Record<string, unknown>) => void;
  isClassPublished: boolean;
  isEditing: boolean;
  editingClassId?: string;
  children?: React.ReactNode;
}) {
  const form = useForm({
    resolver: zodResolver(ClassEditSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return (
    <ClassFormContext.Provider
      value={{ form, initial, isClassPublished, isEditing, editingClassId }}
    >
      <ClassFormWrapper onSubmit={onSubmit}>{children}</ClassFormWrapper>
    </ClassFormContext.Provider>
  );
}

function ClassFormWrapper({
  onSubmit,
  children,
}: {
  onSubmit: (data: Record<string, unknown>) => void;
  children: React.ReactNode;
}) {
  const { form } = useClassForm();
  const { handleFormSubmit } = useClassFormSubmit({ onSubmit });
  return <form onSubmit={form.handleSubmit(handleFormSubmit)}>{children}</form>;
}

export function useClassForm() {
  const context = useContext(ClassFormContext);
  if (!context)
    throw new Error("useClassForm must be used within ClassFormProvider");
  return context;
}
