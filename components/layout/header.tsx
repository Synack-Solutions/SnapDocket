"use client";

import { MobileMenuDrawer } from "./mobile-nav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileMenuDrawer />
        {title && <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        {/* TODO: Add user avatar dropdown */}
        <button
          onClick={handleSignOut}
          className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
