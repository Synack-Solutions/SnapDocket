"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray } from "react-hook-form";
import { useCreate } from "@refinedev/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventBus } from "@/lib/event-bus";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100).default(10),
  sort_order: z.number().default(0),
});

const invoiceSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  job_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().min(1, "Required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CreateInvoiceFormProps {
  customers: Array<{ id: string; name: string }>;
  jobs: Array<{ id: string; title: string; customer_id: string }>;
  tenantId: string;
  invoicePrefix: string;
  nextSequence: number;
}

export function CreateInvoiceForm({
  customers,
  jobs,
  tenantId,
  invoicePrefix,
  nextSequence,
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCustomerId = searchParams.get("customerId") ?? "";

  const { mutateAsync: createItem } = useCreate();

  const {
    refineCore: { onFinish },
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    refineCoreProps: {
      resource: "invoices",
      action: "create",
      redirect: false,
    },
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: defaultCustomerId,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      items: [{ description: "", quantity: 1, unit_price: 0, tax_rate: 10, sort_order: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const selectedCustomerId = watch("customer_id");

  const totals = calculateInvoiceTotals(
    watchedItems.map((item: InvoiceFormValues["items"][number]) => ({
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      tax_rate: Number(item.tax_rate) || 0,
    }))
  );

  const filteredJobs = jobs.filter((j) => j.customer_id === selectedCustomerId);

  const onSubmit = handleSubmit(async (values) => {
    const { items, ...invoiceData } = values;
    const invoiceNumber = `${invoicePrefix}${String(nextSequence).padStart(5, "0")}`;

    const result = await onFinish({
      ...invoiceData,
      job_id: invoiceData.job_id || null,
      ...totals,
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      status: "draft",
      issued_date: new Date().toISOString().split("T")[0],
      amount_paid: 0,
    });

    const invoiceId = (result as { data: { id: string } } | undefined)?.data?.id;
    if (!invoiceId) return;

    await Promise.all(
      items.map((item: InvoiceFormValues["items"][number], i: number) =>
        createItem({
          resource: "invoice_items",
          values: { ...item, invoice_id: invoiceId, sort_order: i },
          successNotification: false,
        })
      )
    );

    eventBus.emit("invoice.created", { tenantId, invoiceId });
    router.push(`/invoices/${invoiceId}`);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer *</label>
            <select
              {...register("customer_id")}
              className="h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="mt-1 text-xs text-destructive">
                {errors.customer_id.message as string}
              </p>
            )}
          </div>

          {filteredJobs.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">Link to Job</label>
              <select
                {...register("job_id")}
                className="h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">None</option>
                {filteredJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Due Date"
            type="date"
            required
            {...register("due_date")}
            error={errors.due_date?.message as string | undefined}
          />

          <Input label="Notes" placeholder="Optional notes for customer" {...register("notes")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unit_price: 0,
                  tax_rate: 10,
                  sort_order: fields.length,
                })
              }
            >
              + Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded border border-border p-3 sm:border-0 sm:p-0">
              {/* Mobile: stacked layout */}
              <div className="grid gap-2 sm:hidden">
                <Input
                  placeholder="Description"
                  {...register(`items.${index}.description`)}
                  error={
                    (errors.items as Array<{ description?: { message?: string } }> | undefined)?.[
                      index
                    ]?.description?.message as string | undefined
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    step="0.01"
                    {...register(`items.${index}.quantity`)}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    {...register(`items.${index}.unit_price`)}
                  />
                  <Input
                    type="number"
                    placeholder="Tax %"
                    step="0.01"
                    {...register(`items.${index}.tax_rate`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  Remove item
                </Button>
              </div>
              {/* Desktop: single-row grid */}
              <div className="hidden sm:grid gap-2 sm:grid-cols-[1fr_80px_100px_80px_40px]">
                <Input
                  placeholder="Description"
                  {...register(`items.${index}.description`)}
                  error={
                    (errors.items as Array<{ description?: { message?: string } }> | undefined)?.[
                      index
                    ]?.description?.message as string | undefined
                  }
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  step="0.01"
                  {...register(`items.${index}.quantity`)}
                />
                <Input
                  type="number"
                  placeholder="Unit price"
                  step="0.01"
                  {...register(`items.${index}.unit_price`)}
                />
                <Input
                  type="number"
                  placeholder="Tax %"
                  step="0.01"
                  {...register(`items.${index}.tax_rate`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Remove item"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}

          <div className="border-t border-border pt-3 text-right space-y-1 text-sm">
            <p>
              Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong>
            </p>
            <p>
              Tax: <strong>{formatCurrency(totals.tax_amount)}</strong>
            </p>
            <p className="text-base font-bold">Total: {formatCurrency(totals.total)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          Save Invoice
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
