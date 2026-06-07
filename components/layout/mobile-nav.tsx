"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/jobs", label: "Jobs", icon: "🔧" },
  { href: "/invoices", label: "Invoices", icon: "📄" },
  { href: "/payments", label: "Payments", icon: "💳" },
  { href: "/services", label: "Services", icon: "🏷️" },
  { href: "/team", label: "Team", icon: "🫂" },
];

// Bottom tab bar for mobile — fixed at bottom of screen
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Slide-out drawer alternative for mobile header use
export function MobileMenuDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center p-2 md:hidden"
        aria-label="Open navigation menu"
      >
        <span className="text-xl">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute left-0 top-0 h-full w-64 bg-primary p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-black text-white">
                  S
                </span>
                SnapDocket
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-accent text-white"
                        : "text-white/60 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
