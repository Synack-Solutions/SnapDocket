"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TenantInfo {
  tenantId: string | null;
  loading: boolean;
}

/** Returns the current user's tenant_id from their profile row. */
export function useTenant(): TenantInfo {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("tenant_id")
      .single()
      .then(({ data }) => {
        setTenantId(data?.tenant_id ?? null);
        setLoading(false);
      });
  }, []);

  return { tenantId, loading };
}
