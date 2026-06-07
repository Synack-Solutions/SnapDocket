"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SELECT_CLASS =
  "h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled"]),
  scheduled_at: z.string().optional(),
  site_address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditJobPage() {
  const router = useRouter();

  const {
    refineCore: { onFinish, formLoading, queryResult },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    refineCoreProps: {
      resource: "jobs",
      action: "edit",
      redirect: "show",
      meta: { select: "*, customers(name)" },
    },
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", status: "pending" },
  });

  const customerName =
    ((queryResult?.data?.data as Record<string, unknown>)?.customers as { name?: string } | null)
      ?.name ?? "";

  const onSubmit = handleSubmit(async (values) => {
    await onFinish({
      ...values,
      scheduled_at: values.scheduled_at || null,
    });
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Job</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {customerName && (
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Customer
                </label>
                <p className="text-sm font-medium">{customerName}</p>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Priority</label>
                <select {...register("priority")} className={SELECT_CLASS}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select {...register("status")} className={SELECT_CLASS}>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <Input label="Scheduled Date" type="datetime-local" {...register("scheduled_at")} />
            <Input label="Site Address" {...register("site_address")} />
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={formLoading}>
                Save Changes
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
