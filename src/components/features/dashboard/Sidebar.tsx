"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

interface SidebarProps {
  session: Session;
  pendingAlertCount?: number;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/vendors", label: "Vendors", icon: "🏢" },
  { href: "/personnel", label: "Personnel", icon: "👥" },
  { href: "/projects", label: "Projects", icon: "📋" },
  { href: "/pipeline", label: "Pipeline", icon: "⚡" },
  { href: "/rates", label: "Rate Norms", icon: "💲", duLeaderOnly: false },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
];

const duLeaderOnlyItems = [
  { href: "/rates/config", label: "Rate Config", icon: "⚙️" },
];

export default function Sidebar({ session, pendingAlertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const isDuLeader = (session.user as { role?: string })?.role === "DU_LEADER";

  return (
    <aside className="w-56 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold text-gray-900 text-sm">NTQ Vendor Mgmt</h2>
        <p className="text-xs text-gray-500 mt-0.5">{session.user?.name}</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.href === "/alerts" && pendingAlertCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingAlertCount > 99 ? "99+" : pendingAlertCount}
              </span>
            )}
          </Link>
        ))}

        {isDuLeader && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs text-gray-400 px-3">Admin</p>
            </div>
            {duLeaderOnlyItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-2 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
