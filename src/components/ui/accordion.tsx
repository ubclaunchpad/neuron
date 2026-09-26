import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

type AccordionBaseProps = Omit<
  AccordionPrimitive.Root.Props<string>,
  "value" | "defaultValue" | "onValueChange" | "multiple"
>;

type AccordionSelectionProps =
  | {
      type?: "single";
      collapsible?: boolean;
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
    }
  | {
      type: "multiple";
      collapsible?: boolean;
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
    };

function Accordion({
  className,
  type = "single",
  value,
  defaultValue,
  onValueChange,
  collapsible: _collapsible,
  ...props
}: AccordionBaseProps & AccordionSelectionProps) {
  const normalizedValue =
    type === "multiple"
      ? (value as string[] | undefined)
      : value
        ? [value as string]
        : undefined;
  const normalizedDefaultValue =
    type === "multiple"
      ? (defaultValue as string[] | undefined)
      : defaultValue
        ? [defaultValue as string]
        : undefined;

  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      multiple={type === "multiple"}
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      onValueChange={(nextValue) => {
        if (type === "multiple") {
          (onValueChange as ((value: string[]) => void) | undefined)?.(
            nextValue,
          );
        } else {
          (onValueChange as ((value: string) => void) | undefined)?.(
            nextValue[0] ?? "",
          );
        }
      }}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 group-data-[panel-open]/accordion-trigger:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pt-0 pb-4 data-ending-style:h-0 data-starting-style:h-0",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
