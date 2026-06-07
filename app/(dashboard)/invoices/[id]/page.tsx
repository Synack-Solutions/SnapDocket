import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoicePrintView } from "@/components/invoice/invoice-print-view";
import { InvoiceActions } from "@/components/invoice/invoice-actions";
import { RecordPaymentForm } from "@/components/invoice/record-payment-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("invoices").select("invoice_number").eq("id", id).single();
  return { title: data?.invoice_number ?? "Invoice" };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(*), invoice_items(*), payments(*)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const canEdit = invoice.status === "draft";
  const canRecordPayment = !["paid", "void"].includes(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            ← Invoices
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{invoice.invoice_number}</h1>
            <Badge variant={statusToBadgeVariant(invoice.status)}>{invoice.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <InvoicePrintView
            invoiceNumber={invoice.invoice_number}
            customer={{
              name: (invoice.customers as { name: string })?.name,
              email: (invoice.customers as { email?: string | null })?.email,
              phone: (invoice.customers as { phone?: string | null })?.phone,
            }}
            issuedDate={invoice.issued_date}
            dueDate={invoice.due_date}
            items={
              (invoice.invoice_items as Array<{
                id: string;
                description: string;
                quantity: number;
                unit_price: number;
                total: number;
                sort_order: number;
              }>) ?? []
            }
            subtotal={Number(invoice.subtotal)}
            taxRate={Number(invoice.tax_rate)}
            taxAmount={Number(invoice.tax_amount)}
            total={Number(invoice.total)}
            amountPaid={Number(invoice.amount_paid)}
            amountDue={Number(invoice.amount_due)}
            notes={invoice.notes as string | null}
            terms={invoice.terms as string | null}
          />
          {canEdit && (
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          )}
          <InvoiceActions invoiceId={id} status={invoice.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bill To</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-semibold">{(invoice.customers as { name: string })?.name}</p>
            <p>{(invoice.customers as { email?: string })?.email}</p>
            <p>{(invoice.customers as { phone?: string })?.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Issued:</span>{" "}
              {formatDate(invoice.issued_date)}
            </p>
            <p>
              <span className="text-muted-foreground">Due:</span> {formatDate(invoice.due_date)}
            </p>
            <p>
              <span className="text-muted-foreground">Amount Due:</span>{" "}
              <strong>{formatCurrency(Number(invoice.amount_due))}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(
                invoice.invoice_items as Array<{
                  id: string;
                  description: string;
                  quantity: number;
                  unit_price: number;
                  total: number;
                  sort_order: number;
                }>
              )
                ?.sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(item.total))}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right text-muted-foreground">
                  Subtotal
                </td>
                <td className="pt-3 text-right">{formatCurrency(Number(invoice.subtotal))}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right text-muted-foreground">
                  Tax ({invoice.tax_rate}%)
                </td>
                <td className="text-right">{formatCurrency(Number(invoice.tax_amount))}</td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="pt-2 text-right">
                  Total
                </td>
                <td className="pt-2 text-right">{formatCurrency(Number(invoice.total))}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {(
        invoice.payments as Array<{
          id: string;
          amount: number;
          method: string;
          paid_at: string | null;
        }>
      )?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            {(
              invoice.payments as Array<{
                id: string;
                amount: number;
                method: string;
                paid_at: string | null;
              }>
            ).map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>
                  {p.method} — {p.paid_at ? formatDate(p.paid_at) : "pending"}
                </span>
                <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canRecordPayment && Number(invoice.amount_due) > 0 && (
        <RecordPaymentForm
          invoiceId={id}
          tenantId={invoice.tenant_id}
          amountDue={Number(invoice.amount_due)}
        />
      )}
    </div>
  );
}
