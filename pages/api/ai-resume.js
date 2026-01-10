export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      fullName,
      email,
      mobile,
      jobTitle,
      qualification,
      passoutYear,
      expType,
      companies,
      skillsSelected,
    } = req.body || {};

    if (!fullName || !email || !mobile) return res.status(400).json({ error: "Name/Email/Mobile required" });

    const title = (jobTitle || "Professional Executive").trim();

    const roleKey = pickRoleKey(title);
    const skills = buildSkills(title, skillsSelected);

    const seed = `${fullName}|${email}|${mobile}|${title}|${Date.now()}`;
    const pool = getPointsPool(roleKey);
    const experiencePoints = seededShuffle(unique(pool), seed).slice(0, 6);

    return res.status(200).json({
      fullName,
      email,
      mobile,
      title,
      education: `${qualification || "10th"} | Passout: ${passoutYear || ""}`,
      skills,                 // array
      experiencePoints,       // array
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

function buildSkills(title, selected) {
  const sug = getSkillSuggestions(title);
  const user = Array.isArray(selected) ? selected.filter(Boolean) : [];
  return unique([...user, ...sug]).slice(0, 12);
}

function getSkillSuggestions(jobTitle) {
  const t = (jobTitle || "").toLowerCase();
  if (t.includes("delivery") || t.includes("driver") || t.includes("courier")) {
    return ["Route Planning", "On-Time Delivery", "Navigation (Maps)", "Customer Handling", "Cash Handling (COD)", "Vehicle Safety Check"];
  }
  if (t.includes("mechanic")) {
    return ["Diagnostics", "Vehicle Servicing", "Brakes & Suspension", "Tool Handling", "Safety Compliance", "Quality Checks"];
  }
  if (t.includes("electrician")) {
    return ["Wiring", "Fault Finding", "Tools & Testing", "Installation", "Maintenance", "Safety Procedures"];
  }
  if (t.includes("plumber")) {
    return ["Pipe Fitting", "Leak Fixing", "Installation", "Maintenance", "Tools Handling", "Safety"];
  }
  if (t.includes("security") || t.includes("watchman")) {
    return ["Access Control", "Patrolling", "Incident Reporting", "Visitor Management", "Discipline", "Emergency Handling"];
  }
  if (t.includes("cleaner") || t.includes("housekeeping")) {
    return ["Cleaning SOP", "Hygiene", "Material Handling", "Safety", "Time Management", "Attention to Detail"];
  }
  if (t.includes("sales")) {
    return ["Lead Generation", "Follow-ups", "Negotiation", "Closing", "Customer Handling", "Target Achievement"];
  }
  return ["Communication", "Teamwork", "Time Management", "Problem Solving", "Work Discipline", "Quick Learning"];
}

function pickRoleKey(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("delivery") || t.includes("driver") || t.includes("courier")) return "driver";
  if (t.includes("mechanic")) return "mechanic";
  if (t.includes("electrician")) return "electrician";
  if (t.includes("plumber")) return "plumber";
  if (t.includes("security") || t.includes("watchman")) return "security";
  if (t.includes("cleaner") || t.includes("housekeeping")) return "cleaning";
  if (t.includes("sales")) return "sales";
  return "generic";
}

function getPointsPool(roleKey) {
  const pools = {
    driver: [
      "Delivered orders on time by planning routes efficiently and minimizing delays",
      "Followed delivery SOPs, verified items, and ensured correct handover to customers",
      "Used navigation tools effectively and maintained strong area knowledge",
      "Handled COD/receipts responsibly and maintained basic delivery records",
      "Maintained vehicle safety checks (fuel, tyres, brakes) to avoid breakdowns",
      "Communicated clearly with customers for address confirmation and smooth delivery",
      "Maintained disciplined schedule and completed daily targets consistently",
      "Ensured courteous behavior and improved customer satisfaction during deliveries",
    ],
    mechanic: [
      "Performed preventive maintenance and routine servicing to ensure vehicle safety",
      "Diagnosed issues using systematic inspection and troubleshooting",
      "Executed repair work while following safety and quality standards",
      "Maintained tools, spares, and workshop discipline for smooth operations",
      "Conducted final checks and ensured vehicle readiness before delivery",
      "Documented job work/parts usage and communicated updates professionally",
      "Improved turnaround time by prioritizing urgent jobs and workflow planning",
    ],
    electrician: [
      "Installed and maintained electrical fittings with safety-first approach",
      "Identified faults using testing tools and resolved issues efficiently",
      "Followed wiring standards and ensured proper insulation and connections",
      "Maintained discipline in tools/material handling and worksite safety",
      "Prepared basic documentation and provided clear work updates",
      "Ensured quality checks and minimized rework through careful inspection",
    ],
    plumber: [
      "Installed and repaired pipelines, taps, and fittings with leak-proof finishing",
      "Diagnosed leakage/blockage issues and resolved them efficiently",
      "Followed safety practices and maintained clean worksite after completion",
      "Used tools responsibly and ensured material wastage is minimized",
      "Tested water flow/pressure and ensured quality checks before handover",
      "Communicated clearly with customers regarding work scope and timelines",
    ],
    security: [
      "Maintained access control and verified entries to ensure site security",
      "Performed patrolling and reported incidents with alertness and discipline",
      "Handled visitor management and maintained log registers accurately",
      "Followed SOPs for emergencies and coordinated with relevant staff",
      "Maintained professional behavior and ensured rule compliance",
      "Kept strong observation and prevented unauthorized activities proactively",
    ],
    cleaning: [
      "Maintained cleanliness as per SOP with strong hygiene standards",
      "Used cleaning materials safely and ensured proper storage after use",
      "Completed tasks on time by planning daily cleaning schedule efficiently",
      "Maintained attention to detail in high-touch and critical areas",
      "Followed safety guidelines and ensured hazard-free environment",
      "Supported team coordination for large-area cleaning requirements",
    ],
    sales: [
      "Generated and qualified leads consistently to build a strong pipeline",
      "Maintained structured follow-ups to improve conversions and closure rates",
      "Handled objections professionally and communicated product value clearly",
      "Worked towards targets with daily planning and disciplined execution",
      "Maintained customer relationships to increase repeat and referral business",
      "Updated records/CRM and ensured pipeline visibility with accountability",
    ],
    generic: [
      "Delivered tasks with discipline, accuracy, and strong ownership mindset",
      "Maintained professional communication and timely updates to stakeholders",
      "Followed SOPs and ensured consistent quality in daily work",
      "Improved efficiency by organizing priorities and workflow planning",
      "Worked collaboratively with team members to meet targets and deadlines",
      "Demonstrated punctuality, reliability, and continuous learning attitude",
    ],
  };

  return pools[roleKey] || pools.generic;
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
