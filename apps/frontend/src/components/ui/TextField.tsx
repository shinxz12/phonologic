import { useId, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";
import "./TextField.css";

export function TextField({
  label,
  error,
  hint,
  icon,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const description = error ?? hint;
  return (
    <div className={`ds-field ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className={`ds-field-control ${error ? "is-error" : ""}`}>
        {icon && <Icon name={icon} size={20} />}
        <input
          {...props}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? `${inputId}-description` : undefined}
        />
      </div>
      {description && (
        <p
          id={`${inputId}-description`}
          className={error ? "ds-field-error" : ""}
        >
          {description}
        </p>
      )}
    </div>
  );
}
