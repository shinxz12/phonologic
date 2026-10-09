import "./ProgressBar.css";

export function ProgressBar({
  value,
  max = 100,
  label,
  caption,
}: {
  value: number;
  max?: number;
  label: string;
  caption?: string;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const current =
    max <= 0 || !Number.isFinite(value)
      ? 0
      : Math.min(limit, Math.max(0, value));
  return (
    <div className="ds-progress-wrap">
      {caption && (
        <div className="ds-progress-caption">
          <span>{label}</span>
          <strong>{caption}</strong>
        </div>
      )}
      <div
        className="ds-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={current}
      >
        <span style={{ width: `${(current / limit) * 100}%` }} />
      </div>
    </div>
  );
}
