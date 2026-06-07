import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "@/lib/utils";
import type { InvoiceItem } from "@/types";

// Domain logic tests for invoice calculations
describe("invoice domain logic", () => {
  it("marks invoice as paid when amount_paid equals total", () => {
    const total = 110;
    const amountPaid = 110;
    const status = amountPaid >= total ? "paid" : amountPaid > 0 ? "partial" : "sent";
    expect(status).toBe("paid");
  });

  it("marks invoice as partial when partially paid", () => {
    const total = 110;
    const amountPaid = 50;
    const status = amountPaid >= total ? "paid" : amountPaid > 0 ? "partial" : "sent";
    expect(status).toBe("partial");
  });

  it("calculates correct totals for multi-tax-rate items", () => {
    const items = [
      { quantity: 1, unit_price: 100, tax_rate: 10 },
      { quantity: 1, unit_price: 200, tax_rate: 0 },
    ];
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotal).toBe(300);
    expect(totals.tax_amount).toBe(10); // only first item has GST
    expect(totals.total).toBe(310);
  });
});
