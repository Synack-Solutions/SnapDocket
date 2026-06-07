"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface InvoicePrintViewProps {
  invoiceNumber: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  issuedDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string | null;
  terms?: string | null;
}

export function InvoicePrintView(props: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: props.invoiceNumber,
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handlePrint()}>
        Print / Save PDF
      </Button>

      {/* Hidden on screen — react-to-print clones this into an iframe for printing */}
      <div ref={printRef} className="hidden">
        <div className="p-8 font-sans text-sm text-black">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">INVOICE</h1>
              <p className="mt-1 text-gray-500">{props.invoiceNumber}</p>
            </div>
            <div className="text-right text-gray-600">
              <p>
                <strong>Issued:</strong> {formatDate(props.issuedDate)}
              </p>
              <p>
                <strong>Due:</strong> {formatDate(props.dueDate)}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">Bill To</p>
            <p className="font-semibold">{props.customer.name}</p>
            {props.customer.email && <p className="text-gray-600">{props.customer.email}</p>}
            {props.customer.phone && <p className="text-gray-600">{props.customer.phone}</p>}
          </div>

          <table className="mb-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="pb-2 text-left font-medium">Description</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Unit Price</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...props.items]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.total))}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right text-gray-500">
                  Subtotal
                </td>
                <td className="pt-3 text-right">{formatCurrency(props.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right text-gray-500">
                  Tax ({props.taxRate}%)
                </td>
                <td className="text-right">{formatCurrency(props.taxAmount)}</td>
              </tr>
              {props.amountPaid > 0 && (
                <tr>
                  <td colSpan={3} className="text-right text-gray-500">
                    Amount Paid
                  </td>
                  <td className="text-right text-green-600">-{formatCurrency(props.amountPaid)}</td>
                </tr>
              )}
              <tr className="text-base font-bold">
                <td colSpan={3} className="pt-2 text-right">
                  Amount Due
                </td>
                <td className="pt-2 text-right">{formatCurrency(props.amountDue)}</td>
              </tr>
            </tfoot>
          </table>

          {props.notes && (
            <div className="mb-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">Notes</p>
              <p className="text-gray-600">{props.notes}</p>
            </div>
          )}
          {props.terms && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">Terms</p>
              <p className="text-gray-600">{props.terms}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
