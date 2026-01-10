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
    doc.font("Helvetica").fontSize(12).fillColor("#111").text(payload.title || "Professional");
    doc.font("Helvetica").fontSize(10).fillColor("#111").text(`${payload.email}  |  ${payload.mobile}`);

    // Optional profile line
    const loc = [payload?.meta?.city, payload?.meta?.state, payload?.meta?.pincode].filter(Boolean).join(", ");
    if (loc) doc.text(loc);

    const langs = Array.isArray(payload?.meta?.languages) && payload.meta.languages.length
      ? `Languages: ${payload.meta.languages.join(", ")}`
      : "";
    if (langs) doc.text(langs);

    if (payload?.meta?.availability) doc.text(`Availability: ${payload.meta.availability}`);
    if (payload?.meta?.licenseId) doc.text(`ID/License: ${payload.meta.licenseId}`);

    // Divider (no % issue)
    doc.moveDown(0.6);
    doc.moveTo(42, doc.y).lineTo(553, doc.y).strokeColor("#d1d5db").stroke();
    doc.moveDown(0.8);

    section(doc, "SUMMARY", payload.summary || "-");
    section(doc, "EDUCATION", payload.education || "-");
    section(doc, "SKILLS", Array.isArray(payload.skills) ? payload.skills.join(", ") : "-");

    section(doc, "CERTIFICATIONS", Array.isArray(payload.certifications) && payload.certifications.length ? payload.certifications.join(", ") : "—");

    // Experience (companies + responsibilities)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text("EXPERIENCE");
    doc.moveDown(0.35);

    if ((payload?.meta?.expType || "Fresher") === "Fresher") {
      doc.font("Helvetica").fontSize(10).text("Fresher");
      doc.moveDown(0.8);
    } else {
      const list = Array.isArray(payload.companyResponsibilities) ? payload.companyResponsibilities : [];
      if (!list.length) {
        doc.font("Helvetica").fontSize(10).text("Experienced (details not provided)");
        doc.moveDown(0.8);
      } else {
        for (const c of list) {
          doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text(c.companyName || "Company");
          doc.font("Helvetica").fontSize(10).fillColor("#111");

          const line2 = [
            c.location ? `Location: ${c.location}` : "",
            (c.startDate || c.endDate) ? `Duration: ${fmtDate(c.startDate)} to ${fmtDate(c.endDate)}` : "",
            c.teamSize ? `Supervisor/Team: ${c.teamSize}` : "",
          ].filter(Boolean).join(" | ");
          if (line2) doc.text(line2);

          const pts = Array.isArray(c.points) ? c.points : [];
          for (const p of pts) doc.text(`• ${p}`, { lineGap: 2 });

          doc.moveDown(0.6);
        }
      }
    }

    // Highlights
    section(
      doc,
      "PROFESSIONAL EXPERIENCE HIGHLIGHTS",
      (Array.isArray(payload.experiencePoints) ? payload.experiencePoints : []).map((p) => `• ${p}`).join("\n") || "—"
    );

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

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}
