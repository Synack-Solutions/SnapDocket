import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Returns invoice data as JSON for client-side PDF generation.
// The heavy PDF rendering happens in the browser via @react-pdf/renderer.
// For server-side PDF, plug in a ReportingPlugin implementation.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customers(*), invoice_items(*), tenants(name, branding, settings)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // TODO: Replace with server-side PDF generation using ReportingPlugin
  // For now, returns structured data for client-side rendering
  return NextResponse.json({ data: invoice });
}
