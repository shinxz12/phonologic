import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en.json';
import viTranslation from '../locales/vi.json';
const storedLanguage = localStorage.getItem('phonologic.language');
void i18n.use(initReactI18next).init({
  resources: { en: { translation: enTranslation }, vi: { translation: viTranslation } },
  lng: storedLanguage === 'en' ? 'en' : 'vi',
  fallbackLng: 'vi',
  supportedLngs: ['en', 'vi'],
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});
function applyLanguage(language: string) {
  document.documentElement.lang = language;
  localStorage.setItem('phonologic.language', language);
}
applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);
export default i18n;
