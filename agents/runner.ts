import type { Agent, AgentContext } from "./index";
import { InvoiceReminderAgent } from "./invoice-reminder.agent";
import { PaymentReconciliationAgent } from "./payment-reconciliation.agent";
import { JobCompletionAgent } from "./job-completion.agent";

// Singleton — registered once at server startup
const jobCompletionAgent = new JobCompletionAgent();
jobCompletionAgent.register();

// Registry of all available agents (for scheduled / manual runs)
const agents: Agent[] = [
  new InvoiceReminderAgent(),
  new PaymentReconciliationAgent(),
  jobCompletionAgent,
];

// Local runner — call from a Vercel Cron route or CLI script
export async function runAgent(name: string, ctx: AgentContext) {
  const agent = agents.find((a) => a.name === name);
  if (!agent) throw new Error(`Agent "${name}" not found`);

  console.log(`[agent:${name}] starting for tenant ${ctx.tenantId} dryRun=${ctx.dryRun ?? false}`);
  const result = await agent.run(ctx);
  console.log(`[agent:${name}] done`, result);
  return result;
}

export { agents };
