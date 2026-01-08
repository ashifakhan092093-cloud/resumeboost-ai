export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const {
      fullName,
      jobTitle,
      expYears,
      skills,
      highestQualification,
      fieldOfStudy,
      graduationYear,
      companyName,
      experienceDetails,
    } = req.body || {};

    if (!fullName) return res.status(400).json({ error: "fullName required" });

    const title = (jobTitle || "").trim() || "Professional Executive";

    const education = buildEducation({ highestQualification, fieldOfStudy, graduationYear });

    const summary =
      `Results-driven ${title} with strong communication and organizational skills. ` +
      `Known for delivering quality work on time and adapting in fast-paced environments.`;

    const finalSkills = buildSkills(title, skills);

    const experience = buildExperience({ title, expYears, companyName, experienceDetails });

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

function buildEducation({ highestQualification, fieldOfStudy, graduationYear }) {
  const q = (highestQualification || "").trim();
  const f = (fieldOfStudy || "").trim();
  const y = (graduationYear || "").trim();
  if (!q && !f && !y) return "Bachelor’s Degree / Equivalent Qualification";
  const left = [q || "Bachelor’s Degree", f ? `– ${f}` : ""].join(" ").trim();
  const right = y ? `Year: ${y}` : "";
  return [left, right].filter(Boolean).join(" | ");
}

function buildSkills(title, skillsRaw) {
  const user = splitSkills(skillsRaw || "");
  const base = ["Communication", "Teamwork", "Problem Solving", "Time Management"];

  const t = (title || "").toLowerCase();
  let role = [];
  if (t.includes("mechanic")) role = ["Vehicle Maintenance", "Diagnostics", "Engine Repair", "Tool Handling"];
  else if (t.includes("sales")) role = ["Client Handling", "Lead Generation", "Follow-ups", "Negotiation"];
  else if (t.includes("developer")) role = ["JavaScript", "Git", "Debugging", "APIs"];

  return unique([...user, ...role, ...base]).slice(0, 14).join(", ");
}

function buildExperience({ title, expYears, companyName, experienceDetails }) {
  const comp = (companyName || "").trim();
  const details = (experienceDetails || "").trim();

  if (details) {
    return details
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith("•") ? l : `• ${l}`))
      .slice(0, 10)
      .join("\n");
  }

  const yearsNum = parseInt((expYears || "").toString().trim(), 10);
  const hasExp = !Number.isNaN(yearsNum) && yearsNum > 0;

  return hasExp
    ? `• Worked as ${title}${comp ? ` at ${comp}` : ""}\n• Maintained quality, safety and timely completion\n• Coordinated with team and handled responsibilities professionally`
    : `• Assisted as ${title}${comp ? ` at ${comp}` : ""}\n• Supported daily tasks and learned processes quickly\n• Maintained discipline and punctuality`;
}

function splitSkills(text) {
  return (text || "").split(/,|\n/).map((x) => x.trim()).filter(Boolean);
}
function unique(arr) {
  return [...new Set(arr)];
}
