import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook receiver — validates HMAC signature and forwards to event bus
// TODO: Register this URL as your payment provider webhook endpoint

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[webhook] WEBHOOK_SECRET env var not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-snapdocket-signature") ?? "";

  if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // TODO: Dispatch payload to the event bus based on payload.event
  console.log("[webhook] received:", payload);

  return NextResponse.json({ ok: true });
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(`sha256=${expected}`, "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}
