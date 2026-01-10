export const config = {
  api: { bodyParser: { sizeLimit: "2mb" } },
};

export default function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const b = req.body || {};
    const fullName = (b.fullName || "").trim();
    const email = (b.email || "").trim();
    const mobile = (b.mobile || "").trim();

    if (!fullName || !email || !mobile) {
      return res.status(400).json({ error: "Name/Email/Mobile required" });
    }

    const title = (b.jobTitle || "Professional").trim();
    const roleKey = pickRoleKey(title);

    const education = `${b.qualification || "10th"} | Passout: ${b.passoutYear || ""}`;

    const skills = unique([
      ...(Array.isArray(b.skillsSelected) ? b.skillsSelected : []),
      ...getSkillSuggestions(title),
    ]).slice(0, 14);

    const certifications = unique([
      ...(Array.isArray(b.certificationsSelected) ? b.certificationsSelected : []),
      ...getCertSuggestions(roleKey),
    ]).slice(0, 10);

    const meta = {
      city: (b.city || "").trim(),
      state: (b.state || "").trim(),
      pincode: (b.pincode || "").trim(),
      languages: Array.isArray(b.languages) ? b.languages : [],
      availability: (b.availability || "").trim(),
      licenseId: (b.licenseId || "").trim(),
      expType: b.expType || "Fresher",
      companies: Array.isArray(b.companies) ? b.companies : [],
    };

    // ✅ Summary job-specific
    const summary = buildSummary({ roleKey, title, expType: meta.expType });

    // ✅ Experience highlights: always unique (seeded shuffle)
    const seed = `${fullName}|${email}|${mobile}|${title}|${Date.now()}`;
    const experiencePoints = seededShuffle(unique(getHighlightsPool(roleKey)), seed).slice(0, 6);

    // ✅ If Experienced: per company responsibilities (3–5 unique each)
    const companyResponsibilities =
      meta.expType === "Experienced"
        ? (meta.companies || []).map((c, idx) => {
            const seed2 = `${seed}|company${idx}|${c.companyName || ""}|${c.startDate || ""}|${c.endDate || ""}`;
            return {
              companyName: (c.companyName || "").trim(),
              location: (c.location || "").trim(),
              startDate: c.startDate || "",
              endDate: c.endDate || "",
              teamSize: (c.teamSize || "").trim(),
              points: seededShuffle(unique(getCompanyPointsPool(roleKey)), seed2).slice(0, 4),
            };
          })
        : [];

    return res.status(200).json({
      fullName,
      email,
      mobile,
      title,
      summary,
      education,
      skills,
      certifications,
      meta,
      experiencePoints,
      companyResponsibilities,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

/** =========================
 *  Role mapping
 *  ========================= */

function pickRoleKey(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("security") || t.includes("watchman") || t.includes("bouncer")) return "security";
  if (t.includes("delivery")) return "delivery";
  if (t.includes("driver") || t.includes("courier") || t.includes("rider")) return "driver";
  if (t.includes("mechanic")) return "mechanic";
  if (t.includes("electrician")) return "electrician";
  if (t.includes("plumber")) return "plumber";
  if (t.includes("housekeeping") || t.includes("cleaner")) return "housekeeping";
  if (t.includes("sales") || t.includes("telecaller") || t.includes("call center")) return "sales";
  if (t.includes("data entry") || t.includes("back office") || t.includes("billing") || t.includes("account")) return "office";
  return "generic";
}

function getSkillSuggestions(jobTitle) {
  const t = (jobTitle || "").toLowerCase();
  if (t.includes("security") || t.includes("watchman") || t.includes("bouncer")) {
    return ["Access Control", "Patrolling", "Incident Reporting", "Visitor Management", "Emergency Handling", "Discipline"];
  }
  if (t.includes("delivery")) {
    return ["On-Time Delivery", "Route Planning", "Navigation (Maps)", "Customer Handling", "Order Verification", "Cash Handling (COD)"];
  }
  if (t.includes("driver") || t.includes("courier") || t.includes("rider")) {
    return ["Safe Driving", "Route Planning", "Navigation (Maps)", "Vehicle Safety Checks", "Time Management", "Customer Handling"];
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
  if (t.includes("housekeeping") || t.includes("cleaner")) {
    return ["Cleaning SOP", "Hygiene", "Material Handling", "Time Management", "Safety", "Attention to Detail"];
  }
  if (t.includes("sales") || t.includes("telecaller") || t.includes("call center")) {
    return ["Lead Generation", "Follow-ups", "Negotiation", "Communication", "Customer Handling", "Target Achievement"];
  }
  if (t.includes("data entry") || t.includes("back office") || t.includes("billing") || t.includes("account")) {
    return ["MS Excel", "Data Accuracy", "Documentation", "Reporting", "Invoice/Billing", "Communication"];
  }
  return ["Communication", "Teamwork", "Time Management", "Problem Solving", "Work Discipline", "Quick Learning"];
}

function getCertSuggestions(roleKey) {
  const map = {
    security: ["CCTV Training", "Fire Safety", "First Aid", "Security Guard Training"],
    driver: ["Driving License", "Road Safety Training", "First Aid"],
    delivery: ["Road Safety Training", "GPS/Maps Training", "First Aid"],
    mechanic: ["ITI Certificate", "Safety Training", "Tool Handling Training"],
    electrician: ["Safety Training", "Wiring & Installation Certificate"],
    plumber: ["Safety Training", "Plumbing Certificate"],
    housekeeping: ["Hygiene Training", "Housekeeping SOP Training"],
    sales: ["Sales Training", "Customer Handling Training"],
    office: ["MS Office Certificate", "Communication Training"],
    generic: [],
  };
  return map[roleKey] || [];
}

function buildSummary({ roleKey, title, expType }) {
  const base = {
    security:
      `Disciplined ${title} with strong focus on safety, access control, and incident reporting. ` +
      `Experienced in following SOPs, maintaining registers, and ensuring secure premises. ` +
      `Seeking a stable role to deliver reliable security support and professional conduct.`,
    driver:
      `Responsible ${title} with focus on safe driving, punctuality, and route planning. ` +
      `Skilled in navigation, customer communication, and vehicle safety checks. ` +
      `Seeking an opportunity to deliver consistent performance and on-time service.`,
    delivery:
      `Reliable ${title} focused on on-time deliveries, order verification, and customer satisfaction. ` +
      `Comfortable with navigation tools, COD handling, and delivery SOP compliance. ` +
      `Looking to contribute with disciplined execution and daily target completion.`,
    mechanic:
      `Hands-on ${title} with strong troubleshooting and preventive maintenance approach. ` +
      `Experienced in safe repair practices, diagnostics, and quality checks. ` +
      `Seeking an opportunity to reduce breakdowns and improve service turnaround.`,
    electrician:
      `Safety-focused ${title} skilled in wiring, fault finding, installation, and maintenance. ` +
      `Experienced with tools/testing and quality inspection to minimize rework. ` +
      `Looking to support reliable electrical operations with discipline and accuracy.`,
    plumber:
      `Detail-oriented ${title} skilled in pipe fitting, leakage resolution, and installation work. ` +
      `Strong focus on safety, clean finishing, and timely completion. ` +
      `Seeking a role to deliver quality plumbing support and customer satisfaction.`,
    housekeeping:
      `Hardworking ${title} with strong hygiene standards and SOP-based cleaning practices. ` +
      `Focused on safety, time management, and attention to detail in critical areas. ` +
      `Looking to maintain a clean, organized environment with consistent performance.`,
    sales:
      `Target-driven ${title} with strong communication, follow-ups, and customer handling skills. ` +
      `Experienced in lead generation, negotiation, and disciplined pipeline management. ` +
      `Seeking an opportunity to grow revenue through consistent execution.`,
    office:
      `Organized ${title} skilled in documentation, reporting, and accuracy-driven data handling. ` +
      `Comfortable with MS Excel, billing/support tasks, and professional communication. ` +
      `Looking to contribute with reliability, structure, and timely delivery.`,
    generic:
      `Results-focused ${title} with disciplined work ethic and strong learning mindset. ` +
      `Known for reliability, teamwork, and consistent task completion. ` +
      `Seeking an opportunity to contribute to growth with professional execution.`,
  };

  let s = base[roleKey] || base.generic;
  if (expType === "Fresher") {
    s =
      s +
      " Fresher-friendly profile with strong willingness to learn, follow instructions, and deliver quality output from day one.";
  }
  return s;
}

/** =========================
 *  Points pools
 *  ========================= */

function getHighlightsPool(roleKey) {
  const pools = {
    security: [
      "Maintained access control and verified entries to ensure premises security",
      "Performed regular patrolling and reported incidents with alertness and discipline",
      "Handled visitor management and maintained accurate log registers",
      "Followed SOPs for emergencies and coordinated with relevant staff",
      "Ensured rule compliance and professional behavior throughout duty hours",
      "Prevented unauthorized activities through strong observation and vigilance",
      "Maintained clear reporting and supported smooth shift handovers",
      "Improved safety by identifying risks and escalating issues promptly",
    ],
    driver: [
      "Ensured safe and timely transportation while following traffic rules and safety guidelines",
      "Planned routes efficiently to reduce delays and optimize daily schedules",
      "Performed basic vehicle safety checks (fuel/tyres/brakes) to avoid breakdowns",
      "Maintained professional communication with customers and stakeholders",
      "Managed logs/records responsibly and supported timely confirmations",
      "Maintained punctuality and consistently met daily targets",
      "Handled vehicle cleanliness and ensured readiness for trips",
    ],
    delivery: [
      "Delivered orders on time by planning routes efficiently and minimizing delays",
      "Verified items and ensured correct handover while following delivery SOPs",
      "Used navigation tools effectively and maintained strong area knowledge",
      "Handled COD responsibly and maintained basic delivery records",
      "Communicated clearly with customers for address confirmation and smooth delivery",
      "Maintained disciplined schedule and completed daily targets consistently",
      "Ensured courteous behavior and improved customer satisfaction",
    ],
    mechanic: [
      "Performed preventive maintenance and routine servicing to ensure vehicle safety",
      "Diagnosed issues using systematic inspection and troubleshooting approach",
      "Executed repair work while following safety and quality standards",
      "Maintained tools/spares and workshop discipline for smooth operations",
      "Conducted final checks and ensured vehicle readiness before delivery",
      "Improved turnaround time by prioritizing urgent jobs and workflow planning",
      "Documented job work and communicated updates professionally",
    ],
    electrician: [
      "Installed and maintained electrical fittings with safety-first approach",
      "Identified faults using testing tools and resolved issues efficiently",
      "Followed wiring standards and ensured proper insulation and connections",
      "Maintained disciplined tool/material handling and worksite safety",
      "Performed quality checks and minimized rework through careful inspection",
      "Prepared basic documentation and provided clear work updates",
    ],
    plumber: [
      "Installed and repaired pipelines and fittings with leak-proof finishing",
      "Diagnosed leakage/blockage issues and resolved them efficiently",
      "Followed safety practices and maintained clean worksite after completion",
      "Used tools responsibly and minimized material wastage",
      "Tested water flow/pressure and ensured quality checks before handover",
      "Communicated clearly with customers regarding work scope and timelines",
    ],
    housekeeping: [
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
      "Updated records and ensured pipeline visibility with accountability",
    ],
    office: [
      "Maintained accurate records and documentation with strong attention to detail",
      "Prepared reports and supported billing/back-office operations reliably",
      "Ensured data accuracy and timely updates to stakeholders",
      "Managed files, follow-ups, and daily coordination professionally",
      "Improved efficiency by organizing workflow and prioritizing tasks",
      "Maintained professional communication and consistent quality output",
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

function getCompanyPointsPool(roleKey) {
  // per-company responsibilities (3–5) different pool so it doesn't feel repeated
  const pools = {
    security: [
      "Managed entry/exit checks and ensured visitor verification as per policy",
      "Maintained daily registers and supported smooth shift handovers",
      "Performed patrolling rounds and reported suspicious activities promptly",
      "Supported emergency readiness by following fire safety and incident protocols",
      "Coordinated with staff to resolve issues and maintain site discipline",
      "Ensured CCTV awareness and assisted in monitoring when required",
    ],
    driver: [
      "Maintained trip schedule with punctual start times and safe driving practices",
      "Performed pre-trip checks to ensure vehicle readiness and compliance",
      "Used navigation tools to choose fastest routes and avoid delays",
      "Maintained basic trip records and provided timely status updates",
      "Handled customer communication politely and ensured smooth service",
      "Kept vehicle clean and supported basic upkeep routines",
    ],
    delivery: [
      "Verified orders and ensured correct items before dispatch",
      "Delivered parcels within timeline and confirmed proof of delivery",
      "Handled COD responsibly and followed company collection process",
      "Communicated with customers to confirm address and delivery windows",
      "Maintained daily delivery logs and supported route discipline",
      "Followed safety and quality SOPs to avoid wrong deliveries",
    ],
    mechanic: [
      "Conducted systematic diagnostics and identified root causes accurately",
      "Performed repair/servicing while following safety and quality standards",
      "Maintained tool discipline and ensured proper storage after jobs",
      "Completed final checks to ensure vehicle is ready for handover",
      "Coordinated with team to reduce downtime and improve turnaround",
      "Documented parts usage and ensured clean finishing of work",
    ],
    electrician: [
      "Installed and maintained wiring/fittings ensuring insulation and safety",
      "Used testing tools to identify faults and resolve efficiently",
      "Performed preventive checks to reduce future breakdowns",
      "Maintained job documentation and updated stakeholders",
      "Ensured adherence to standards and minimized rework with inspection",
      "Maintained tool discipline and safe worksite practices",
    ],
    plumber: [
      "Installed fittings/pipelines with clean finishing and leak prevention",
      "Diagnosed blockages/leaks and resolved with proper testing",
      "Maintained safety practices and clean worksite after completion",
      "Ensured quality checks on water flow/pressure before handover",
      "Communicated work progress clearly and delivered timely completion",
      "Used tools safely and minimized material wastage",
    ],
    housekeeping: [
      "Executed daily cleaning checklist as per SOP and hygiene standards",
      "Maintained high-touch areas carefully to ensure cleanliness and safety",
      "Handled cleaning materials safely and ensured proper storage",
      "Supported team coordination for deep cleaning and large areas",
      "Reported maintenance issues and ensured hazard-free environment",
      "Completed tasks on time with disciplined routine and quality",
    ],
    sales: [
      "Managed leads and maintained follow-up discipline to improve conversions",
      "Handled customer queries and communicated value confidently",
      "Worked towards targets with structured daily planning",
      "Maintained records and ensured transparency in pipeline status",
      "Supported relationship building for repeat/referral business",
      "Handled objections professionally and improved close rate",
    ],
    office: [
      "Maintained documentation and ensured data accuracy in daily work",
      "Prepared reports and supported billing/back-office operations",
      "Managed follow-ups and coordinated with teams for timely closures",
      "Ensured file handling discipline and record completeness",
      "Communicated updates professionally and supported smooth operations",
      "Improved workflow by organizing tasks and priorities",
    ],
    generic: [
      "Completed assigned tasks accurately while maintaining discipline and quality",
      "Coordinated with team and provided timely updates",
      "Followed SOPs and ensured consistent output standards",
      "Maintained punctuality and reliability in daily responsibilities",
      "Organized workflow to meet deadlines and reduce errors",
      "Demonstrated positive attitude and quick learning mindset",
    ],
  };
  return pools[roleKey] || pools.generic;
}

/** =========================
 *  Utils
 *  ========================= */

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
