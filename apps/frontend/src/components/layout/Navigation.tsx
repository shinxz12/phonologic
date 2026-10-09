import { Icon } from "../ui/Icon";
import "./Navigation.css";

export type NavItem = { id: string; label: string; icon: string };
export function Navigation({
  items,
  activeId,
  onChange,
  placement = "sidebar",
}: {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  placement?: "sidebar" | "bottom";
}) {
  return (
    <nav
      className={`ds-navigation ds-navigation--${placement}`}
      aria-label={
        placement === "sidebar" ? "Điều hướng chính" : "Điều hướng di động"
      }
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={activeId === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
