import React from "react";
import { Controller, FieldValues,Path,Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";



interface FormFieldProps<T extends FieldValues> {
    name: Path<T>;
    label?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password'|'file';
    control: Control<T>;

}


const FormField = ({ control ,name,label,placeholder,type="text" }:FormFieldProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input className="input" placeholder={placeholder}type={type} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default FormField;
