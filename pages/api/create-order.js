import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay keys missing in env" });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // ₹199 = 19900 paise
    const amount = 19900;
    const currency = "INR";

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `resume_${Date.now()}`,
      notes: {
        product: "ResumeBoost AI - Optimized Resume PDF",
      },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e) {
    console.error("CREATE ORDER ERROR:", e);
    return res.status(500).json({ error: e.message || "Create order failed" });
  }
}
