export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { fullName, jobTitle, expYears, skills } = req.body || {};

    if (!fullName) return res.status(400).json({ error: "Full name required" });

    const title = (jobTitle && jobTitle.trim()) || "Professional Executive";
    const yearsNum = parseInt((expYears || "").toString().trim(), 10);
    const hasExp = !Number.isNaN(yearsNum) && yearsNum > 0;

    const userSkills = splitSkills(skills || "");
    const roleSkills = suggestSkills(title);

    const finalSkills = unique([...userSkills, ...roleSkills]).slice(0, 14).join(", ");

    const summary = buildSummary({ title, hasExp, yearsNum });
    const experience = buildExperience({ title, hasExp, yearsNum });
    const education = "Bachelor’s Degree / Equivalent Qualification";

    return res.status(200).json({
      summary,
      skills: finalSkills,
      experience,
      education,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

function buildSummary({ title, hasExp, yearsNum }) {
  if (hasExp) {
    return (
      `Results-driven ${title} with ${yearsNum}+ years of experience, known for delivering high-quality work, ` +
      `improving processes, and collaborating effectively with cross-functional teams. Strong communication, ` +
      `problem-solving, and ownership mindset with a focus on measurable outcomes.`
    );
  }
  return (
    `Highly motivated ${title} with strong communication and organizational skills. Quick learner with a ` +
    `results-driven mindset, able to handle responsibilities efficiently and adapt in fast-paced environments. ` +
    `Committed to quality, teamwork, and continuous professional growth.`
  );
}

function buildExperience({ title, hasExp }) {
  if (hasExp) {
    return (
      `• Managed key responsibilities as a ${title}, ensuring timely delivery and consistent quality.\n` +
      `• Coordinated with team/stakeholders to plan priorities, track progress, and meet deadlines.\n` +
      `• Improved workflow efficiency by maintaining clear documentation and process discipline.\n` +
      `• Supported operational goals through problem-solving and customer-focused execution.`
    );
  }
  return (
    `• Assisted in day-to-day operations and handled assigned tasks with accuracy and professionalism.\n` +
    `• Coordinated with team members to support targets, timelines, and quality standards.\n` +
    `• Maintained records/documentation and ensured timely completion of responsibilities.\n` +
    `• Demonstrated strong learning ability, adaptability, and a proactive work attitude.`
  );
}

function suggestSkills(title) {
  const t = title.toLowerCase();

  // Universal baseline
  const base = [
    "Communication",
    "Team Collaboration",
    "Problem Solving",
    "Time Management",
    "MS Office / Digital Tools",
  ];

  // Role hints
  if (t.includes("sales") || t.includes("business")) {
    return unique([...base, "Lead Generation", "Negotiation", "Client Handling", "CRM Basics", "Presentation Skills"]);
  }
  if (t.includes("developer") || t.includes("engineer") || t.includes("software")) {
    return unique([...base, "JavaScript", "Problem Solving (DSA)", "Debugging", "Git", "API Basics"]);
  }
  if (t.includes("account") || t.includes("finance")) {
    return unique([...base, "MS Excel", "Billing & Invoicing", "Reconciliation", "Attention to Detail"]);
  }
  if (t.includes("marketing")) {
    return unique([...base, "Content Writing", "Social Media", "Campaign Coordination", "Analytics Basics"]);
  }

  return unique([...base, "Customer Support", "Documentation", "Coordination"]);
}

function splitSkills(text) {
  return (text || "")
    .split(/,|\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}
