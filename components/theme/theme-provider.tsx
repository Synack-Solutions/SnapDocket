"use client";

import { useThemeLoader } from "@/lib/theme/loader";
import type { TenantBranding } from "@/types";

interface ThemeProviderProps {
  branding: TenantBranding | null;
  children: React.ReactNode;
}

// Applies runtime theme tokens from tenant branding on mount
export function ThemeProvider({ branding, children }: ThemeProviderProps) {
  useThemeLoader(branding);
  return <>{children}</>;
}
