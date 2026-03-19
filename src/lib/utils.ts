import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Converts unknown catch errors into user-friendly strings.
 * Use inside try/catch blocks in Server Actions.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((e) => e.message).join(", ");
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
