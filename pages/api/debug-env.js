export default function handler(req, res) {
  if (req.query.key !== process.env.DEBUG_KEY) {
    return res.status(401).json({ ok: false, message: "unauthorized" });
  }

  return res.status(200).json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
  });
}
