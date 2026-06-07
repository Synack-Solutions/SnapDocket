"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { recordPayment } from "@/app/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const SELECT_CLASS =
  "h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["cash", "card", "bank_transfer", "online", "cheque", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RecordPaymentFormProps {
  invoiceId: string;
  tenantId: string;
  amountDue: number;
}

export function RecordPaymentForm({ invoiceId, tenantId, amountDue }: RecordPaymentFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: amountDue, method: "bank_transfer" },
  });

  const onSubmit = handleSubmit((values) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await recordPayment(invoiceId, tenantId, values);
        setSuccessAmount(values.amount);
        reset({ amount: amountDue - values.amount, method: "bank_transfer" });
        setOpen(false);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to record payment");
      }
    });
  });

  if (successAmount !== null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
        <span>✓</span>
        <span>
          Payment of <strong>{formatCurrency(successAmount)}</strong> recorded successfully.
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Record Payment
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Record Payment</CardTitle>
          <span className="text-sm text-muted-foreground">
            Balance due: <strong className="text-foreground">{formatCurrency(amountDue)}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            max={amountDue}
            required
            hint={amountDue > 0 ? `Max: ${formatCurrency(amountDue)}` : undefined}
            {...register("amount")}
            error={errors.amount?.message as string | undefined}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Payment Method</label>
            <select {...register("method")} className={SELECT_CLASS}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Reference"
            placeholder="Transaction ID, cheque number…"
            {...register("reference")}
          />
          <Input label="Notes" {...register("notes")} />
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={isPending}>
              Save Payment
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
