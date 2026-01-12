// pages/api/ai-resume.js

export const config = {
  api: { bodyParser: { sizeLimit: "2mb" } },
};

export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const b = req.body || {};
    const fullName = String(b.fullName || "").trim();
    const email = String(b.email || "").trim();
    const mobile = String(b.mobile || "").trim();

    if (!fullName || !email || !mobile) {
      return res.status(400).json({ error: "Name/Email/Mobile required" });
    }

    const jobTitle = String(b.jobTitle || "Professional").trim();
    const roleKey = pickRoleKey(jobTitle);

    // ✅ Education
    const qualification = String(b.qualification || "10th").trim();
    const passoutYear = String(b.passoutYear || "").trim();
    const education = passoutYear ? `${qualification} | Passout: ${passoutYear}` : qualification;

    // ✅ Address / Location (FULL street allowed)
    const fullAddress = String(b.fullAddress || "").trim();
    const city = String(b.city || "").trim();
    const state = String(b.state || "").trim();
    const pincode = String(b.pincode || "").trim();

    // ✅ Languages
    const languages = Array.isArray(b.languages) ? b.languages.map(String).map((x) => x.trim()).filter(Boolean) : [];

    // ✅ Experience
    const expType = b.expType === "Experienced" ? "Experienced" : "Fresher";
    const companiesIn = Array.isArray(b.companies) ? b.companies : [];

    // ✅ Role-safe skills (NO cross-role contamination)
    const suggestedSkills = getRoleSkills(jobTitle);
    const selectedSkills = Array.isArray(b.skillsSelected)
      ? b.skillsSelected.map(String).map((x) => x.trim()).filter(Boolean)
      : [];

    // Only keep selected skills that match suggested skills (role-safe)
    const safeSelected = selectedSkills.filter((s) => suggestedSkills.includes(s));
    const skills = unique([...safeSelected, ...suggestedSkills]).slice(0, 14);

    // ✅ Summary (job specific)
    const summary = buildSummary({ roleKey, title: jobTitle, expType });

    // ✅ Unique points (no repetition)
    const seedBase = `${fullName}|${email}|${mobile}|${jobTitle}|${Date.now()}`;

    // Highlights pool is different from company pool
    const highlightsPool = unique(getHighlightsPool(roleKey));
    const experiencePoints = seededShuffle(highlightsPool, seedBase).slice(0, 6);

    // Company responsibilities (only if Experienced)
    const companyResponsibilities =
      expType === "Experienced"
        ? companiesIn
            .slice(0, 6)
            .map((c, idx) => {
              const companyName = String(c?.companyName || "").trim();
              const location = String(c?.location || "").trim();
              const startDate = String(c?.startDate || "").trim();
              const endDate = String(c?.endDate || "").trim();

              const seed2 = `${seedBase}|company${idx}|${companyName}|${startDate}|${endDate}`;
              const pool = unique(getCompanyPointsPool(roleKey));

              // avoid overlap with highlights (extra safety)
              const poolNoOverlap = pool.filter((p) => !experiencePoints.includes(p));

              return {
                companyName,
                location,
                startDate,
                endDate,
                points: seededShuffle(poolNoOverlap, seed2).slice(0, 5), // 5 strong points
              };
            })
        : [];

    return res.status(200).json({
      fullName,
      email,
      mobile,
      title: jobTitle,
      summary,
      education,
      skills,
      meta: {
        fullAddress,
        city,
        state,
        pincode,
        languages,
        expType,
      },
      experiencePoints,
      companyResponsibilities,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

/* =========================
   ROLE + SKILLS (STRICT)
   ========================= */

function pickRoleKey(title) {
  const t = (title || "").toLowerCase();

  // Tech
  if (t.includes("frontend") || t.includes("backend") || t.includes("full stack") || t.includes("developer")) return "tech";
  if (t.includes("seo") || t.includes("digital marketing") || t.includes("marketing")) return "marketing";

  // Sales / Support / Office
  if (t.includes("sales") || t.includes("telecaller") || t.includes("call center") || t.includes("customer support")) return "sales";
  if (t.includes("data entry") || t.includes("back office") || t.includes("billing") || t.includes("account") || t.includes("receptionist")) return "office";

  // Blue collar
  if (t.includes("security") || t.includes("watchman") || t.includes("bouncer")) return "security";
  if (t.includes("delivery")) return "delivery";
  if (t.includes("driver") || t.includes("courier") || t.includes("rider")) return "driver";
  if (t.includes("mechanic")) return "mechanic";
  if (t.includes("electrician")) return "electrician";
  if (t.includes("plumber")) return "plumber";
  if (t.includes("housekeeping") || t.includes("cleaner")) return "housekeeping";

  return "generic";
}

// ✅ Strict skills generator: exact role → role skills (no mixing)
function getRoleSkills(jobTitle) {
  const roleKey = pickRoleKey(jobTitle);

  const map = {
    sales: [
      "Lead Generation",
      "Customer Handling",
      "Follow-ups",
      "Negotiation",
      "Target Achievement",
      "Relationship Building",
      "Pipeline Management",
      "Communication",
    ],
    office: [
      "MS Excel",
      "Data Accuracy",
      "Documentation",
      "Reporting",
      "Invoice/Billing",
      "Email & Coordination",
      "Record Management",
      "Communication",
    ],
    security: [
      "Access Control",
      "Patrolling",
      "Incident Reporting",
      "Visitor Management",
      "Emergency Handling",
      "Discipline",
      "Observation Skills",
      "Night Duty Readiness",
    ],
    driver: [
      "Safe Driving",
      "Route Planning",
      "Navigation (Maps)",
      "Vehicle Safety Checks",
      "Time Management",
      "Customer Coordination",
      "Trip Logs",
      "Punctuality",
    ],
    delivery: [
      "On-Time Delivery",
      "Route Planning",
      "Navigation (Maps)",
      "Order Verification",
      "Customer Communication",
      "COD Handling",
      "Area Knowledge",
      "Daily Targets",
    ],
    mechanic: [
      "Vehicle Diagnostics",
      "Servicing & Repair",
      "Tool Handling",
      "Safety Compliance",
      "Quality Checks",
      "Problem Solving",
      "Preventive Maintenance",
      "Workshop Discipline",
    ],
    electrician: [
      "Wiring",
      "Fault Finding",
      "Installation",
      "Maintenance",
      "Tools & Testing",
      "Safety Procedures",
      "Load Checking",
      "Earthing & Protection",
    ],
    plumber: [
      "Pipe Fitting",
      "Leak Fixing",
      "Installation",
      "Maintenance",
      "Tools Handling",
      "Safety",
      "Blockage Removal",
      "Testing & Finishing",
    ],
    housekeeping: [
      "Cleaning SOP",
      "Hygiene",
      "Material Handling",
      "Time Management",
      "Safety",
      "Attention to Detail",
      "Waste Handling",
      "Surface Sanitization",
    ],
    tech: [
      "HTML/CSS",
      "JavaScript",
      "React/Next.js",
      "API Integration",
      "Debugging",
      "Git",
      "Responsive UI",
      "Problem Solving",
    ],
    marketing: [
      "SEO Basics",
      "Social Media",
      "Content Writing",
      "Campaign Support",
      "Analytics Basics",
      "Lead Handling",
      "Communication",
      "Reporting",
    ],
    generic: ["Communication", "Teamwork", "Time Management", "Work Discipline", "Problem Solving", "Reliability"],
  };

  // Return only from role bucket (no merge)
  const arr = map[roleKey] || map.generic;
  return unique(arr).slice(0, 10);
}

/* =========================
   SUMMARY + POINTS
   ========================= */

function buildSummary({ roleKey, title, expType }) {
  const base = {
    sales:
      `Target-driven ${title} with strong communication, follow-ups, and customer handling skills. ` +
      `Experienced in lead generation, negotiation, and disciplined pipeline management. ` +
      `Seeking an opportunity to grow revenue through consistent execution.`,
    office:
      `Organized ${title} skilled in documentation, reporting, and accuracy-driven data handling. ` +
      `Comfortable with MS Excel and coordination tasks with strong attention to detail. ` +
      `Looking to contribute with reliability and timely delivery.`,
    security:
      `Disciplined ${title} with strong focus on safety, access control, and incident reporting. ` +
      `Experienced in SOP compliance, patrolling routines, and maintaining registers. ` +
      `Seeking a stable role to deliver reliable security support.`,
    driver:
      `Responsible ${title} focused on safe driving, punctuality, and route planning. ` +
      `Skilled in navigation and vehicle safety checks to ensure smooth trips. ` +
      `Seeking an opportunity to deliver consistent on-time service.`,
    delivery:
      `Reliable ${title} focused on on-time deliveries, order verification, and customer satisfaction. ` +
      `Comfortable with navigation tools and delivery discipline to meet daily targets. ` +
      `Looking to contribute with consistent performance.`,
    mechanic:
      `Hands-on ${title} with strong troubleshooting and preventive maintenance approach. ` +
      `Experienced in safe repair practices and quality checks to reduce rework. ` +
      `Seeking an opportunity to improve service turnaround.`,
    electrician:
      `Safety-focused ${title} skilled in wiring, fault finding, installation, and maintenance. ` +
      `Experienced with tools/testing and careful inspection to minimize breakdowns. ` +
      `Looking to support reliable electrical operations.`,
    plumber:
      `Detail-oriented ${title} skilled in pipe fitting, leakage resolution, and installation work. ` +
      `Strong focus on clean finishing, safety, and timely completion. ` +
      `Seeking a role to deliver quality plumbing support.`,
    housekeeping:
      `Hardworking ${title} with strong hygiene standards and SOP-based cleaning practices. ` +
      `Focused on safety, time management, and attention to detail in critical areas. ` +
      `Looking to maintain a clean, organized environment.`,
    tech:
      `Results-driven ${title} with strong problem-solving and clean code practices. ` +
      `Comfortable with modern web development workflows and collaboration. ` +
      `Seeking an opportunity to build reliable products with quality.`,
    marketing:
      `Detail-oriented ${title} with interest in performance-driven marketing and content execution. ` +
      `Comfortable with reporting, coordination, and campaign support tasks. ` +
      `Seeking to contribute with consistency and learning mindset.`,
    generic:
      `Results-focused ${title} with disciplined work ethic and strong learning mindset. ` +
      `Known for reliability, teamwork, and consistent task completion. ` +
      `Seeking an opportunity to contribute to growth with professional execution.`,
  };

  let s = base[roleKey] || base.generic;

  if (expType === "Fresher") {
    s += " Fresher-friendly profile with strong willingness to learn and deliver quality output from day one.";
  }
  return s;
}

function getHighlightsPool(roleKey) {
  const pools = {
    sales: [
      "Achieved daily and monthly targets through disciplined follow-ups and planning",
      "Improved conversions by handling objections confidently and clearly",
      "Maintained accurate pipeline updates for better forecast visibility",
      "Strengthened customer relationships to increase repeat business",
      "Generated quality leads using structured outreach and referral methods",
      "Ensured professional communication and product pitching consistency",
      "Coordinated with teams for smooth documentation and quick closures",
      "Focused on customer satisfaction and timely resolution of queries",
    ],
    office: [
      "Maintained accurate documentation and records with strong attention to detail",
      "Prepared reports and ensured timely updates to stakeholders",
      "Supported billing/back-office workflow with disciplined coordination",
      "Improved efficiency by organizing tasks and prioritizing deadlines",
      "Ensured data accuracy to minimize errors and rework",
      "Handled communication and follow-ups professionally",
      "Managed files and registers to keep operations smooth",
    ],
    security: [
      "Maintained access control and verified entries as per policy",
      "Performed patrolling rounds and reported incidents promptly",
      "Handled visitor management and maintained accurate registers",
      "Followed SOPs for emergencies and coordinated with staff",
      "Ensured discipline and compliance during duty hours",
      "Supported smooth shift handovers with clear reporting",
    ],
    driver: [
      "Ensured safe and timely transportation while following traffic rules",
      "Planned routes efficiently to reduce delays and optimize schedules",
      "Performed basic vehicle checks to avoid breakdowns",
      "Maintained punctuality and consistently met daily commitments",
      "Handled customer coordination politely and professionally",
      "Maintained trip records and provided timely status updates",
    ],
    delivery: [
      "Delivered orders on time by planning routes efficiently",
      "Verified items and ensured correct handover as per SOP",
      "Handled COD responsibly and maintained delivery discipline",
      "Communicated clearly with customers for smooth delivery",
      "Completed daily targets with consistent punctuality",
      "Used navigation tools effectively and maintained area knowledge",
    ],
    mechanic: [
      "Diagnosed issues using systematic troubleshooting approach",
      "Performed servicing and repairs with safety and quality focus",
      "Conducted final checks to ensure readiness before handover",
      "Maintained tool discipline and clean workshop practices",
      "Improved turnaround time by prioritizing urgent jobs",
      "Reduced repeat issues with careful inspection and testing",
    ],
    electrician: [
      "Installed and maintained fittings with safety-first approach",
      "Identified faults using testing tools and resolved efficiently",
      "Followed wiring standards to ensure proper insulation",
      "Performed quality checks to minimize rework",
      "Maintained disciplined tool and material handling",
      "Ensured safe worksite practices and proper finishing",
    ],
    plumber: [
      "Installed and repaired pipelines with leak-proof finishing",
      "Resolved leakage and blockage issues with proper testing",
      "Maintained clean worksite and safety compliance",
      "Ensured quality checks on water flow and pressure",
      "Delivered timely completion with clear communication",
      "Minimized wastage through disciplined material usage",
    ],
    housekeeping: [
      "Maintained cleanliness as per SOP with strong hygiene standards",
      "Completed tasks on time by planning daily cleaning routines",
      "Maintained attention to detail in high-touch areas",
      "Followed safety guidelines to ensure hazard-free environment",
      "Used materials safely and ensured proper storage after use",
      "Supported team coordination for deep cleaning tasks",
    ],
    tech: [
      "Built responsive UI with clean components and reusable patterns",
      "Integrated APIs and handled edge cases with stable error handling",
      "Improved performance through optimized rendering and code structure",
      "Collaborated using Git workflows and code review discipline",
      "Debugged issues and delivered reliable fixes on time",
      "Maintained clean structure and readable code conventions",
    ],
    marketing: [
      "Supported campaign execution with consistent daily follow-ups",
      "Improved reporting and tracking accuracy for better visibility",
      "Assisted in content and posting schedules with discipline",
      "Handled lead coordination and basic qualification steps",
      "Maintained communication and timely updates to stakeholders",
      "Focused on learning and improving performance continuously",
    ],
    generic: [
      "Delivered tasks with discipline, accuracy, and strong ownership mindset",
      "Maintained professional communication and timely updates",
      "Worked collaboratively to meet targets and deadlines",
      "Followed SOPs and ensured consistent quality output",
      "Improved efficiency by organizing priorities and workflow planning",
      "Demonstrated punctuality, reliability, and quick learning attitude",
    ],
  };

  return pools[roleKey] || pools.generic;
}

function getCompanyPointsPool(roleKey) {
  const pools = {
    sales: [
      "Managed daily calls/meetings and maintained consistent follow-up discipline",
      "Generated and qualified leads to build a healthy sales pipeline",
      "Converted prospects by explaining product benefits clearly",
      "Maintained customer records and ensured timely documentation",
      "Handled objections professionally to improve close rates",
      "Supported relationship building to increase repeat/referral business",
      "Ensured target tracking and daily planning to maintain performance",
    ],
    office: [
      "Updated records and ensured accuracy in daily entries",
      "Prepared basic reports and shared updates with stakeholders",
      "Managed files and documentation for smooth operations",
      "Coordinated with teams for timely task completion",
      "Ensured billing/support tasks were completed without delays",
      "Maintained process discipline and reduced manual errors",
    ],
    security: [
      "Managed entry/exit checks and visitor verification as per policy",
      "Performed patrol rounds and reported suspicious activities",
      "Maintained registers and supported shift handover routines",
      "Ensured discipline and compliance at site during duty hours",
      "Supported emergency readiness and incident protocols",
      "Coordinated with staff for smooth site operations",
    ],
    driver: [
      "Maintained trip schedule with punctual start times and safe driving",
      "Performed pre-trip checks to ensure vehicle readiness",
      "Used navigation tools to avoid delays and optimize routes",
      "Maintained logs and provided status updates on time",
      "Handled customer coordination politely and professionally",
      "Kept vehicle clean and supported basic upkeep routines",
    ],
    delivery: [
      "Verified orders before dispatch to avoid wrong deliveries",
      "Delivered parcels within timeline and confirmed proof of delivery",
      "Handled COD responsibly and followed collection process",
      "Communicated with customers for address confirmation",
      "Maintained delivery logs and route discipline daily",
      "Followed safety and quality SOPs consistently",
    ],
    mechanic: [
      "Conducted diagnostics and identified root causes accurately",
      "Performed repairs/servicing with safety and quality standards",
      "Completed final checks to ensure readiness before handover",
      "Maintained tool discipline and clean finishing",
      "Coordinated with team to reduce downtime and improve turnaround",
      "Documented parts usage and job updates properly",
    ],
    electrician: [
      "Installed wiring/fittings ensuring insulation and safety",
      "Used testing tools to identify faults and fix efficiently",
      "Performed preventive checks to reduce breakdowns",
      "Maintained documentation and shared work updates",
      "Ensured standards compliance and minimized rework",
      "Maintained safe worksite practices consistently",
    ],
    plumber: [
      "Installed pipelines/fittings with clean finishing and leak prevention",
      "Resolved blockages/leaks with proper testing and checks",
      "Maintained safety practices and clean worksite after completion",
      "Ensured flow/pressure testing before handover",
      "Communicated timelines and progress clearly",
      "Used tools safely and minimized material wastage",
    ],
    housekeeping: [
      "Executed daily checklist as per SOP and hygiene standards",
      "Maintained high-touch areas carefully for sanitation",
      "Handled materials safely and ensured proper storage",
      "Supported deep cleaning and large-area tasks with team",
      "Reported issues and maintained hazard-free environment",
      "Completed tasks on time with consistent quality",
    ],
    tech: [
      "Implemented features with clean components and stable state management",
      "Handled API integration and error states gracefully",
      "Improved UI performance using optimized rendering patterns",
      "Fixed bugs with structured debugging and testing mindset",
      "Worked with Git workflow and maintained code discipline",
      "Ensured responsive design across devices",
    ],
    marketing: [
      "Managed daily coordination and follow-ups for campaign tasks",
      "Prepared updates and maintained tracking sheets accurately",
      "Assisted in content planning and posting schedule execution",
      "Supported lead handling and basic qualification steps",
      "Maintained communication and timely reporting",
      "Improved consistency with disciplined daily routines",
    ],
    generic: [
      "Completed assigned tasks accurately while maintaining discipline",
      "Coordinated with team and provided timely updates",
      "Followed SOPs and ensured consistent output standards",
      "Maintained punctuality and reliability in daily responsibilities",
      "Organized workflow to meet deadlines and reduce errors",
      "Demonstrated positive attitude and quick learning mindset",
    ],
  };

  return pools[roleKey] || pools.generic;
}

/* =========================
   UTILS
   ========================= */

function unique(arr) {
  return [...new Set((arr || []).filter(Boolean))];
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
