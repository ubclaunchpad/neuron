import * as TogglePrimitive from "@radix-ui/react-toggle"
import * as React from "react"

function Toggle({
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      {...props}
    />
  )
}

export { Toggle }

