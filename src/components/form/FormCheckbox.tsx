import { Checkbox } from "../primitives/checkbox"
import { FormBase, type FormControlFunc } from "./FormBase"

export const FormCheckbox: FormControlFunc<boolean> = props => {
  return (
    <FormBase orientation={"horizontal"} {...props} controlFirst>
      {({ onChange, value, ...field }) => (
        <Checkbox {...field} checked={value} onCheckedChange={onChange} />
      )}
    </FormBase>
  )
}
