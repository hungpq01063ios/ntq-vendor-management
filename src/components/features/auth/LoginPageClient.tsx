"use client";

import { useTranslations } from "@/i18n";
import LoginForm from "./LoginForm";

export default function LoginPageClient() {
  const { t } = useTranslations();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.auth.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.auth.subtitle}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
