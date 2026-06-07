"use client";

import { MobileMenuDrawer } from "./mobile-nav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 shadow-sm md:px-5">
      <div className="flex items-center gap-3">
        <MobileMenuDrawer />
      </div>
      <div className="flex items-center gap-2">
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
