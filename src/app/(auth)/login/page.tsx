import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/features/auth/LoginPageClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return <LoginPageClient />;
}
