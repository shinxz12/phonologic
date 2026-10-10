import { Button, type ButtonProps } from "./Button";
import { Icon } from "./Icon";
import "./IconButton.css";

export function IconButton({
  label,
  icon,
  iconSize,
  ...props
}: Omit<ButtonProps, "children" | "icon"> & { label: string; icon: string; iconSize?: number }) {
  const computedIconSize = iconSize ?? (props.size === 'sm' ? 20 : props.size === 'lg' ? 28 : 24);
  return (
    <Button
      {...props}
      className={`ds-icon-button ${props.className ?? ""}`}
      aria-label={label}
      title={props.title ?? label}
    >
      <Icon name={icon} size={computedIconSize} />
    </Button>
  );
}
