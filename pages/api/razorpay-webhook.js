import crypto from "crypto";
import { MongoClient } from "mongodb";

export const config = {
  api: { bodyParser: false }, // ✅ RAW body needed
};

let cachedClient = null;

async function connectMongo() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ error: "RAZORPAY_WEBHOOK_SECRET missing" });

    const rawBody = await getRawBody(req);
    const receivedSignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== receivedSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const client = await connectMongo();
      const db = client.db("resumeboost");
      const payments = db.collection("payments");

      await payments.insertOne({
        payment_id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        email: payment.email,
        contact: payment.contact,
        created_at: new Date(),
      });

      console.log("✅ Payment saved to MongoDB:", payment.id);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: err?.message || "Webhook failed" });
  }
}
