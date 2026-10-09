import { Button } from "../ui/Button";
import "./AudioControl.css";

export function AudioControl({
  onPlay,
  speed = "0.75x",
  onSpeedChange,
  label = "Nghe âm mẫu",
  disabled = false,
}: {
  onPlay: () => void;
  speed?: string;
  onSpeedChange?: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="ds-audio">
      <Button
        variant="secondary"
        icon="volume_up"
        size="sm"
        onClick={onPlay}
        disabled={disabled}
      >
        {label}
      </Button>
      {onSpeedChange && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSpeedChange}
          aria-label={`Tốc độ ${speed}`}
        >
          {speed}
        </Button>
      )}
    </div>
  );
}
