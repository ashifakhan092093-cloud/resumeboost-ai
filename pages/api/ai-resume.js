export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      fullName,
      jobTitle,
      expType,
      companies,
      qualification,
      passoutYear,
      skillsSelected,
    } = req.body || {};

    if (!fullName) return res.status(400).json({ error: "fullName required" });

    const title = (jobTitle || "").trim() || "Professional Executive";

    // seed ensures: same user still gets stable-but-shuffled order; different users get different
    const seed = `${fullName}|${title}|${expType}|${(companies || []).map((c) => c.companyName).join(",")}|${Date.now()}`;

    const points = buildRolePoints(title, expType, seed).slice(0, 6);

    const skills = Array.isArray(skillsSelected) && skillsSelected.length
      ? unique(skillsSelected).slice(0, 12)
      : [];

    return res.status(200).json({
      title,
      education: `${qualification || "10th"} | Passout: ${passoutYear || ""}`,
      skills,
      experiencePoints: points,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

function buildRolePoints(jobTitle, expType, seed) {
  const t = (jobTitle || "").toLowerCase();
  const roleKey = pickRoleKey(t);

  const base = [
    "Delivered consistent quality output with strong ownership and accountability",
    "Maintained professional communication and timely updates to stakeholders",
    "Followed SOPs, safety practices, and company compliance requirements",
    "Improved efficiency by organizing tasks, priorities, and daily workflow",
    "Demonstrated punctuality, discipline, and a high learning mindset",
    "Worked collaboratively with team members to achieve targets and deadlines",
  ];

  const pool = {
    mechanic: [
      "Performed preventive maintenance, inspection, and routine servicing with accuracy",
      "Diagnosed issues using structured checklists and systematic troubleshooting",
      "Executed repair work (brakes/suspension/basic electrical) ensuring safety standards",
      "Maintained tools, spares, and workshop discipline for smooth operations",
      "Conducted final checks and ensured vehicle readiness before delivery",
      "Explained repair findings clearly to customers and maintained service documentation",
      ...base,
    ],
    sales: [
      "Generated and qualified leads through multiple channels to build a strong pipeline",
      "Handled objections confidently and communicated value to improve conversions",
      "Maintained structured follow-ups and improved closure rate with consistency",
      "Prepared quotes and supported negotiations within company guidelines",
      "Updated CRM/records accurately to track meetings, calls, and outcomes",
      "Built long-term customer relationships and ensured post-sale coordination",
      ...base,
    ],
    developer: [
      "Built reliable UI/components with clean code and reusable structure",
      "Integrated APIs with proper validation, error handling, and safe fallbacks",
      "Resolved bugs through debugging, testing, and disciplined release practices",
      "Improved performance by optimizing page load, assets, and client-side logic",
      "Maintained version control with Git and followed structured commits",
      "Collaborated effectively on feedback and shipped iterative improvements",
      ...base,
    ],
    accounts: [
      "Created and verified invoices with strong focus on accuracy and consistency",
      "Maintained billing records, reconciliations, and reporting using Excel",
      "Ensured documentation readiness for audits and internal checks",
      "Tracked pending items and followed up to close open tasks on time",
      "Reduced errors by double-checking critical entries and validations",
      "Maintained confidentiality and compliance in financial documentation",
      ...base,
    ],
    support: [
      "Handled customer queries professionally and ensured resolution with follow-ups",
      "Maintained ticket notes and issue tracking for accountability and clarity",
      "Escalated complex cases with complete details to speed up resolution",
      "Improved customer satisfaction through polite communication and timely updates",
      "Managed repetitive tasks with patience, consistency, and quality standards",
      "Reduced repeat issues by guiding users with clear step-by-step help",
      ...base,
    ],
    generic: [...base],
  }[roleKey] || base;

  // Fresher: keep points but make slightly fresher-oriented
  const finalPool = expType === "Fresher"
    ? pool.map((p) => p.replace("Delivered", "Learned quickly and delivered"))
    : pool;

  // Shuffle so repeat look na ho
  return seededShuffle(unique(finalPool), seed);
}

function pickRoleKey(t) {
  if (t.includes("mechanic") || t.includes("auto")) return "mechanic";
  if (t.includes("sales")) return "sales";
  if (t.includes("developer") || t.includes("frontend") || t.includes("backend") || t.includes("web")) return "developer";
  if (t.includes("account") || t.includes("billing") || t.includes("invoice")) return "accounts";
  if (t.includes("support") || t.includes("customer") || t.includes("call")) return "support";
  return "generic";
}

function unique(arr) {
  return [...new Set(arr)];
}

function seededShuffle(arr, seedStr) {
  const a = [...arr];
  let seed = hash(seedStr || "seed");
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
