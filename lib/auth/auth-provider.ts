import type { AuthProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

// Refine auth provider backed by Supabase Auth
export const authProvider: AuthProvider = {
  async login({ email, password }) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: { message: error.message, name: "LoginError" } };
    return { success: true, redirectTo: "/dashboard" };
  },

  async logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    return { success: true, redirectTo: "/login" };
  },

  async check() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) return { authenticated: true };
    return { authenticated: false, redirectTo: "/login" };
  },

  async getIdentity() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      name: data.user.user_metadata?.full_name ?? data.user.email,
      email: data.user.email,
      avatar: data.user.user_metadata?.avatar_url,
    };
  },

  async onError(error) {
    if (error?.status === 401 || error?.status === 403) {
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
