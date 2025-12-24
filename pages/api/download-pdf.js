import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, content } = req.body || {};
    const text = (content || "").toString().trim();

    if (!text) return res.status(400).json({ error: "No content provided" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="optimized-resume.pdf"');

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text(title || "Optimized Resume", { align: "center" });
    doc.moveDown();

    doc.fontSize(11).fillColor("#111111").text(text, {
      align: "left",
      lineGap: 4,
    });

    doc.end();
  } catch (e) {
    return res.status(500).json({ error: e.message || "PDF generation failed" });
  }
}
