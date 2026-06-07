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
