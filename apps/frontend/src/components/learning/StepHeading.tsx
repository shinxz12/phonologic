import { type ReactNode } from "react";
import "./StepHeading.css";

export function StepHeading({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <h3 className="ds-step">
      <span>{number}</span>
      {children}
    </h3>
  );
}
