import type { VercelRequest, VercelResponse } from "@vercel/node";

const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!DUTTYFY_URL) {
    return res.status(500).json({ error: "Payment gateway not configured" });
  }

  const { transactionId } = req.query;

  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({ error: "transactionId is required" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `${DUTTYFY_URL}?transactionId=${encodeURIComponent(transactionId)}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[pix/status] Gateway error: ${response.status}`);
      return res.status(502).json({ error: "Gateway error" });
    }

    const data = await response.json();

    return res.status(200).json({
      status: data.status || "PENDING",
      ...(data.paidAt ? { paidAt: data.paidAt } : {}),
    });
  } catch (err: unknown) {
    console.error("[pix/status] Error:", err instanceof Error ? err.message : err);
    return res.status(502).json({ error: "Gateway unavailable" });
  }
}
