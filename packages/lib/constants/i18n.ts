import { z } from 'zod';

// 1. Define supported languages
export const SUPPORTED_LANGUAGE_CODES = ['he', 'en'] as const;
export type SupportedLanguageCodes = (typeof SUPPORTED_LANGUAGE_CODES)[number];

// 2. Zod schema with fallback to Hebrew
export const ZSupportedLanguageCodeSchema = z.enum(SUPPORTED_LANGUAGE_CODES).catch('he');

// 3. i18n locale data type
export type I18nLocaleData = {
  lang: SupportedLanguageCodes;
  locales: string[];
};

// 4. App i18n options
export const APP_I18N_OPTIONS = {
  supportedLangs: SUPPORTED_LANGUAGE_CODES,
  sourceLang: 'he',
  defaultLocale: 'he-IL',
} as const;

// 5. Supported languages map
export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCodes, { full: string; short: string }> = {
  he: { full: 'עברית', short: 'he' },
  en: { full: 'English', short: 'en' },
};

// 6. Validator helper
export const isValidLanguageCode = (code: unknown): code is SupportedLanguageCodes =>
  SUPPORTED_LANGUAGE_CODES.includes(code as SupportedLanguageCodes);

// 7. Example fallback test
export const fallbackToDefaultLang = (code: unknown): SupportedLanguageCodes => {
  const parsed = ZSupportedLanguageCodeSchema.safeParse(code);
  return parsed.success ? parsed.data : 'he';
};
