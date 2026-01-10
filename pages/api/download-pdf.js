import PDFDocument from "pdfkit";

export default function handler(req, res) {
  try {
    const { payload } = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${payload.fullName.replace(/\s+/g, "_")}_Resume.pdf"`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(payload.fullName, { align: "left" });

    doc
      .fontSize(13)
      .font("Helvetica")
      .text(payload.title || "", { marginTop: 4 });

    doc
      .fontSize(10.5)
      .fillColor("#333")
      .text(
        `${payload.email} | ${payload.mobile}${
          payload.meta?.location
            ? " | " + payload.meta.location
            : ""
        }`,
        { marginTop: 6 }
      );

    doc.moveDown(1);
    divider(doc);

    /* ================= SUMMARY ================= */
    sectionTitle(doc, "PROFESSIONAL SUMMARY");
    doc.font("Helvetica").fontSize(11).text(payload.summary);
    doc.moveDown(0.8);

    /* ================= SKILLS ================= */
    if (payload.skills?.length) {
      sectionTitle(doc, "KEY SKILLS");
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(payload.skills.join(" • "));
      doc.moveDown(0.8);
    }

    /* ================= EXPERIENCE ================= */
    if (payload.experience?.length) {
      sectionTitle(doc, "PROFESSIONAL EXPERIENCE");

      payload.experience.forEach((exp) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(exp.company);

        if (exp.duration) {
          doc
            .font("Helvetica-Oblique")
            .fontSize(10)
            .fillColor("#555")
            .text(exp.duration);
        }

        doc.moveDown(0.3);

        exp.points.forEach((p) => {
          doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#000")
            .text("• " + p, { indent: 10 });
        });

        doc.moveDown(0.6);
      });
    }

    /* ================= EDUCATION ================= */
    if (payload.education) {
      sectionTitle(doc, "EDUCATION");
      doc.font("Helvetica").fontSize(11).text(payload.education);
      doc.moveDown(0.8);
    }

    /* ================= CERTIFICATIONS ================= */
    if (payload.meta?.certifications?.length) {
      sectionTitle(doc, "CERTIFICATIONS");
      payload.meta.certifications.forEach((c) => {
        doc.fontSize(11).text("• " + c);
      });
      doc.moveDown(0.8);
    }

    /* ================= ADDITIONAL INFO ================= */
    sectionTitle(doc, "ADDITIONAL INFORMATION");

    const infoLines = [];
    if (payload.meta?.languages?.length)
      infoLines.push(
        `Languages: ${payload.meta.languages.join(", ")}`
      );
    if (payload.meta?.availability)
      infoLines.push(`Availability: ${payload.meta.availability}`);
    if (payload.meta?.license)
      infoLines.push(`License / ID: ${payload.meta.license}`);

    infoLines.forEach((line) => {
      doc.fontSize(11).text(line);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "PDF generation failed" });
  }
}

/* ================= HELPERS ================= */

function sectionTitle(doc, title) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#000")
    .text(title);
  doc.moveDown(0.3);
}

function divider(doc) {
  doc
    .strokeColor("#999")
    .lineWidth(0.8)
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke();
  doc.moveDown(0.8);
}
