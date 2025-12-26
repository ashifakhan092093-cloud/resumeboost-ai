import crypto from "crypto";

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
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ error: "WEBHOOK secret missing" });

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return res.status(400).json({ error: "Missing signature" });

    const rawBody = await getRawBody(req);

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody);

    // ✅ Handle events
    if (event?.event === "payment.captured") {
      const payment = event?.payload?.payment?.entity;
      console.log("✅ payment.captured:", {
        id: payment?.id,
        order_id: payment?.order_id,
        amount: payment?.amount,
        method: payment?.method,
        email: payment?.email,
        contact: payment?.contact,
      });
      // TODO (next): yahan DB me save kar denge
    }

    if (event?.event === "payment.failed") {
      const payment = event?.payload?.payment?.entity;
      console.log("❌ payment.failed:", {
        id: payment?.id,
        order_id: payment?.order_id,
        error: payment?.error_description,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    return res.status(500).json({ error: e?.message || "Webhook error" });
  }
}
