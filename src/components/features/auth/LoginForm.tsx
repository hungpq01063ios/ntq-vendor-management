"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { t } = useTranslations();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setLoginError(t.auth.invalidCredentials);
      toast.error(t.auth.invalidCredentials);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-sm rounded-lg p-8 space-y-4 border"
    >
      {loginError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
          <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 font-medium">{loginError}</p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.auth.email}
        </label>
        <input
          name="email"
          type="email"
          required
          onChange={() => setLoginError(null)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t.auth.emailPlaceholder}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.auth.password}
        </label>
        <input
          name="password"
          type="password"
          required
          onChange={() => setLoginError(null)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.auth.signingIn : t.auth.signIn}
      </Button>
    </form>
  );
}
