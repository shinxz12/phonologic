import { type ReactNode } from "react";
import { Icon } from "./Icon";
import "./StatPill.css";

export function StatPill({
  icon,
  children,
  tone = "green",
}: {
  icon: string;
  children: ReactNode;
  tone?: "blue" | "green" | "yellow" | "red";
}) {
  return (
    <span className={`ds-stat ds-stat--${tone}`}>
      <Icon name={icon} size={22} />
      <strong>{children}</strong>
    </span>
  );
}
