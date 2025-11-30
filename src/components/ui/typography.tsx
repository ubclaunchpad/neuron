import { cn } from "@/lib/utils";

export function TypographyXLTitle({ children, className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-display text-4xl font-bold text-balance",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function TypographyLargeTitle({ children, className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-display text-2xl font-medium text-balance",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function TypographyPageTitle({ children, className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-bold text-balance",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function TypographyTitle({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("font-display text-md font-semibold", className)} {...props}>
      {children}
    </span>
  );
}

export function TypographyReg({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("font-body text-base", className)} {...props}>
      {children}
    </p>
  );
}

export function TypographyRegBold({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-body text-base font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function TypographySmall({ children, className, ...props }: React.ComponentProps<"small">) {
  return (
    <small
      className={cn(
        "font-body text-xs",
        className,
      )}
      {...props}
    >
      {children}
    </small>
  );
}
