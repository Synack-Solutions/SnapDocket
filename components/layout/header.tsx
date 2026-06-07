"use client";

import { MobileMenuDrawer } from "./mobile-nav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, email")
      .single()
      .then(({ data }) => {
        setDisplayName(data?.full_name || data?.email?.split("@")[0] || null);
      });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 shadow-sm md:px-5">
      <div className="flex items-center gap-3">
        <MobileMenuDrawer />
      </div>
      <div className="flex items-center gap-3">
        {displayName && (
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:block">
              {displayName}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
