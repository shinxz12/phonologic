import { type ReactNode } from "react";
import { Icon } from "./Icon";
import "./Badge.css";

export function Badge({
  children,
  icon,
  tone = "blue",
}: {
  children: ReactNode;
  icon?: string;
  tone?: "blue" | "green" | "yellow" | "red" | "neutral";
}) {
  return (
    <span className={`ds-badge ds-badge--${tone}`}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </span>
  );
}
