/**
 * i18n Client Engine — "use client" only.
 * Import this in Client Components.
 *
 * For Server Components, use: import { getTranslations } from "@/i18n/server"
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Locale, Translations } from "./types";
import vi from "./locales/vi";
import en from "./locales/en";

// ─── Locale registry (client) ────────────────────────────────────────────────
export const LOCALES: Record<Locale, Translations> = { vi, en };

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "locale";

// ─── React Context ────────────────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE
  );

  // On mount: check localStorage for saved preference
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_COOKIE);
    if (saved && saved in LOCALES && saved !== locale) {
      setLocaleState(saved as Locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // Persist to both localStorage (fast) and cookie (server-readable)
    localStorage.setItem(LOCALE_COOKIE, next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const value: I18nContextValue = {
    locale,
    t: LOCALES[locale],
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ─── Client hook ──────────────────────────────────────────────────────────────
/**
 * Use in Client Components to get translations and locale switcher.
 *
 * @example
 * const { t, locale, setLocale } = useTranslations();
 * <button onClick={() => setLocale('en')}>{t.common.cancel}</button>
 */
export function useTranslations(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslations must be used inside <I18nProvider>");
  }
  return ctx;
}
