"use client";

import {
  useFileDropzone,
  type FileDropzoneActions,
  type FileDropzoneOptions,
  type FileDropzoneState,
} from "@/hooks/use-file-dropzone";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Button } from "./button";

type DropzoneContextValue = {
  state: FileDropzoneState;
  actions: FileDropzoneActions;
  inputId: string;
};

const DropzoneContext = React.createContext<DropzoneContextValue | null>(null);

function useDropzoneContext() {
  const ctx = React.useContext(DropzoneContext);
  if (!ctx) {
    throw new Error(
      "Dropzone components must be used within <DropzoneProvider>.",
    );
  }
  return ctx;
}

export function useDropzone() {
  return useDropzoneContext();
}

export interface DropzoneProps extends FileDropzoneOptions {
  children: React.ReactNode;
}

const Dropzone = ({ 
  children,
  ...options 
}: DropzoneProps) => {
  const [state, actions] = useFileDropzone(options);
  const inputId = React.useId();

  return (
    <DropzoneContext.Provider value={{ state, actions, inputId }}>
      {children}
      {/* Hidden file input lives in the provider, not the visual dropzone */}
      <input
        {...actions.getInputProps({
          id: inputId,
          className: "hidden",
        })}
      />
    </DropzoneContext.Provider>
  );
};

const DropzoneArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      onClick,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      ...rest
    },
    ref,
  ) => {
    const { state, actions } = useDropzoneContext();

    const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      actions.openFileDialog();
    };

    const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (event) => {
      onDragEnter?.(event);
      if (event.defaultPrevented) return;
      actions.handleDragEnter(event);
    };

    const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
      onDragLeave?.(event);
      if (event.defaultPrevented) return;
      actions.handleDragLeave(event);
    };

    const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
      onDragOver?.(event);
      if (event.defaultPrevented) return;
      actions.handleDragOver(event);
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
      onDrop?.(event);
      if (event.defaultPrevented) return;
      actions.handleDrop(event);
    };

    return (
      <div
        ref={ref}
        data-state={state.isDragging ? "active" : "idle"}
        className={cn(
          // group lets inner components respond to data-state
          "group/dropzone flex min-w-0 flex-1 flex-col items-center justify-center gap-4",
          "rounded-lg border border-dashed border-border bg-background p-6 text-center md:p-12",
          "cursor-pointer transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "data-[state=active]:border-primary/60 data-[state=active]:bg-primary/5",
          className,
        )}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...rest}
      />
    );
  },
);
DropzoneArea.displayName = "DropzoneArea";

const DropzoneLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, onClick, ...props }, ref) => {
  const { inputId, actions } = useDropzoneContext();

  return (
    <label
      ref={ref}
      htmlFor={inputId}
      className={cn("cursor-pointer hover:underline", className)}
      onClick={(event) => {
        // Don't bubble to the dropzone root
        event.stopPropagation();
        onClick?.(event);
        if (event.defaultPrevented) return;
        actions.openFileDialog();
      }}
      {...props}
    />
  );
});
DropzoneLabel.displayName = "DropzoneLabel";

const DropzoneOpenButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { actions } = useDropzoneContext();

  return (
    <Button
      ref={ref}
      className={className}
      onClick={(event) => {
        // Don't bubble to the dropzone root
        event.stopPropagation();
        onClick?.(event);
        if (event.defaultPrevented) return;
        actions.openFileDialog();
      }}
      {...props}
    />
  );
});
DropzoneOpenButton.displayName = "DropzoneOpenButton";

const DropzoneRemoveFileButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { actions } = useDropzoneContext();

  return (
    <Button
      ref={ref}
      className={className}
      onClick={(event) => {
        // Don't bubble to the dropzone root
        event.stopPropagation();
        onClick?.(event);
        if (event.defaultPrevented) return;
        actions.clearFiles();
      }}
      {...props}
    />
  );
});
DropzoneRemoveFileButton.displayName = "DropzoneRemoveFileButton";

const DropzoneHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dropzone-header"
    className={cn(
      "flex max-w-sm flex-col items-center gap-2 text-center",
      className,
    )}
    {...props}
  />
));
DropzoneHeader.displayName = "DropzoneHeader";

const dropzoneMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent",
        icon:
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground " +
          "[&_svg:not([class*='size-'])]:size-5 " +
          "group-data-[state=active]/dropzone:bg-primary group-data-[state=active]/dropzone:text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type DropzoneMediaProps = React.ComponentProps<"div"> &
  VariantProps<typeof dropzoneMediaVariants>;

const DropzoneMedia = React.forwardRef<HTMLDivElement, DropzoneMediaProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dropzone-media"
      data-variant={variant}
      className={cn(dropzoneMediaVariants({ variant, className }))}
      {...props}
    />
  ),
);
DropzoneMedia.displayName = "DropzoneMedia";

const DropzoneTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dropzone-title"
    className={cn("text-[18px] font-medium tracking-tight", className)}
    {...props}
  />
));
DropzoneTitle.displayName = "DropzoneTitle";

const DropzoneDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="dropzone-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DropzoneDescription.displayName = "DropzoneDescription";

const DropzoneHint = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="dropzone-hint"
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
DropzoneHint.displayName = "DropzoneHint";

const DropzoneContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dropzone-content"
    className={cn(
      "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
      className,
    )}
    {...props}
  />
));
DropzoneContent.displayName = "DropzoneContent";

export {
  Dropzone,
  DropzoneArea, DropzoneContent, DropzoneDescription, DropzoneHeader, DropzoneHint, DropzoneLabel, DropzoneMedia, DropzoneOpenButton, DropzoneTitle
};

