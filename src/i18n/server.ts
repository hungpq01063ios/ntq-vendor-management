/**
 * i18n Server Helpers — NO "use client" directive.
 * Import this in Server Components and Server Actions.
 *
 * Usage:
 *   import { getTranslations } from "@/i18n/server";
 *   import { cookies } from "next/headers";
 *
 *   const cookieStore = await cookies();
 *   const t = getTranslations(cookieStore.get("locale")?.value);
 */
import type { Locale, Translations } from "./types";
import vi from "./locales/vi";
import en from "./locales/en";

export const LOCALES_SERVER: Record<Locale, Translations> = { vi, en };
export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "locale";

export function isValidLocale(v?: string | null): v is Locale {
  return !!v && v in LOCALES_SERVER;
}

/**
 * Returns translations for the given locale string.
 * Falls back to DEFAULT_LOCALE if locale is invalid or missing.
 */
export function getTranslations(locale?: string | null): Translations {
  const resolved = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  return LOCALES_SERVER[resolved];
}
