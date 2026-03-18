import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/features/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">NTQ Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
