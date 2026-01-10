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
      const text = clean(body);
      if (!text) return;
      ensureSpace(70);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text(title);
      doc.moveDown(0.35);
      doc.font("Helvetica").fontSize(10).fillColor("#111").text(text, { lineGap: 3 });
      doc.moveDown(0.8);
    };

    // ===== HEADER =====
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(clean(payload.fullName).toUpperCase());
    doc.moveDown(0.15);

    doc.font("Helvetica").fontSize(12).fillColor("#111").text(clean(payload.title || payload.jobTitle || "Professional"));

    // ✅ normal separator (no weird unicode => "%" issue avoid)
    doc.font("Helvetica").fontSize(10).fillColor("#111").text(`${clean(payload.email)} | ${clean(payload.mobile)}`);

    // Divider
    doc.moveDown(0.6);
    doc.moveTo(42, doc.y).lineTo(553, doc.y).strokeColor("#d1d5db").stroke();
    doc.moveDown(0.8);

    // ===== LOCATION =====
    const meta = payload.meta || {};
    const locLine = [
      clean(meta.fullAddress || payload.fullAddress),
      clean(meta.city || payload.city),
      clean(meta.state || payload.state),
      (meta.pincode || payload.pincode) ? `PIN: ${clean(meta.pincode || payload.pincode)}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    section("ADDRESS", locLine);

    // ===== LANGUAGES / AVAILABILITY / LICENSE =====
    const langs = Array.isArray(meta.languages) ? meta.languages : payload.languages;
    if (Array.isArray(langs) && langs.length) section("LANGUAGES", langs.map(clean).filter(Boolean).join(", "));
    section("AVAILABILITY", meta.availability || payload.availability);
    section("ID / LICENSE", meta.licenseId || payload.licenseId);

    // ===== EDUCATION =====
    section("EDUCATION", payload.education || `${clean(payload.qualification || "-")} | Passout: ${clean(payload.passoutYear || "-")}`);

    // ===== SUMMARY =====
    section("PROFESSIONAL SUMMARY", payload.summary || "-");

    // ===== SKILLS =====
    if (Array.isArray(payload.skills) && payload.skills.length) section("KEY SKILLS", payload.skills.map(clean).filter(Boolean).join(", "));

    // ===== CERTIFICATIONS =====
    if (Array.isArray(payload.certifications) && payload.certifications.length) {
      section("CERTIFICATIONS", payload.certifications.map((x) => `• ${clean(x)}`).join("\n"));
    }

    // ===== EXPERIENCE =====
    ensureSpace(50);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text("EXPERIENCE");
    doc.moveDown(0.35);

    const expType = meta.expType || payload.expType || "Fresher";

    // Prefer AI companyResponsibilities (best)
    const companyBlocks = Array.isArray(payload.companyResponsibilities) ? payload.companyResponsibilities : null;

    if (expType === "Experienced") {
      const list =
        companyBlocks && companyBlocks.length
          ? companyBlocks
          : (Array.isArray(meta.companies) ? meta.companies : Array.isArray(payload.companies) ? payload.companies : []);

      if (list.length) {
        list.forEach((c, idx) => {
          ensureSpace(170);

          const name = clean(c.companyName) || `Company ${idx + 1}`;
          const loc = clean(c.location) ? ` | ${clean(c.location)}` : ""; // ✅ FIX (location)
          const dur = `Duration: ${fmt(c.startDate)} to ${fmt(c.endDate)}`;
          const team = clean(c.teamSize) ? `Supervisor/Team: ${clean(c.teamSize)}` : "";

          doc.font("Helvetica-Bold").fontSize(10).fillColor("#111").text(`${name}${loc}`);
          doc.font("Helvetica").fontSize(10).fillColor("#111").text(dur);
          if (team) doc.text(team);
          doc.moveDown(0.25);

          const pts = Array.isArray(c.points) ? c.points : [];
          pts.slice(0, 6).forEach((p) => {
            ensureSpace(26);
            doc.text(`• ${clean(p)}`, { lineGap: 2 });
          });

          doc.moveDown(0.6);
        });
      } else {
        doc.font("Helvetica").fontSize(10).fillColor("#111").text("Experienced (details not provided)");
        doc.moveDown(0.6);
      }
    } else {
      doc.font("Helvetica").fontSize(10).fillColor("#111").text("Fresher");
      doc.moveDown(0.6);
    }

    // ===== HIGHLIGHTS =====
    const highlights = Array.isArray(payload.experiencePoints) ? payload.experiencePoints : [];
    if (highlights.length) {
      section("PROFESSIONAL EXPERIENCE HIGHLIGHTS", highlights.map((p) => `• ${clean(p)}`).join("\n"));
    }

    doc.end();
  } catch (e) {
    return res.status(500).json({ error: e?.message || "PDF error" });
  }
}

function clean(v) {
  return String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fmt(d) {
  const s = clean(d);
  if (!s) return "-";
  const x = new Date(s);
  if (Number.isNaN(x.getTime())) return s;
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yy = x.getFullYear();
  return `${dd}-${mm}-${yy}`;
}
