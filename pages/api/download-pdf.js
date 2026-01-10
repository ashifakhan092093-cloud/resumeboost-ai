import PDFDocument from "pdfkit";

export const config = {
  api: { bodyParser: { sizeLimit: "2mb" } },
};

export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { payload, fileName } = req.body || {};
    if (!payload?.fullName || !payload?.email || !payload?.mobile) {
      return res.status(400).json({ error: "Payload missing (fullName/email/mobile)" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName || "resume.pdf"}"`);

    const doc = new PDFDocument({ size: "A4", margin: 42 });
    doc.pipe(res);

    // Header
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(String(payload.fullName).toUpperCase());
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(12).fillColor("#111").text(payload.title || "Professional Executive");
    doc.font("Helvetica").fontSize(10).fillColor("#111").text(`${payload.email}  |  ${payload.mobile}`);

    // Divider (no % issue)
    doc.moveDown(0.6);
    doc.moveTo(42, doc.y).lineTo(553, doc.y).strokeColor("#d1d5db").stroke();
    doc.moveDown(0.8);

    section(doc, "EDUCATION", payload.education);
    section(doc, "SKILLS", (payload.skills || []).join(", "));
    section(doc, "PROFESSIONAL HIGHLIGHTS", (payload.experiencePoints || []).map((p) => `• ${p}`).join("\n"));

    doc.end();
  } catch (e) {
    return res.status(500).json({ error: e?.message || "PDF error" });
  }
}

function section(doc, title, body) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text(title);
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(10).fillColor("#111").text(String(body || "-"), { lineGap: 3 });
  doc.moveDown(0.8);
}
