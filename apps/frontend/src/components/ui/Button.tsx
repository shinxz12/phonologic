import { type ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";
import "./Button.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
};
export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`ds-button ds-button--${variant} ds-button--${size} ${className}`}
    >
      {loading ? (
        <Icon name="progress_activity" className="ds-spin" size={20} />
      ) : (
        icon && <Icon name={icon} size={20} />
      )}
      {children}
    </button>
  );
}
