import * as React from "react";

import { cn } from "@/lib/utils";
import HideIcon from "@public/assets/icons/eye-off.svg";
import ShowIcon from "@public/assets/icons/eye.svg";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "[&::-webkit-calendar-picker-indicator]:bg-none [&::-webkit-calendar-picker-indicator]:hidden",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
  const [isPassVisible, setIsPassVisible] = React.useState(false);

  return (
    <InputGroup>
        <InputGroupInput type={isPassVisible ? "text" : "password"} {...props} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
              aria-label="Toggle Password Visibility"
              title="Toggle Password Visibility"
              size="icon-xs"
              onClick={() => {
                setIsPassVisible(!isPassVisible)
              }}
            >
              {isPassVisible ? <HideIcon /> : <ShowIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
  )
}

export { Input, PasswordInput };

