"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreate } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/lib/hooks/use-tenant";
import { ServicePicker, type ServiceOption } from "@/components/jobs/service-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types";

interface QuickJobFormProps {
  services: ServiceOption[];
  customers: Array<Pick<Customer, "id" | "name" | "phone">>;
}

interface LastJobData {
  selectedServiceIds: string[];
  title: string;
}

export function QuickJobForm({ services, customers }: QuickJobFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const { mutateAsync: createJob } = useCreate();
  const { mutateAsync: createItem } = useCreate();

  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [siteAddress, setSiteAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastJobHint, setLastJobHint] = useState<string | null>(null);

  // When customer changes, fetch their last job's invoice items for auto-fill
  const loadLastJobServices = useCallback(
    async (cid: string) => {
      const supabase = createClient();

      // Find last completed/in_progress job with invoice items
      const { data: lastInvoice } = await supabase
        .from("invoices")
        .select("invoice_items(description, quantity, unit_price)")
        .eq("customer_id", cid)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!lastInvoice?.invoice_items?.length) {
        setSelectedServices([]);
        setLastJobHint(null);
        return;
      }

      // Match returned descriptions against known service labels
      const lastDescriptions = (lastInvoice.invoice_items as Array<{ description: string }>).map(
        (i) => i.description.toLowerCase()
      );

      const matched = services
        .filter((s) => lastDescriptions.some((d) => d.includes(s.label.toLowerCase())))
        .map((s) => s.id);

      setSelectedServices(matched.length > 0 ? matched : []);
      setLastJobHint(
        matched.length > 0
          ? `Auto-filled ${matched.length} service${matched.length > 1 ? "s" : ""} from last visit`
          : null
      );
    },
    [services]
  );

  useEffect(() => {
    if (customerId) loadLastJobServices(customerId);
    else {
      setSelectedServices([]);
      setLastJobHint(null);
    }
  }, [customerId, loadLastJobServices]);

  const selectedTotal = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.unitPrice, 0);

  const customerName = customers.find((c) => c.id === customerId)?.name ?? "";

  const handleSubmit = async () => {
    if (!tenantId || !customerId || selectedServices.length === 0) return;
    setIsSubmitting(true);

    try {
      const selectedSvcObjects = services.filter((s) => selectedServices.includes(s.id));
      const title = selectedSvcObjects.map((s) => s.label).join(" + ");

      const jobResult = await createJob({
        resource: "jobs",
        values: {
          tenant_id: tenantId,
          customer_id: customerId,
          title,
          status: "in_progress",
          priority: "medium",
          site_address: siteAddress || null,
          notes: notes || null,
          started_at: new Date().toISOString(),
        },
        successNotification: false,
      });

      const jobId = (jobResult as { data: { id: string } }).data.id;

      // Create a draft invoice with service line items
      const { subtotal, taxAmount, total } = selectedSvcObjects.reduce(
        (acc, s) => {
          const tax = s.unitPrice * 0.1; // 10% default; could read from tenant settings
          return {
            subtotal: acc.subtotal + s.unitPrice,
            taxAmount: acc.taxAmount + tax,
            total: acc.total + s.unitPrice + tax,
          };
        },
        { subtotal: 0, taxAmount: 0, total: 0 }
      );

      const invoiceResult = await createItem({
        resource: "invoices",
        values: {
          tenant_id: tenantId,
          customer_id: customerId,
          job_id: jobId,
          invoice_number: `DRAFT-${Date.now()}`,
          status: "draft",
          issued_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          subtotal: Math.round(subtotal * 100) / 100,
          tax_rate: 10,
          tax_amount: Math.round(taxAmount * 100) / 100,
          discount_amount: 0,
          total: Math.round(total * 100) / 100,
          amount_paid: 0,
        },
        successNotification: false,
      });

      const invoiceId = (invoiceResult as { data: { id: string } }).data.id;

      // Insert line items
      await Promise.all(
        selectedSvcObjects.map((s, i) =>
          createItem({
            resource: "invoice_items",
            values: {
              invoice_id: invoiceId,
              description: s.label,
              quantity: 1,
              unit_price: s.unitPrice,
              tax_rate: 10,
              sort_order: i,
            },
            successNotification: false,
          })
        )
      );

      router.push(`/jobs/${jobId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Customer selector */}
      <div>
        <label htmlFor="quick-job-customer" className="mb-1 block text-sm font-semibold">
          Customer *
        </label>
        <select
          id="quick-job-customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="h-12 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {lastJobHint && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-primary">
            <span aria-hidden="true">✓</span> {lastJobHint}
          </p>
        )}
      </div>

      {/* Service picker */}
      {customerId && (
        <div>
          <ServicePicker
            services={services}
            selected={selectedServices}
            onChange={setSelectedServices}
          />
        </div>
      )}

      {/* Selected total summary */}
      {selectedServices.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center justify-between font-semibold">
            <span>Estimated Total</span>
            <span className="text-base">{formatCurrency(selectedTotal * 1.1)}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Includes 10% tax</p>
        </div>
      )}

      {/* Optional fields */}
      {customerId && (
        <div className="space-y-3">
          <Input
            label="Site / Vehicle"
            placeholder="Rego, bay number, or address…"
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              rows={2}
              placeholder="Any special instructions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!customerId || selectedServices.length === 0 || isSubmitting || !tenantId}
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Starting…" : `Start Job${customerName ? ` — ${customerName}` : ""}`}
      </Button>
    </div>
  );
}
