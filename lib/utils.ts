import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
}

export function formatDate(dateString: string, pattern = "dd/MM/yyyy"): string {
  return format(parseISO(dateString), pattern);
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
}

/**
 * Returns a human-friendly relative label for dates near today.
 * - Same day  → "Today"
 * - +1 day    → "Tomorrow"
 * - -1 day    → "Yesterday"
 * - ±6 days   → short day name, e.g. "Wed"
 * - Otherwise → formatDate()
 */
export function formatRelativeDate(dateString: string): string {
  const d = parseISO(dateString);
  const now = new Date();
  // Compare calendar dates only
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) return format(d, "EEE d MMM");
  if (diffDays < -1 && diffDays >= -6) return format(d, "EEE d MMM");
  return formatDate(dateString);
}

export function generateInvoiceNumber(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(5, "0")}`;
}

export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unit_price: number; tax_rate: number }>,
  discountAmount = 0
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price * (item.tax_rate / 100),
    0
  );
  const total = subtotal + taxAmount - discountAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount_amount: discountAmount,
    total: Math.round(total * 100) / 100,
  };
}
