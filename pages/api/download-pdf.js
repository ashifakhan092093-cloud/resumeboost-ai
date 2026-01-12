// pages/api/download-pdf.js

const PDFDocument = require("pdfkit");

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

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

    const pageBottom = 770;

    const ensureSpace = (needed = 40) => {
      if (doc.y + needed > pageBottom) doc.addPage();
    };

    const section = (title, body) => {
      if (!body) return;
      ensureSpace(60);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text(title);
      doc.moveDown(0.35);
      doc.font("Helvetica").fontSize(10).fillColor("#111").text(String(body), { lineGap: 3 });
      doc.moveDown(0.8);
    };

    const fmtDate = (s) => {
      if (!s) return "-";
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return s;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}-${mm}-${yy}`;
    };

    // ===== HEADER =====
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(String(payload.fullName).toUpperCase());
    doc.moveDown(0.15);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text(payload.title || "Professional");
    doc.font("Helvetica").fontSize(10).fillColor("#111").text(`${payload.email}  |  ${payload.mobile}`);

    // Divider
    doc.moveDown(0.6);
    doc.moveTo(42, doc.y).lineTo(553, doc.y).strokeColor("#d1d5db").stroke();
    doc.moveDown(0.8);

    // ===== ADDRESS / LOCATION (clean wrap + multi-line) =====
    const meta = payload.meta || {};
    const addressLines = [
      (meta.fullAddress || "").trim(),
      [meta.city, meta.state].filter(Boolean).join(", "),
      meta.pincode ? `PIN: ${meta.pincode}` : "",
    ].filter(Boolean);

    if (addressLines.length) section("ADDRESS", addressLines.join("\n"));

    // ===== LANGUAGES (kept, but only if present) =====
    if (Array.isArray(meta.languages) && meta.languages.length) {
      section("LANGUAGES", meta.languages.join(", "));
    }

    // ===== EDUCATION =====
    section("EDUCATION", payload.education || "-");

    // ===== SUMMARY =====
    section("PROFESSIONAL SUMMARY", payload.summary || "-");

    // ===== SKILLS =====
    if (Array.isArray(payload.skills) && payload.skills.length) {
      section("KEY SKILLS", payload.skills.join(", "));
    }

    // ===== EXPERIENCE (companies + points) =====
    ensureSpace(40);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text("EXPERIENCE");
    doc.moveDown(0.35);

    const expType = meta.expType === "Experienced" ? "Experienced" : "Fresher";
    const companyBlocks = Array.isArray(payload.companyResponsibilities) ? payload.companyResponsibilities : [];

    if (expType === "Experienced" && companyBlocks.length) {
      companyBlocks.forEach((c, idx) => {
        ensureSpace(160);

        const name = c.companyName ? c.companyName : `Company ${idx + 1}`;
        const loc = c.location ? ` | ${c.location}` : "";
        const dur = `Duration: ${fmtDate(c.startDate)} to ${fmtDate(c.endDate)}`;

        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text(`${name}${loc}`);
        doc.font("Helvetica").fontSize(10).fillColor("#111").text(dur);
        doc.moveDown(0.25);

        const pts = Array.isArray(c.points) ? c.points : [];
        pts.slice(0, 6).forEach((p) => {
          ensureSpace(24);
          doc.text(`• ${p}`, { lineGap: 2 });
        });

        doc.moveDown(0.6);
      });
    } else {
      doc.font("Helvetica").fontSize(10).fillColor("#111").text("Fresher");
      doc.moveDown(0.6);
    }

    // ===== HIGHLIGHTS (Unique, non-overlap) =====
    const highlights = Array.isArray(payload.experiencePoints) ? payload.experiencePoints : [];
    if (highlights.length) {
      section("PROFESSIONAL HIGHLIGHTS", highlights.map((p) => `• ${p}`).join("\n"));
    }

    doc.end();
  } catch (e) {
    return res.status(500).json({ error: e?.message || "PDF error" });
  }
}
