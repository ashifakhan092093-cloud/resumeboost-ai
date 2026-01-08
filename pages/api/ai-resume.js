export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      fullName,
      jobTitle,
      expYears,
      skills,
      qualification,
      fieldOfStudy,
      institute,
      gradYear,
      experienceNotes,
    } = req.body || {};

    if (!fullName) return res.status(400).json({ error: "Full name required" });

    const title = (jobTitle && jobTitle.trim()) || "Professional Executive";
    const yearsNum = parseInt((expYears || "").toString().trim(), 10);
    const hasExp = !Number.isNaN(yearsNum) && yearsNum > 0;

    const userSkills = splitSkills(skills || "");
    const roleSkills = suggestSkills(title);
    const finalSkills = unique([...userSkills, ...roleSkills]).slice(0, 14).join(", ");

    const summary = buildSummary({ title, hasExp, yearsNum });

    // ✅ If user provided experience notes, prefer that
    const experience = (experienceNotes || "").trim()
      ? sanitizeBullets(experienceNotes.trim())
      : buildExperience({ title, hasExp });

    const education = buildEducation({
      qualification,
      fieldOfStudy,
      institute,
      gradYear,
    });

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
      `supporting business goals, and collaborating effectively with teams. Strong communication, problem-solving, ` +
      `and ownership mindset with a focus on measurable outcomes.`
    );
  }
  return (
    `Highly motivated ${title} with strong communication and organizational skills. Quick learner with a professional ` +
    `mindset, able to handle responsibilities efficiently and adapt in fast-paced environments. Actively seeking opportunities ` +
    `to contribute to organizational growth.`
  );
}

function buildExperience({ title, hasExp }) {
  if (hasExp) {
    return (
      `• Managed key responsibilities as a ${title}, ensuring timely delivery and consistent quality.\n` +
      `• Coordinated with team/stakeholders to plan priorities, track progress, and meet deadlines.\n` +
      `• Maintained documentation and improved workflow through process discipline.\n` +
      `• Demonstrated professionalism, punctuality, and a results-oriented mindset.`
    );
  }
  return (
    `• Assisted in day-to-day operations and handled assigned tasks with accuracy and professionalism.\n` +
    `• Coordinated with team members to support targets, timelines, and quality standards.\n` +
    `• Maintained records/documentation and ensured timely completion of responsibilities.\n` +
    `• Demonstrated professionalism, punctuality, and a results-oriented mindset.`
  );
}

function suggestSkills(title) {
  const t = title.toLowerCase();

  const base = [
    "Communication",
    "Team Collaboration",
    "Problem Solving",
    "Time Management",
    "MS Office / Digital Tools",
  ];

  if (t.includes("sales") || t.includes("business")) {
    return unique([...base, "Lead Generation", "Negotiation", "Client Handling", "CRM Basics", "Presentation Skills"]);
  }
  if (t.includes("developer") || t.includes("engineer") || t.includes("software")) {
    return unique([...base, "JavaScript", "Debugging", "Git", "API Basics", "Logical Thinking"]);
  }
  if (t.includes("account") || t.includes("finance")) {
    return unique([...base, "MS Excel", "Billing & Invoicing", "Reconciliation", "Attention to Detail"]);
  }
  if (t.includes("marketing")) {
    return unique([...base, "Content Writing", "Social Media", "Campaign Coordination", "Analytics Basics"]);
  }

  return unique([...base, "Customer Support", "Documentation", "Coordination"]);
}

function buildEducation({ qualification, fieldOfStudy, institute, gradYear }) {
  const q = (qualification || "").trim();
  const f = (fieldOfStudy || "").trim();
  const i = (institute || "").trim();
  const y = (gradYear || "").trim();

  if (q || f || i || y) {
    const left = [q, f].filter(Boolean).join(" - ");
    const right = [i, y].filter(Boolean).join(" | ");
    if (left && right) return `${left}\n${right}`;
    if (left) return left;
    if (right) return right;
  }

  return "Bachelor’s Degree / Equivalent Qualification";
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

// Make sure bullets look clean
function sanitizeBullets(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // If user didn’t add bullets, add bullets automatically
  const hasBullet = lines.some((l) => l.startsWith("•") || l.startsWith("-"));
  if (hasBullet) {
    return lines
      .map((l) => (l.startsWith("-") ? `• ${l.slice(1).trim()}` : l))
      .join("\n");
  }
  return lines.map((l) => `• ${l}`).join("\n");
}
