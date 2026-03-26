import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pixUrl = Deno.env.get("DUTTYFY_PIX_URL_ENCRYPTED");
    if (!pixUrl) {
      return new Response(
        JSON.stringify({ error: "PIX URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Support both GET (query param) and POST (body) for transactionId
    let transactionId: string | null = null;
    
    const url = new URL(req.url);
    transactionId = url.searchParams.get("transactionId");
    
    if (!transactionId && req.method === "POST") {
      try {
        const body = await req.json();
        transactionId = body.transactionId;
      } catch { /* ignore */ }
    }

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "transactionId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET status from Duttyfy: GET {pixUrl}/{transactionId}
    const statusRes = await fetch(`${pixUrl}/${transactionId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const statusText = await statusRes.text();
    let statusData: Record<string, unknown>;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      console.error("Status API non-JSON response:", statusText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Status API returned invalid response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!statusRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to check status", details: statusData }),
        { status: statusRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update DB if completed
    if (statusData.status === "COMPLETED") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("pix_transactions")
        .update({
          status: "COMPLETED",
          paid_at: (statusData.paidAt as string) || new Date().toISOString(),
        })
        .eq("transaction_id", transactionId);
    }

    return new Response(
      JSON.stringify({ status: statusData.status, paidAt: statusData.paidAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
