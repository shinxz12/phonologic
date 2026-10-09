import { Button } from "../ui/Button";
import { useTranslation } from 'react-i18next';
import "./AudioControl.css";

export function AudioControl({
  onPlay,
  speed = "0.75x",
  onSpeedChange,
  label,
  disabled = false,
}: {
  onPlay: () => void;
  speed?: string;
  onSpeedChange?: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="ds-audio">
      <Button
        variant="secondary"
        icon="volume_up"
        size="sm"
        onClick={onPlay}
        disabled={disabled}
      >
        {label ?? t("Nghe âm mẫu")}
      </Button>
      {onSpeedChange && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSpeedChange}
          aria-label={t("Tốc độ {{speed}}", { speed })}
        >
          {speed}
        </Button>
      )}
    </div>
  );
}
