import { Select, SelectContent, SelectTrigger, SelectValue } from "../primitives/select"
import { FormBase, type FormControlFunc } from "./FormBase"

export const FormSelect: FormControlFunc<string | number | undefined, { 
  placeholder?: string,
  className?: string,
  children: React.ReactNode
}> = ({
  placeholder,
  className,
  children,
  ...props
}) => {
  return (
    <FormBase {...props}>
      {({ onChange, onBlur, ...field }) => (
        <Select {...field} onValueChange={onChange}>
          <SelectTrigger
            aria-invalid={field["aria-invalid"]}
            id={field.id}
            onBlur={onBlur}
          >
            <SelectValue placeholder={placeholder} className={className} />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      )}
    </FormBase>
  )
}
