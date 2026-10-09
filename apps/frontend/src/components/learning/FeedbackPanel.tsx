import { type ReactNode } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import "./FeedbackPanel.css";

export function FeedbackPanel({
  title,
  children,
  tone = "success",
  action,
  onAction,
}: {
  title: string;
  children?: ReactNode;
  tone?: "success" | "error" | "info";
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`ds-feedback ds-feedback--${tone}`} role="status">
      <Icon
        name={
          tone === "success"
            ? "check_circle"
            : tone === "error"
              ? "cancel"
              : "lightbulb"
        }
        size={32}
      />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
      {action && (
        <Button
          variant={tone === "error" ? "danger" : "primary"}
          onClick={onAction}
        >
          {action}
          <Icon name="arrow_forward" size={18} />
        </Button>
      )}
    </div>
  );
}
