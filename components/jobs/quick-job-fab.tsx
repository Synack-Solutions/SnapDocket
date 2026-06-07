"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Floating action button for mobile — sits above the bottom tab bar.
 * Hidden on md+ (desktop users use the sidebar navigation instead).
 */
export function QuickJobFab({ className }: { className?: string }) {
  return (
    <Link
      href="/jobs/quick"
      className={cn(
        // Position: above the bottom nav bar (56px tab bar + 8px gap)
        "fixed bottom-16 right-4 z-40 md:hidden",
        "flex h-14 w-14 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "text-2xl leading-none",
        "transition-transform active:scale-95 hover:scale-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label="Start a quick job"
    >
      +
    </Link>
  );
}
