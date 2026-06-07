"use client";

import { useEffect } from "react";
import type { TenantBranding, ThemeTokens } from "@/types";
import { defaultTheme, tokensToCSS } from "./tokens";

// Merges tenant branding into CSS variables at runtime — safe for SSR hydration
export function applyTenantTheme(branding: TenantBranding | null): void {
  if (typeof document === "undefined") return;

  const overrides: Partial<ThemeTokens> = {};

  if (branding?.primary_color) overrides.colorPrimary = branding.primary_color;
  if (branding?.secondary_color) overrides.colorSecondary = branding.secondary_color;
  if (branding?.accent_color) overrides.colorAccent = branding.accent_color;
  if (branding?.font_family) overrides.fontSans = branding.font_family;

  const merged = { ...defaultTheme, ...overrides };
  const css = tokensToCSS(merged);

  let styleEl = document.getElementById("tenant-theme") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "tenant-theme";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `:root {\n  ${css}\n}`;
}

export function useThemeLoader(branding: TenantBranding | null) {
  useEffect(() => {
    applyTenantTheme(branding);
  }, [branding]);
}
