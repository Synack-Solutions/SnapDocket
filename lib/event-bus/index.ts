import EventEmitter from "eventemitter3";

export type AppEventMap = {
  // Invoice events
  "invoice.created": { tenantId: string; invoiceId: string };
  "invoice.sent": { tenantId: string; invoiceId: string; customerEmail: string };
  "invoice.paid": { tenantId: string; invoiceId: string; amount: number };
  "invoice.overdue": { tenantId: string; invoiceId: string; daysOverdue: number };
  // Job events
  "job.created": { tenantId: string; jobId: string };
  "job.completed": {
    tenantId: string;
    jobId: string;
    jobTitle: string;
    customerEmail: string | null;
    customerName: string;
    photoUrls: string[]; // long-lived signed URLs (7 days) for email embedding
  };
  // Payment events
  "payment.received": { tenantId: string; paymentId: string; invoiceId: string; amount: number };
  "payment.failed": { tenantId: string; paymentId: string; reason: string };
  // Customer events
  "customer.created": { tenantId: string; customerId: string };
  // System events
  "system.error": { message: string; context?: unknown };
};

class AppEventBus extends EventEmitter<AppEventMap> {}

// Singleton event bus — import and use anywhere in the app
export const eventBus = new AppEventBus();
