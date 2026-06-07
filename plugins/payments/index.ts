// Payment provider plugin interface — implement for Stripe, Square, PayPal, etc.

export interface PaymentIntent {
  id: string;
  amount: number; // in cents
  currency: string;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  clientSecret?: string;
  metadata?: Record<string, string>;
}

export interface PaymentPlugin {
  readonly name: string;
  // Create a payment intent for the given amount
  createIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent>;
  // Confirm a payment (e.g., after card capture on mobile)
  confirmPayment(intentId: string): Promise<PaymentIntent>;
  // Process a refund
  refund(intentId: string, amount?: number): Promise<{ success: boolean; refundId: string }>;
}

// TODO: Implement StripePaymentPlugin in plugins/payments/stripe.ts
// TODO: Implement SquarePaymentPlugin in plugins/payments/square.ts
