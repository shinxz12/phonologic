import { Icon } from "../ui/Icon";
import "./LessonNode.css";

export function LessonNode({
  status,
  label,
  onClick,
}: {
  status: "completed" | "current" | "locked" | "reward";
  label: string;
  onClick?: () => void;
}) {
  return (
    <div className={`ds-lesson-node ds-lesson-node--${status}`}>
      <button
        type="button"
        disabled={status === "locked"}
        aria-label={label}
        aria-current={status === "current" ? "step" : undefined}
        onClick={onClick}
      >
        <Icon
          name={
            status === "completed"
              ? "check"
              : status === "locked"
                ? "lock"
                : status === "reward"
                  ? "redeem"
                  : "play_arrow"
          }
          size={32}
        />
      </button>
      <span>{label}</span>
    </div>
  );
}
