import { eventBus, type AppEventMap } from "./index";

type EventName = keyof AppEventMap;

interface WebhookConfig {
  url: string;
  secret?: string; // TODO: HMAC-sign payload with this secret before sending
  events: EventName[];
}

// Registers listeners on the event bus and forwards matching events to webhook URLs
export function registerWebhookForwarder(config: WebhookConfig): () => void {
  const handlers: Array<() => void> = [];

  for (const event of config.events) {
    const handler = (payload: AppEventMap[typeof event]) => {
      forwardEvent(config.url, event, payload, config.secret).catch((err) => {
        console.error(`[webhook] Failed to forward ${event}:`, err);
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventBus.on(event, handler as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handlers.push(() => eventBus.off(event, handler as any));
  }

  // Returns a cleanup / unsubscribe function
  return () => handlers.forEach((off) => off());
}

async function forwardEvent(
  url: string,
  event: string,
  payload: unknown,
  _secret?: string
): Promise<void> {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-SnapDocket-Event": event,
  };

  // TODO: implement HMAC-SHA256 signing here using _secret before shipping to production
  // headers["X-SnapDocket-Signature"] = sign(body, _secret);

  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) {
    throw new Error(`Webhook responded ${res.status}: ${await res.text()}`);
  }
}
