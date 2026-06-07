import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  generateInvoiceNumber,
  calculateInvoiceTotals,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats AUD by default", () => {
    expect(formatCurrency(1100)).toBe("$1,100.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("generateInvoiceNumber", () => {
  it("pads sequence to 5 digits", () => {
    expect(generateInvoiceNumber("INV-", 1)).toBe("INV-00001");
    expect(generateInvoiceNumber("INV-", 12345)).toBe("INV-12345");
  });
});

describe("calculateInvoiceTotals", () => {
  it("calculates subtotal, tax, and total correctly", () => {
    const result = calculateInvoiceTotals([
      { quantity: 2, unit_price: 100, tax_rate: 10 },
      { quantity: 1, unit_price: 50, tax_rate: 10 },
    ]);
    expect(result.subtotal).toBe(250);
    expect(result.tax_amount).toBe(25);
    expect(result.total).toBe(275);
  });

  it("applies discount", () => {
    const result = calculateInvoiceTotals([{ quantity: 1, unit_price: 100, tax_rate: 0 }], 10);
    expect(result.total).toBe(90);
    expect(result.discount_amount).toBe(10);
  });

  it("handles empty items", () => {
    const result = calculateInvoiceTotals([]);
    expect(result.total).toBe(0);
  });
});
