import type { VercelRequest, VercelResponse } from "@vercel/node";

const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!DUTTYFY_URL) {
    console.error("[pix/create] DUTTYFY_PIX_URL_ENCRYPTED not set");
    return res.status(500).json({ error: "Payment gateway not configured" });
  }

  try {
    const { amount, customer, items, shipping, utm } = req.body;

    // Validate required fields
    if (!amount || amount < 100) {
      return res.status(400).json({ error: "amount must be >= 100 (cents)" });
    }
    if (!customer?.name || !customer?.document || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: "Missing required customer fields" });
    }

    // Build item title from cart items
    const itemTitle = items?.map((i: { name: string }) => i.name).join(", ") || "Pedido FRAN";

    const body = {
      amount,
      customer: {
        name: customer.name,
        document: customer.document.replace(/\D/g, ""),
        email: customer.email,
        phone: customer.phone.replace(/\D/g, ""),
      },
      item: {
        title: itemTitle,
        price: amount,
        quantity: 1,
      },
      paymentMethod: "PIX",
      ...(utm ? { utm } : {}),
    };

    // Retry with exponential backoff (max 3 attempts, only on 5xx/network)
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(DUTTYFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status >= 400 && response.status < 500) {
          const data = await response.json().catch(() => ({}));
          console.error(`[pix/create] 4xx error: ${response.status}`, data);
          return res.status(response.status).json({ error: data.message || "Gateway rejected request" });
        }

        if (response.status >= 500) {
          lastError = new Error(`Gateway returned ${response.status}`);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
            continue;
          }
          return res.status(502).json({ error: "Payment gateway unavailable" });
        }

        const data = await response.json();

        if (!data.pixCode || !data.transactionId) {
          console.error("[pix/create] Unexpected response:", JSON.stringify(data).slice(0, 200));
          return res.status(502).json({ error: "Invalid gateway response" });
        }

        console.log(`[pix/create] OK txn=...${data.transactionId.slice(-8)} amount=${amount}`);

        return res.status(200).json({
          pixCode: data.pixCode,
          transactionId: data.transactionId,
          status: data.status || "PENDING",
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    console.error("[pix/create] All retries failed:", lastError?.message);
    return res.status(502).json({ error: "Payment gateway unavailable" });
  } catch (err: unknown) {
    console.error("[pix/create] Unexpected error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
