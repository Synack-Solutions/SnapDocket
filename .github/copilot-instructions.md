# SnapDocket Agent Instructions

## Supabase Migration Discipline (Required)

When a change depends on Supabase schema/data:

1. Check remote migration state first.

- Use `mcp_supabase_list_migrations`.
- Compare against files in `supabase/migrations`.

2. If any required migration is missing remotely, apply it immediately.

- Use `mcp_supabase_apply_migration` with the SQL from the matching migration file.
- Re-check with `mcp_supabase_list_migrations` to confirm.

3. If runtime errors mention missing table/schema cache, treat as migration drift first.

- Do not assume app code is wrong until migration state is confirmed.

4. For seed expectations, verify and run explicitly.

- `supabase/seed.sql` does not run on production deploys automatically.
- If seed data is required in a connected environment, run it explicitly (idempotently where possible) and verify with SQL checks.

5. Before finishing DB-related work, include verification steps.

- Confirm migrations applied.
- Confirm critical tables/rows exist with a quick query.

## Deployment Guardrail

For features that introduce new tables/functions/policies, do not stop at code push only. Also ensure the target Supabase project has the matching migration applied in the same session.
