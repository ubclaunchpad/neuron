import { cn } from "@/lib/utils";

type Props = { children: React.ReactNode; className?: string };

export function TypographyXLTitle({ children, className }: Props) {
  return (
    <h1
      className={cn(
        "font-display text-4xl font-bold text-balance",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function TypographyLargeTitle({ children, className }: Props) {
  return (
    <h2
      className={cn(
        "font-display text-2xl font-medium text-balance",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function TypographyPageTitle({ children, className }: Props) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-bold text-balance",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function TypographyTitle({ children, className }: Props) {
  return (
    <span className={cn("font-display text-md font-semibold", className)}>
      {children}
    </span>
  );
}

export function TypographyReg({ children, className }: Props) {
  return (
    <p className={cn("font-body text-base", className)}>
      {children}
    </p>
  );
}

export function TypographyRegBold({ children, className }: Props) {
  return (
    <span
      className={cn(
        "font-body text-base font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TypographySmall({ children, className }: Props) {
  return (
    <small
      className={cn(
        "font-body text-xs",
        className,
      )}
    >
      {children}
    </small>
  );
}
