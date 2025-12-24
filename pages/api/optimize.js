export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔥 DEMO MODE RESPONSE (NO API, NO BILLING)
  return res.status(200).json({
    score: 76,
    summary:
      "Your resume matches the job description moderately well, but improvements are needed to increase ATS compatibility.",
    missingKeywords: [
      "CRM",
      "Lead Generation",
      "Pipeline Management",
      "B2B Sales",
      "KPIs",
      "Client Acquisition",
      "Sales Forecasting",
    ],
    tips: [
      "Add measurable achievements (e.g., increased sales by 20%).",
      "Use more job-specific keywords from the job description.",
      "Improve formatting for better ATS readability.",
      "Use strong action verbs like led, achieved, managed.",
      "Avoid long paragraphs; use bullet points.",
    ],
    optimizedResumeText: `
SUMMARY
Results-driven sales professional with experience in business development, client acquisition, and revenue growth.

EXPERIENCE
• Managed B2B sales pipeline and achieved consistent monthly targets
• Developed strong client relationships and improved conversion rates

SKILLS
• CRM Tools
• Lead Generation
• Sales Strategy
• Communication
• KPI Tracking
`,
  });
}
