"use client";

import { useTranslations } from "@/i18n";
import { LOCALES, LOCALE_LABELS } from "@/i18n";
import type { Locale } from "@/i18n/types";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations();

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {(Object.keys(LOCALES) as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            locale === loc
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title={LOCALE_LABELS[loc]}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
