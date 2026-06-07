"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/jobs", label: "Jobs", icon: "🔧" },
  { href: "/invoices", label: "Invoices", icon: "📄" },
  { href: "/payments", label: "Payments", icon: "💳" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-border bg-background md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold text-primary">SnapDocket</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
