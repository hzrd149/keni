import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';

export const SUPPORTED_LOCALES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
];

const STORAGE_KEY = 'keni-language';
const supportedCodes = new Set(SUPPORTED_LOCALES.map((l) => l.value));

function browserLocale(): string {
  for (const lang of navigator.languages ?? [navigator.language]) {
    if (supportedCodes.has(lang)) return lang;
  }
  return 'en';
}

/** Language for signed-out pages: the choice saved on this device, else the browser's. */
export function guestLocale(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && supportedCodes.has(v)) return v;
  } catch {
    // storage unavailable — fall back to the browser language
  }
  return browserLocale();
}

/** Save a device-local language choice. Does not touch the account's language setting. */
export function setGuestLocale(lng: string) {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // storage unavailable — choice still applies for this session
  }
  void i18n.changeLanguage(lng);
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-TW': { translation: zhTW },
  },
  lng: guestLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
