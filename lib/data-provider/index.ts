import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import type { DataProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

// Adapter wraps the official refine Supabase data provider.
// Swap `buildProvider` to replace the backend (e.g., REST, GraphQL) without
// touching any resource definitions.
function buildProvider(): DataProvider {
  const supabase = createClient();
  return supabaseDataProvider(supabase);
}

// Singleton — reused across renders
let _provider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!_provider) {
    _provider = buildProvider();
  }
  return _provider;
}

export { buildProvider };
