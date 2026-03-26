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

    const body = await req.json();
    const { amount, customer, items, shipping, utm_params } = body;

    // Validate amount (integer in cents, minimum 1)
    if (!amount || typeof amount !== "number" || amount < 1 || !Number.isInteger(amount)) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Must be integer in cents." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!customer?.name || !customer?.email || !customer?.document || !customer?.phone) {
      return new Response(
        JSON.stringify({ error: "Customer name, email, document (CPF) and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build PIX request body per Duttyfy API spec
    const pixCustomer: Record<string, string> = {
      name: customer.name,
      email: customer.email,
      document: customer.document.replace(/\D/g, ""),
      phone: customer.phone.replace(/\D/g, ""),
    };

    // Build item object from order details
    const itemName = Array.isArray(items) && items.length > 0
      ? items.map((i: { name: string }) => i.name).join(", ")
      : "Pedido";

    const pixBody = {
      amount,
      paymentMethod: "PIX",
      customer: pixCustomer,
      item: {
        title: itemName,
        quantity: 1,
        price: amount,
      },
    };

    console.log(`Calling PIX API (url ending: ...${pixUrl.slice(-8)}), amount: ${amount}, body:`, JSON.stringify(pixBody));

    const pixRes = await fetch(pixUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pixBody),
    });

    const pixText = await pixRes.text();
    let pixData: Record<string, unknown>;
    try {
      pixData = JSON.parse(pixText);
    } catch {
      console.error("PIX API non-JSON response:", pixText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "PIX API returned invalid response", details: pixText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pixRes.ok) {
      console.error("PIX API error:", JSON.stringify(pixData));
      return new Response(
        JSON.stringify({ error: "PIX charge creation failed", details: pixData }),
        { status: pixRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pixCode, transactionId } = pixData as { pixCode?: string; transactionId?: string };

    if (!pixCode || !transactionId) {
      console.error("PIX API missing fields. Response:", JSON.stringify(pixData));
      return new Response(
        JSON.stringify({ error: "Invalid PIX API response - missing pixCode or transactionId" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persist to DB immediately (before returning to client)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase.from("pix_transactions").insert({
      transaction_id: transactionId,
      amount,
      status: "PENDING",
      customer_name: customer.name,
      customer_email: customer.email,
      customer_document: customer.document?.replace(/\D/g, "") || null,
      pix_code: pixCode,
      items: items || null,
      shipping: shipping || null,
      utm_params: utm_params || null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    return new Response(
      JSON.stringify({ pixCode, transactionId }),
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
