import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        error: "Razorpay keys missing",
        key_id_present: !!key_id,
        key_secret_present: !!key_secret,
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const order = await razorpay.orders.create({
      amount: 19900,
      currency: "INR",
      receipt: `resume_${Date.now()}`,
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e) {
    console.error("RAZORPAY ORDER ERROR FULL:", e);

    return res.status(500).json({
      error: "Razorpay order create failed",
      details: e?.error || e?.message || e,
    });
  }
}
