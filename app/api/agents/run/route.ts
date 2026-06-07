import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/agents/runner";

// Vercel Cron or external cron triggers this route.
// Protect with a shared secret so only your scheduler can call it.

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { agent: string; tenantId: string; dryRun?: boolean };

  try {
    const result = await runAgent(body.agent, {
      tenantId: body.tenantId,
      runAt: new Date(),
      dryRun: body.dryRun,
    });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
