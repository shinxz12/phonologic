import { Button, type ButtonProps } from "./Button";
import { Icon } from "./Icon";
import "./IconButton.css";

export function IconButton({
  label,
  icon,
  ...props
}: Omit<ButtonProps, "children" | "icon"> & { label: string; icon: string }) {
  return (
    <Button
      {...props}
      className={`ds-icon-button ${props.className ?? ""}`}
      aria-label={label}
    >
      <Icon name={icon} />
    </Button>
  );
}
