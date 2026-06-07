"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendInvoice, voidInvoice } from "@/app/actions/invoice-actions";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const run = (action: () => Promise<void>) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  if (status === "draft") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending} onClick={() => run(() => sendInvoice(invoiceId))}>
            {isPending ? "Sending…" : "Send Invoice"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              if (!confirm("Void this invoice?")) return;
              run(() => voidInvoice(invoiceId));
            }}
          >
            Void
          </Button>
        </div>
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      </div>
    );
  }

  if (status === "sent" || status === "viewed" || status === "overdue") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Void this invoice?")) return;
            run(() => voidInvoice(invoiceId));
          }}
        >
          {isPending ? "Voiding…" : "Void"}
        </Button>
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
      </div>
    );
  }

  return null;
}
