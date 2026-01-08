import PDFDocument from "pdfkit";

export const config = {
  api: { bodyParser: { sizeLimit: "2mb" } },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { content, fileName } = req.body || {};
    if (!content) return res.status(400).json({ error: "content required" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName || "resume.pdf"}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    doc.fontSize(11).text(String(content), { align: "left" });

    doc.end();
  } catch (e) {
    return res.status(500).json({ error: e?.message || "PDF error" });
  }
}
