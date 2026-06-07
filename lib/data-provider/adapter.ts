import type { DataProvider } from "@refinedev/core";

// Extension point: implement this interface to plug in any backend.
// The default implementation delegates to Supabase via getDataProvider().
export interface DataProviderAdapter {
  readonly provider: DataProvider;
  // Hook called before any mutate — useful for optimistic updates or audit logging
  onMutate?: (resource: string, action: "create" | "update" | "delete", variables: unknown) => void;
}

export function createAdapter(provider: DataProvider): DataProviderAdapter {
  return {
    provider,
    onMutate(resource, action, variables) {
      // TODO: wire into the event bus for audit trail
      if (process.env.NODE_ENV === "development") {
        console.debug(`[data-provider] ${action} on ${resource}`, variables);
      }
    },
  };
}
