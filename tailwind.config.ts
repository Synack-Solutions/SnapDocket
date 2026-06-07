import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable-driven theme tokens — overridden per tenant via :root
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--color-primary-foreground) / <alpha-value>)",
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        "secondary-foreground": "hsl(var(--color-secondary-foreground) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--color-accent-foreground) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--color-muted-foreground) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        destructive: "hsl(var(--color-destructive) / <alpha-value>)",
        success: "hsl(var(--color-success) / <alpha-value>)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
