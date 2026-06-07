import type { ThemeTokens } from "@/types";

// Default theme tokens — HSL values without the hsl() wrapper for Tailwind CSS variable injection
export const defaultTheme: ThemeTokens = {
  colorPrimary: "233 20% 14%",
  colorPrimaryForeground: "210 40% 98%",
  colorSecondary: "220 14% 91%",
  colorSecondaryForeground: "233 20% 14%",
  colorAccent: "247 80% 60%",
  colorAccentForeground: "0 0% 100%",
  colorBackground: "220 14% 96%",
  colorForeground: "233 20% 14%",
  colorMuted: "220 14% 91%",
  colorMutedForeground: "220 9% 46%",
  colorBorder: "220 13% 87%",
  colorDestructive: "0 84% 60%",
  colorSuccess: "142 71% 35%",
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
