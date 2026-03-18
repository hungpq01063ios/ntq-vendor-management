import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/features/dashboard/Sidebar";
import { getPendingAlertCount } from "@/actions/alert.actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, pendingAlertCount] = await Promise.all([
    auth(),
    getPendingAlertCount(),
  ]);

  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar session={session} pendingAlertCount={pendingAlertCount} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
