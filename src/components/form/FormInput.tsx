import type { HTMLInputTypeAttribute } from "react";
import { Input } from "../primitives/input";
import { FormBase, type FormControlFunc } from "./FormBase";

export const FormInput: FormControlFunc<
  string | number | undefined,
  { placeholder?: string; className?: string, type?: HTMLInputTypeAttribute }
> = ({ placeholder, className, type, ...props }) => {
  return (
    <FormBase {...props}>
      {(field) => (
        <Input type={type} placeholder={placeholder} className={className} {...field} />
      )}
    </FormBase>
  );
};
