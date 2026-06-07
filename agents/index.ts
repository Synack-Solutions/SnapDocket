// Agent interface — implement this to create automations that run on a schedule or event trigger

export interface AgentContext {
  tenantId: string;
  runAt: Date;
  dryRun?: boolean;
}

export interface AgentResult {
  success: boolean;
  processed: number;
  errors: string[];
  metadata?: Record<string, unknown>;
}

export interface Agent {
  readonly name: string;
  readonly description: string;
  run(ctx: AgentContext): Promise<AgentResult>;
}
