import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  return <div role="group" aria-label={t('Ngôn ngữ giao diện')} className="flex items-center gap-1">
    {(['vi', 'en'] as const).map(language => <Button key={language} size="sm" variant={i18n.language === language ? 'secondary' : 'ghost'} aria-pressed={i18n.language === language} aria-label={language === 'vi' ? 'Tiếng Việt' : 'English'} onClick={() => void i18n.changeLanguage(language)}>{language.toUpperCase()}</Button>)}
  </div>;
}
