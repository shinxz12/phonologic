import "./Icon.css";

export function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      translate="no"
      className={`material-symbols-outlined notranslate ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
