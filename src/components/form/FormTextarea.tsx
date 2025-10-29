import { Textarea } from "../primitives/textarea";
import { FormBase, type FormControlFunc } from "./FormBase";

export const FormTextarea: FormControlFunc<string | undefined, { 
  placeholder?: string;
  rows?: number;
  resizable?: boolean;
}> = ({
  placeholder,
  rows = 3,
  resizable = false,
  ...props
}) => {
  return <FormBase {...props}>
    {field => <Textarea 
      rows={rows}
      className={resizable ? "" : "resize-none"}
      placeholder={placeholder} 
      {...field} 
    />}
  </FormBase>
}
