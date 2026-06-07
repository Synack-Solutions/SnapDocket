"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@refinedev/react-hook-form";
import { useList } from "@refinedev/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenant } from "@/lib/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/types";

const schema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduled_at: z.string().optional(),
  site_address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateJobPage() {
  const router = useRouter();
  const { tenantId } = useTenant();

  const { data: customersData } = useList<Customer>({
    resource: "customers",
    filters: [{ field: "status", operator: "eq", value: "active" }],
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
  });
  const customers = customersData?.data ?? [];

  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    refineCoreProps: {
      resource: "jobs",
      action: "create",
      redirect: "list",
    },
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!tenantId) return;
    await onFinish({
      ...values,
      tenant_id: tenantId,
      status: "pending",
      scheduled_at: values.scheduled_at || null,
    });
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Job</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
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
            <Input
              label="Title"
              required
              {...register("title")}
              error={errors.title?.message as string | undefined}
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select
                {...register("priority")}
                className="h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <Input label="Scheduled Date" type="datetime-local" {...register("scheduled_at")} />
            <Input label="Site Address" {...register("site_address")} />
            <div className="flex gap-3">
              <Button type="submit" loading={formLoading} disabled={!tenantId}>
                Save Job
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
