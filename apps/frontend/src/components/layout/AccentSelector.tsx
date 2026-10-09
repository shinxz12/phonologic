import { useTranslation } from 'react-i18next';
import type { Accent } from '@phonologic/shared-types';
import { Button } from '../ui/Button';

export interface AccentSelectorProps {
  currentAccent: Accent;
  onChange: (accent: Accent) => void;
  disabled?: boolean;
}

export function AccentSelector({
  currentAccent,
  onChange,
  disabled = false,
}: AccentSelectorProps) {
  const { t } = useTranslation();

  const handleToggle = () => {
    onChange(currentAccent === 'US' ? 'UK' : 'US');
  };

  return (
    <>
      {/* Mobile & narrow tablet compact single-button toggle (< md) */}
      <div className="md:hidden">
        <Button
          size="sm"
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={handleToggle}
          aria-label={t('Chuyển giọng: hiện tại {{accent}}', { accent: currentAccent })}
          className="min-h-8! h-8! px-2! text-xs! font-black! rounded-lg! bg-secondary text-on-secondary shadow-xs"
        >
          {currentAccent}
        </Button>
      </div>

      {/* Desktop segmented toggle (md+) */}
      <div
        role="group"
        aria-label={t('Giọng tham chiếu')}
        className="hidden md:flex items-center gap-0.5 rounded-xl bg-surface-low p-0.5 border border-outline-variant/30"
      >
        {(['US', 'UK'] as const).map((acc) => {
          const isSelected = currentAccent === acc;
          return (
            <Button
              key={acc}
              size="sm"
              type="button"
              variant={isSelected ? 'secondary' : 'ghost'}
              aria-pressed={isSelected}
              aria-label={acc === 'US' ? t('Anh - Mỹ (US)') : t('Anh - Anh (UK)')}
              disabled={disabled}
              onClick={() => {
                if (acc !== currentAccent) {
                  onChange(acc);
                }
              }}
              className={`min-h-8! h-8! px-2! text-xs! font-bold! rounded-lg! ${
                isSelected
                  ? 'bg-secondary text-on-secondary shadow-xs font-black'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {acc}
            </Button>
          );
        })}
      </div>
    </>
  );
}
