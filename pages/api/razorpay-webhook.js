// pages/api/razorpay-webhook.js
import crypto from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const config = {
  api: {
    bodyParser: false, // IMPORTANT: webhook needs raw body
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!webhookSecret) return res.status(500).json({ error: "RAZORPAY_WEBHOOK_SECRET missing" });
    if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL missing" });
    if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY missing" });

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return res.status(400).json({ error: "Missing x-razorpay-signature" });

    const rawBody = await getRawBody(req);

    // Verify signature
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      console.log("❌ Invalid signature", { expected, signature });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody);

    // Handle payment.captured
    if (event?.event === "payment.captured") {
      const p = event?.payload?.payment?.entity;

      console.log("✅ payment.captured:", {
        id: p?.id,
        order_id: p?.order_id,
        amount: p?.amount,
        method: p?.method,
        email: p?.email,
        contact: p?.contact,
      });

      const { error } = await supabaseAdmin.from("payments").upsert(
        {
          payment_id: p?.id,
          order_id: p?.order_id,
          amount: p?.amount,
          currency: p?.currency || "INR",
          status: "captured",
          method: p?.method,
          email: p?.email,
          contact: p?.contact,
          raw: event,
        },
        { onConflict: "payment_id" }
      );

      if (error) console.log("❌ supabase insert error:", error);
      else console.log("✅ saved to supabase:", p?.id);
    }

    // Handle payment.failed
    if (event?.event === "payment.failed") {
      const p = event?.payload?.payment?.entity;

      console.log("❌ payment.failed:", {
        id: p?.id,
        order_id: p?.order_id,
        error: p?.error_description,
      });

      const { error } = await supabaseAdmin.from("payments").upsert(
        {
          payment_id: p?.id,
          order_id: p?.order_id,
          amount: p?.amount,
          currency: p?.currency || "INR",
          status: "failed",
          method: p?.method,
          email: p?.email,
          contact: p?.contact,
          raw: event,
        },
        { onConflict: "payment_id" }
      );

      if (error) console.log("❌ supabase failed insert error:", error);
      else console.log("✅ saved failed payment to supabase:", p?.id);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    return res.status(500).json({ error: e?.message || "Webhook error" });
  }
}
