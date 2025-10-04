"use client";

import clsx from "clsx";
import "./form.scss";

export const FormContent = ({ 
    children, 
    className,
    ...props 
}: {
    children: React.ReactNode;
    className?: string;
}) => {
  return (
    <div className={clsx("form-content", className)}>
      {children}
    </div>
  );
};

export const FormGroup = ({
  children,
  className,
  columns,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: string;
}) => {
  return (
    <div 
        className={clsx("form-group", className)}
        style={{
            'gridTemplateColumns': columns
        }}
    >
      {children}
    </div>
  );
};

export * from "../DatePicker";
export * from "./Select";
export * from "./Textarea";
export * from "./TextInput";

