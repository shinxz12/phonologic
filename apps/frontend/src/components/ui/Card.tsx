import { type HTMLAttributes } from "react";
import "./Card.css";

export function Card({
  children,
  className = "",
  tone = "white",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: "white" | "soft" | "blue" | "green" | "yellow";
}) {
  return (
    <div {...props} className={`ds-card ds-card--${tone} ${className}`}>
      {children}
    </div>
  );
}
