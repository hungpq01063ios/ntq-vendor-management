/**
 * src/lib/auth-helpers.ts
 *
 * Auth guard helpers for Server Actions and Server Components.
 * Use these instead of inline auth checks to keep Actions clean and consistent.
 *
 * Usage:
 *   const session = await requireAuth()           // any logged-in user
 *   const session = await requireRole('DU_LEADER') // DU Leader only
 */

import { auth } from "@/lib/auth";

type AuthSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  };
};

/**
 * Asserts the user is authenticated.
 * Throws 'Unauthorized' if no session or missing user ID.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session as AuthSession;
}

/**
 * Asserts the user has the required role.
 * Throws 'Unauthorized' if not logged in, 'Forbidden' if wrong role.
 */
export async function requireRole(
  role: "DU_LEADER" | "VENDOR_PIC"
): Promise<AuthSession> {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== role) {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * Returns session + role info without throwing.
 * For Server Components that need conditional rendering based on role.
 *
 * Example:
 *   const { session, isDULeader } = await getSessionWithRole()
 *   return <Table isDULeader={isDULeader} />
 */
export async function getSessionWithRole() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return {
    session,
    isDULeader: role === "DU_LEADER",
    isVendorPIC: role === "VENDOR_PIC",
    isAuthenticated: !!session?.user?.id,
  };
}
