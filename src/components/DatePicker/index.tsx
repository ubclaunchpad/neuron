// "use client";

// import { CalendarDate, getLocalTimeZone, today, } from "@internationalized/date";
// import { useDateFormatter } from "@react-aria/i18n";
// import clsx from "clsx";
// import React from "react";
// import {
//   Button as AriaButton,
//   DateInput as AriaDateInput,
//   DatePicker as AriaDatePicker,
//   DateSegment as AriaDateSegment,
//   Dialog as AriaDialog,
//   Group as AriaGroup,
//   Label as AriaLabel,
//   Popover as AriaPopover,
//   Text as AriaText,
//   type DatePickerProps as AriaDatePickerProps,
// } from "react-aria-components";
// import "./index.scss";

// import { FieldError } from "@/components/form/errors/FieldError";
// import { Calendar } from "@/components/primitives/Calendar";
// import CaretDownIcon from "@public/assets/icons/caret-down.svg";

// type Variant = "button" | "field";
// type FieldProps = Omit<AriaDatePickerProps<CalendarDate>, "children">;

// export interface DatePickerProps extends Omit<FieldProps, "children"> {
//   label?: React.ReactNode;
//   inlineLabel?: boolean;
//   description?: React.ReactNode;
//   inlineDescription?: boolean;
//   errorMessage?: React.ReactNode;
//   inputMode?: "field" | "calendar" | "both";
//   placeholder?: string;
//   displayFormatter?: (date: Date) => string | undefined;
//   formatOptions?: Intl.DateTimeFormatOptions;
//   className?: string;
//   variant?: Variant;
// }

// export function DatePicker({
//   label,
//   inlineLabel,
//   description,
//   inlineDescription,
//   errorMessage,
//   defaultValue,
//   inputMode = "both",
//   placeholder,
//   displayFormatter,
//   formatOptions,
//   className,
//   variant = "field",
//   isInvalid: propIsInvalid,
//   ...props
// }: DatePickerProps) {
//   const timeZone = getLocalTimeZone();
//   const df = useDateFormatter(
//     formatOptions ?? { month: "long", day: "numeric", year: "numeric" },
//   );

//   const formatDisplay = React.useCallback(
//     (value: CalendarDate | null) => {
//       if (!value) return placeholder ?? "";
//       const jsDate = value.toDate(timeZone);
//       return displayFormatter?.(jsDate) ?? df.format(jsDate);
//     },
//     [df, displayFormatter, placeholder, timeZone],
//   );

//   // We never want an empty calendar date when only the calendar button is shown.
//   if (!defaultValue && inputMode === "calendar") {
//     defaultValue = today(timeZone);
//   }

//   const isInvalid = propIsInvalid ?? !!errorMessage;
//   const isField = variant === "field";

//   return (
//     <AriaDatePicker
//       {...props}
//       defaultValue={defaultValue}
//       isInvalid={isInvalid}
//       aria-label={(!label && (placeholder || "Date")) || undefined}
//       className={clsx("form-input datepicker", { "select__field": !isField }, className)}
//       data-variant={variant}
//     >
//       {(picker) => (
//         <>
//           <div
//             className={clsx("form-input__group", {
//               "form-input__group-inline": inlineLabel,
//             })}
//           >
//             {label && (
//               <AriaLabel className="form-input__label">
//                 {label}
//               </AriaLabel>
//             )}

//             {/* INPUT RENDERING */}
//             {inputMode === "calendar" && (
//               <>
//                 {/* Keep a hidden DateInput for accessibility/value handling */}
//                 <AriaDateInput style={{ display: "none" }}>
//                   {(segment) => (
//                     <AriaDateSegment segment={segment} className="datepicker__segment" />
//                   )}
//                 </AriaDateInput>

//                 <AriaButton className="form-input__input-container" slot="trigger">
//                   <span className="form-input__input has-trailing-icon">
//                     {formatDisplay(picker.state.value as CalendarDate | null)}
//                   </span>
//                   <span className="form-input__trailing-icon" aria-hidden="true">
//                     <CaretDownIcon />
//                   </span>
//                 </AriaButton>
//               </>
//             )}

//             {inputMode === "field" && (
//               <AriaGroup className="form-input__input-container" role="presentation">
//                 <AriaDateInput
//                   className="form-input__input"
//                   aria-label={(typeof label === "string" && label) || placeholder || "Date"}
//                 >
//                   {(segment) => (
//                     <AriaDateSegment segment={segment} className="datepicker__segment" />
//                   )}
//                 </AriaDateInput>
//                 {/* No trigger shown; no calendar popover */}
//               </AriaGroup>
//             )}

//             {inputMode === "both" && (
//               <AriaGroup className="form-input__input-container" role="presentation">
//                 <AriaDateInput
//                   className="form-input__input has-trailing-icon"
//                   aria-label={(typeof label === "string" && label) || placeholder || "Date"}
//                 >
//                   {(segment) => (
//                     <AriaDateSegment segment={segment} className="datepicker__segment" />
//                   )}
//                 </AriaDateInput>

//                 <AriaButton className="form-input__trailing-icon" slot="trigger" aria-label="Open calendar">
//                   <CaretDownIcon />
//                 </AriaButton>
//               </AriaGroup>
//             )}
//           </div>

//           {!inlineDescription && description && (
//             <AriaText className="form-input__description" slot="description">
//               {description}
//             </AriaText>
//           )}

//           {(errorMessage || (inlineDescription && description)) && (
//             <div className="form-input__bottom-container">
//               <FieldError errorMessage={errorMessage} />
//               {inlineDescription && description && (
//                 <AriaText className="form-input__description" slot="description">
//                   {description}
//                 </AriaText>
//               )}
//             </div>
//           )}

//           {/* Only render popover when a calendar is available */}
//           {inputMode !== "field" && (
//             <AriaPopover className="select__popover" placement="bottom start">
//               <AriaDialog className="datepicker__dialog">
//                 <Calendar />
//               </AriaDialog>
//             </AriaPopover>
//           )}
//         </>
//       )}
//     </AriaDatePicker>
//   );
// }
