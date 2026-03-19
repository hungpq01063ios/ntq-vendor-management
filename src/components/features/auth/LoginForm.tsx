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
  const { t } = useTranslations();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.auth.email}
        </label>
        <input
          name="email"
          type="email"
          required
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
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t.auth.signingIn : t.auth.signIn}
      </Button>
    </form>
  );
}
