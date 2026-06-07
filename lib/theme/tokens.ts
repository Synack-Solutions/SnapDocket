import type { ThemeTokens } from "@/types";

// Default theme tokens — HSL values without the hsl() wrapper for Tailwind CSS variable injection
export const defaultTheme: ThemeTokens = {
  colorPrimary: "222 47% 11%",
  colorPrimaryForeground: "210 40% 98%",
  colorSecondary: "210 40% 96%",
  colorSecondaryForeground: "222 47% 11%",
  colorAccent: "217 91% 60%",
  colorAccentForeground: "210 40% 98%",
  colorBackground: "0 0% 100%",
  colorForeground: "222 47% 11%",
  colorMuted: "210 40% 96%",
  colorMutedForeground: "215 16% 47%",
  colorBorder: "214 32% 91%",
  colorDestructive: "0 84% 60%",
  colorSuccess: "142 76% 36%",
  radius: "0.5rem",
  fontSans: "Inter",
};

export function tokensToCSS(tokens: Partial<ThemeTokens>): string {
  const map: Record<keyof ThemeTokens, string> = {
    colorPrimary: "--color-primary",
    colorPrimaryForeground: "--color-primary-foreground",
    colorSecondary: "--color-secondary",
    colorSecondaryForeground: "--color-secondary-foreground",
    colorAccent: "--color-accent",
    colorAccentForeground: "--color-accent-foreground",
    colorBackground: "--color-background",
    colorForeground: "--color-foreground",
    colorMuted: "--color-muted",
    colorMutedForeground: "--color-muted-foreground",
    colorBorder: "--color-border",
    colorDestructive: "--color-destructive",
    colorSuccess: "--color-success",
    radius: "--radius",
    fontSans: "--font-sans",
  };

  return Object.entries(tokens)
    .map(([key, value]) => {
      const cssVar = map[key as keyof ThemeTokens];
      return cssVar ? `${cssVar}: ${value};` : "";
    })
    .filter(Boolean)
    .join("\n  ");
}
