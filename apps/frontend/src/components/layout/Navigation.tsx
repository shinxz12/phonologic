import { Icon } from "../ui/Icon";
import { useTranslation } from 'react-i18next';
import "./Navigation.css";

export type NavItem = { id: string; label: string; icon: string };

export function Navigation({
  items,
  activeId,
  onChange,
  placement = "sidebar",
  collapsed = false,
}: {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  placement?: "sidebar" | "bottom";
  collapsed?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <nav
      className={`ds-navigation ds-navigation--${placement} ${collapsed ? 'items-center gap-2' : ''}`}
      aria-label={
        t(placement === "sidebar" ? "Điều hướng chính" : "Điều hướng di động")
      }
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={activeId === item.id ? "page" : undefined}
          aria-label={item.label}
          title={collapsed ? item.label : undefined}
          onClick={() => onChange(item.id)}
          className={collapsed ? "justify-center! p-2.5! rounded-xl!" : undefined}
        >
          <Icon name={item.icon} />
          {!collapsed && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}
