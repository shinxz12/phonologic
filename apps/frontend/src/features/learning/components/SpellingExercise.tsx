import { useTranslation } from 'react-i18next';
import type { Choice, AnswerFeedback } from '@phonologic/shared-types';
import { SegmentTile, Button, Icon } from '../../../components';

export interface SpellingExerciseProps {
  choices: Choice[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  feedback?: AnswerFeedback | null;
  targetWord?: string;
}

export function SpellingExercise({
  choices,
  selectedIds,
  onChange,
  disabled = false,
  feedback,
  targetWord,
}: SpellingExerciseProps) {
  const { t } = useTranslation();

  const choiceMap = new Map<string, Choice>();
  choices.forEach((c) => choiceMap.set(c.id, c));

  const handleSelectToken = (choiceId: string) => {
    if (disabled) return;
    if (selectedIds.includes(choiceId)) return;
    onChange([...selectedIds, choiceId]);
  };

  const handleRemoveToken = (indexToRemove: number) => {
    if (disabled) return;
    const next = [...selectedIds];
    next.splice(indexToRemove, 1);
    onChange(next);
  };

  const handleUndo = () => {
    if (disabled || selectedIds.length === 0) return;
    onChange(selectedIds.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || selectedIds.length === 0) return;
    onChange([]);
  };

  const isChecked = Boolean(feedback);
  const isCorrect = feedback?.correct ?? false;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Target Word display if available */}
      {targetWord && (
        <div className="flex items-center justify-center p-3 bg-surface-low rounded-xl text-center">
          <span className="text-sm text-on-surface-variant mr-2">{t('Từ mục tiêu:')}</span>
          <span className="font-display font-extrabold text-lg text-primary tracking-wider uppercase">
            {targetWord}
          </span>
        </div>
      )}

      {/* Word Assembly Slots Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <span>{t('Khu vực ghép từ ({{count}} mảnh đã chọn):', { count: selectedIds.length })}</span>
          {!disabled && selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleUndo}>
                <Icon name="undo" size={16} />
                {t('Hoàn tác')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Icon name="delete_sweep" size={16} />
                {t('Xóa hết')}
              </Button>
            </div>
          )}
        </div>

        <div
          className={`min-h-[72px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-center justify-center gap-2 transition-colors ${
            isChecked
              ? isCorrect
                ? 'border-primary bg-primary/5'
                : 'border-error bg-error/5'
              : selectedIds.length > 0
              ? 'border-secondary/40 bg-surface-low'
              : 'border-outline-variant/40 bg-surface-low/50'
          }`}
          role="region"
          aria-label={t('Khu vực các chữ cái đã ghép')}
        >
          {selectedIds.length === 0 ? (
            <span className="text-sm text-on-surface-variant/70 italic select-none">
              {t('Chạm vào các mảnh ghép bên dưới theo đúng thứ tự để tạo thành từ')}
            </span>
          ) : (
            selectedIds.map((id, index) => {
              const choice = choiceMap.get(id);
              if (!choice) return null;
              return (
                <div key={`${id}-${index}`} className="relative group">
                  <SegmentTile
                    spelling={choice.label}
                    notation={choice.description}
                    selected={true}
                    state={isChecked ? (isCorrect ? 'correct' : 'incorrect') : 'idle'}
                    disabled={disabled}
                    onClick={() => handleRemoveToken(index)}
                    aria-label={t('Xóa mảnh ghép {{label}}', { label: choice.label })}
                  />
                  {!disabled && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[10px]">
                      ×
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available Token Bank */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-on-surface-variant font-medium">{t('Kho mảnh ghép (chọn lần lượt):')}</span>
        <div
          className="p-4 rounded-2xl bg-surface-low flex flex-wrap items-center justify-center gap-3 border border-outline-variant/20"
          role="group"
          aria-label={t('Kho các mảnh ghép sẵn có')}
        >
          {choices.map((choice) => {
            const isUsed = selectedIds.includes(choice.id);
            return (
              <SegmentTile
                key={choice.id}
                spelling={choice.label}
                notation={choice.description}
                selected={isUsed}
                disabled={disabled || isUsed}
                onClick={() => handleSelectToken(choice.id)}
                aria-label={t('Chọn mảnh ghép {{label}}', { label: choice.label })}
                className={isUsed ? 'opacity-40 pointer-events-none' : ''}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
