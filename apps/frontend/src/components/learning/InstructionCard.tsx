import { type ReactNode } from "react";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import "./InstructionCard.css";

export function InstructionCard({
  title,
  children,
  icon = "psychology",
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <Card tone="soft" className="ds-instruction">
      <span className="ds-instruction-icon">
        <Icon name={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </Card>
  );
}
