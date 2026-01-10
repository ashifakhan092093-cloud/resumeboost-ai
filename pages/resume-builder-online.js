import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

/** =========================
 *  DATA (A–Z friendly)
 *  ========================= */

const QUALIFICATIONS = [
  "10th",
  "12th",
  "ITI",
  "Diploma",
  "Graduation (UG)",
  "Post Graduation (PG)",
];

const LANGUAGES = ["Hindi", "English", "Marathi", "Urdu", "Tamil", "Telugu", "Gujarati", "Kannada"];

const SHIFTS = [
  "Day Shift",
  "Night Shift",
  "Rotational Shift",
  "Immediate Join",
  "15 Days Notice",
  "30 Days Notice",
];

const CERTS_BY_ROLE = {
  security: ["CCTV Training", "Fire Safety", "First Aid", "Security Guard Training"],
  driver: ["Driving License", "Road Safety Training", "First Aid"],
  delivery: ["Road Safety Training", "GPS/Maps Training", "First Aid"],
  mechanic: ["ITI Certificate", "Safety Training", "Tool Handling Training"],
  electrician: ["Safety Training", "Wiring & Installation Certificate"],
  plumber: ["Safety Training", "Plumbing Certificate"],
  housekeeping: ["Hygiene Training", "Housekeeping SOP Training"],
  sales: ["Sales Training", "Customer Handling Training"],
  office: ["MS Office Certificate", "Communication Training"],
};

// 🔥 Expanded small + common jobs (add more anytime)
const JOB_TITLES = [
  // Small / local
  "Delivery Driver",
  "Driver",
  "Auto Rickshaw Driver",
  "Bike Rider",
  "Delivery Boy",
  "Courier Executive",
  "Security Guard",
  "Watchman",
  "Bouncer'S",
  "Housekeeping Staff",
  "Cleaner",
  "Office Boy",
  "Peon",
  "Helper",
  "Warehouse Helper",
  "Kitchen Helper",
  "Cook",
  "Chef",
  "Waiter",
  "Barber",
  "Tailor",
  "Painter",
  "Welder",
  "Machine Operator",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Mechanic",
  "Bike Mechanic",
  "Car Mechanic",

  // Office / support
  "Receptionist",
  "Data Entry Operator",
  "Computer Operator",
  "Back Office Executive",
  "Billing Executive",
  "Account Assistant",
  "Accountant",
  "Store Executive",
  "Store Helper",
  "Customer Support Executive",
  "Call Center Executive",
  "Telecaller",
  "Field Executive",
  "Sales Executive",
  "Sales Representative",

  // Tech / digital
  "SEO Executive",
  "Digital Marketing Executive",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Web Developer",
];

const YEARS = (() => {
  const now = new Date().getFullYear();
  return Array.from({ length: 60 }, (_, i) => String(now - i));
})();

/** =========================
 *  ROLE HELPERS (front)
 *  ========================= */

function roleKeyFromTitle(title) {
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

const ROLE_SKILLS = [
  { k: ["security", "watchman", "bouncer"], s: ["Access Control", "Patrolling", "Incident Reporting", "Visitor Management", "Emergency Handling", "Discipline"] },
  { k: ["delivery"], s: ["On-Time Delivery", "Route Planning", "Navigation (Maps)", "Customer Handling", "Order Verification", "Cash Handling (COD)"] },
  { k: ["driver", "courier", "rider"], s: ["Safe Driving", "Route Planning", "Navigation (Maps)", "Vehicle Safety Checks", "Time Management", "Customer Handling"] },
  { k: ["mechanic"], s: ["Diagnostics", "Vehicle Servicing", "Engine Basics", "Brakes & Suspension", "Tool Handling", "Safety Compliance"] },
  { k: ["electrician"], s: ["Wiring", "Fault Finding", "Installation", "Maintenance", "Tools & Testing", "Safety Procedures"] },
  { k: ["plumber"], s: ["Pipe Fitting", "Leak Fixing", "Installation", "Maintenance", "Tools Handling", "Safety"] },
  { k: ["housekeeping", "cleaner"], s: ["Cleaning SOP", "Hygiene", "Material Handling", "Time Management", "Safety", "Attention to Detail"] },
  { k: ["sales", "telecaller", "call center"], s: ["Lead Generation", "Follow-ups", "Negotiation", "Communication", "Customer Handling", "Target Achievement"] },
  { k: ["data entry", "back office", "billing", "account"], s: ["MS Excel", "Data Accuracy", "Documentation", "Reporting", "Invoice/Billing", "Communication"] },
];

function pickSkills(jobTitle) {
  const t = (jobTitle || "").toLowerCase();
  for (const r of ROLE_SKILLS) if (r.k.some((x) => t.includes(x))) return r.s;
  return ["Communication", "Teamwork", "Time Management", "Problem Solving", "Work Discipline", "Quick Learning"];
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function toggleMulti(item, list, setList) {
  setList((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
}

export default function ResumeBuilderOnline() {
  // Required
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Profile extras
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  const [languages, setLanguages] = useState([]);
  const [availability, setAvailability] = useState("");
  const [licenseId, setLicenseId] = useState("");

  // Education
  const [qualification, setQualification] = useState("10th");
  const [passoutYear, setPassoutYear] = useState(YEARS[0]);

  // Experience
  const [expType, setExpType] = useState("Fresher"); // Fresher | Experienced
  const [companiesCount, setCompaniesCount] = useState(1);
  const [companies, setCompanies] = useState([
    { companyName: "", location: "", startDate: "", endDate: "", teamSize: "" },
  ]);

  // Role
  const [jobTitle, setJobTitle] = useState("Security Guard");

  // Skills (role-based suggestions)
  const suggestedSkills = useMemo(() => pickSkills(jobTitle), [jobTitle]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Certifications (role-based suggestions + manual)
  const roleKey = useMemo(() => roleKeyFromTitle(jobTitle), [jobTitle]);
  const suggestedCerts = useMemo(() => CERTS_BY_ROLE[roleKey] || [], [roleKey]);
  const [certifications, setCertifications] = useState([]);

  // Output
  const [generated, setGenerated] = useState(null);
  const [building, setBuilding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const requiredOk = fullName.trim() && email.trim() && mobile.trim();

  function setCompaniesByCount(n) {
    setCompaniesCount(n);
    setCompanies((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ companyName: "", location: "", startDate: "", endDate: "", teamSize: "" });
      return next.slice(0, n);
    });
  }

  function toggleSkill(skill) {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill].slice(0, 14)));
  }

  async function buildResume() {
    if (!requiredOk) return alert("Please fill Full Name, Email, Mobile.");
    if (mobile.trim().length < 10) {
      // optional validation
      // return alert("Mobile number 10 digits hona chahiye.");
    }

    try {
      setBuilding(true);
      setGenerated(null);

      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        languages,
        availability,
        licenseId: licenseId.trim(),
        qualification,
        passoutYear,
        expType,
        companies: expType === "Experienced" ? companies : [],
        jobTitle: jobTitle.trim(),
        skillsSelected: selectedSkills,
        certificationsSelected: certifications,
      };

      const r = await fetch("/api/ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Build failed");
      setGenerated(data);
    } catch (e) {
      alert(e?.message || "Error");
    } finally {
      setBuilding(false);
    }
  }

  async function downloadPdf() {
    if (!requiredOk) return alert("Please fill Full Name, Email, Mobile.");

    try {
      setDownloading(true);

      // Ensure we have generated
      let gen = generated;
      if (!gen) {
        await buildResume();
        // state async -> call api directly
        const r2 = await fetch("/api/ai-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            city: city.trim(),
            state: stateName.trim(),
            pincode: pincode.trim(),
            languages,
            availability,
            licenseId: licenseId.trim(),
            qualification,
            passoutYear,
            expType,
            companies: expType === "Experienced" ? companies : [],
            jobTitle: jobTitle.trim(),
            skillsSelected: selectedSkills,
            certificationsSelected: certifications,
          }),
        });
        gen = await r2.json();
      }

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: gen,
          fileName: `${fullName.trim().replaceAll(" ", "_")}_Resume.pdf`,
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || "PDF failed");
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fullName.trim().replaceAll(" ", "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || "Download error");
    } finally {
      setDownloading(false);
    }
  }

  const preview = useMemo(() => {
    const sep = "----------------------------------------";
    const lines = [];
    const title = (generated?.title || jobTitle || "Professional").trim();

    lines.push(fullName.trim().toUpperCase() || "YOUR NAME");
    lines.push(title);
    lines.push([email.trim(), mobile.trim()].filter(Boolean).join(" | "));
    const loc = [city.trim(), stateName.trim(), pincode.trim()].filter(Boolean).join(", ");
    if (loc) lines.push(loc);
    if (languages.length) lines.push(`Languages: ${languages.join(", ")}`);
    if (availability) lines.push(`Availability: ${availability}`);
    if (licenseId.trim()) lines.push(`ID/License: ${licenseId.trim()}`);
    lines.push(sep);

    lines.push("SUMMARY");
    lines.push(generated?.summary || "Auto summary will appear here.");
    lines.push("");

    lines.push("EDUCATION");
    lines.push(`${qualification} | Passout: ${passoutYear}`);
    lines.push("");

    lines.push("SKILLS");
    const skillArr = generated?.skills?.length
      ? generated.skills
      : (selectedSkills.length ? selectedSkills : suggestedSkills);
    lines.push(skillArr.join(", "));
    lines.push("");

    lines.push("CERTIFICATIONS");
    const certArr = generated?.certifications?.length
      ? generated.certifications
      : (certifications.length ? certifications : suggestedCerts);
    lines.push(certArr.length ? certArr.join(", ") : "—");
    lines.push("");

    lines.push("EXPERIENCE");
    if (expType === "Fresher") {
      lines.push("Fresher");
    } else {
      companies.forEach((c, idx) => {
        lines.push(`Company ${idx + 1}: ${c.companyName || "-"}`);
        if (c.location) lines.push(`Location: ${c.location}`);
        const d1 = fmtDate(c.startDate) || "-";
        const d2 = fmtDate(c.endDate) || "-";
        lines.push(`Duration: ${d1} to ${d2}`);
        if (c.teamSize) lines.push(`Supervisor/Team: ${c.teamSize}`);
        lines.push("");
      });
    }
    lines.push("");

    lines.push("PROFESSIONAL EXPERIENCE HIGHLIGHTS");
    const pts = generated?.experiencePoints || [];
    if (!pts.length) lines.push("• Points will appear here after build.");
    pts.forEach((p) => lines.push(`• ${p}`));

    return lines.join("\n");
  }, [
    generated,
    fullName,
    email,
    mobile,
    city,
    stateName,
    pincode,
    languages,
    availability,
    licenseId,
    qualification,
    passoutYear,
    expType,
    companies,
    jobTitle,
    selectedSkills,
    suggestedSkills,
    certifications,
    suggestedCerts,
  ]);

  return (
    <>
      <Head>
        <title>AI Resume Builder Online | ResumeBoost AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="page">
        <div className="topRow">
          <Link className="back" href="/">← Back</Link>
          <span className="pill">Only Name + Email + Mobile required ✅</span>
        </div>

        <h1 className="h1">AI Resume Builder Online</h1>
        <p className="sub">Job Title select karo → skills + points auto → PDF download</p>

        <div className="grid">
          {/* FORM */}
          <section className="card">
            <h2 className="h2">Basic Details</h2>

            <label className="label">Full Name *</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" />

            <div className="row">
              <div className="col">
                <label className="label">Email *</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@gmail.com" />
              </div>
              <div className="col">
                <label className="label">Mobile *</label>
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9999999999" />
              </div>
            </div>

            {/* Location */}
            <h3 className="h3">Location</h3>
            <div className="row">
              <div className="col">
                <label className="label">City</label>
                <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
              </div>
              <div className="col">
                <label className="label">State</label>
                <input className="input" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. Maharashtra" />
              </div>
            </div>
            <label className="label">PIN Code</label>
            <input className="input" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 400001" />

            {/* Languages */}
            <h3 className="h3">Languages</h3>
            <div className="chips">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={"chip" + (languages.includes(l) ? " chipOn" : "")}
                  onClick={() => toggleMulti(l, languages, setLanguages)}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Availability + License */}
            <h3 className="h3">Availability / ID</h3>
            <label className="label">Availability / Shift</label>
            <select className="input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">Select</option>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label className="label">ID / License (optional)</label>
            <input className="input" value={licenseId} onChange={(e) => setLicenseId(e.target.value)} placeholder="e.g. Driving License / Guard ID" />

            {/* Education */}
            <h3 className="h3">Education</h3>
            <div className="row">
              <div className="col">
                <label className="label">Highest Qualification</label>
                <select className="input" value={qualification} onChange={(e) => setQualification(e.target.value)}>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="col">
                <label className="label">Passout Year</label>
                <select className="input" value={passoutYear} onChange={(e) => setPassoutYear(e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experience */}
            <h3 className="h3">Experience</h3>
            <div className="row">
              <div className="col">
                <label className="label">Select</label>
                <select className="input" value={expType} onChange={(e) => setExpType(e.target.value)}>
                  <option value="Fresher">Fresher</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </div>

              {expType === "Experienced" && (
                <div className="col">
                  <label className="label">No. of Companies</label>
                  <select
                    className="input"
                    value={companiesCount}
                    onChange={(e) => setCompaniesByCount(parseInt(e.target.value, 10))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {expType === "Experienced" && (
              <div className="companyWrap">
                {companies.map((c, idx) => (
                  <div key={idx} className="companyCard">
                    <div className="companyTitle">Company {idx + 1}</div>

                    <label className="label">Company Name</label>
                    <input
                      className="input"
                      value={c.companyName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompanies((prev) => prev.map((x, i) => (i === idx ? { ...x, companyName: v } : x)));
                      }}
                      placeholder="e.g. Bajaj Finance"
                    />

                    <label className="label">Company Location (optional)</label>
                    <input
                      className="input"
                      value={c.location}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompanies((prev) => prev.map((x, i) => (i === idx ? { ...x, location: v } : x)));
                      }}
                      placeholder="e.g. Pune"
                    />

                    <div className="row">
                      <div className="col">
                        <label className="label">Start Date</label>
                        <input
                          className="input"
                          type="date"
                          value={c.startDate}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCompanies((prev) => prev.map((x, i) => (i === idx ? { ...x, startDate: v } : x)));
                          }}
                        />
                      </div>
                      <div className="col">
                        <label className="label">End Date</label>
                        <input
                          className="input"
                          type="date"
                          value={c.endDate}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCompanies((prev) => prev.map((x, i) => (i === idx ? { ...x, endDate: v } : x)));
                          }}
                        />
                      </div>
                    </div>

                    <label className="label">Supervisor / Team Size (optional)</label>
                    <input
                      className="input"
                      value={c.teamSize}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompanies((prev) => prev.map((x, i) => (i === idx ? { ...x, teamSize: v } : x)));
                      }}
                      placeholder="e.g. Team of 6 / Supervisor: Mr. X"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Job Title */}
            <h3 className="h3">Job Title</h3>
            <label className="label">Search & Select (A–Z)</label>
            <input
              className="input"
              list="jobTitles"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Select job title..."
            />
            <datalist id="jobTitles">
              {JOB_TITLES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>

            {/* Skills */}
            <h3 className="h3">Skills (auto suggestions)</h3>
            <div className="chips">
              {suggestedSkills.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={"chip" + (selectedSkills.includes(s) ? " chipOn" : "")}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="hint">Select optional. Na select karo to auto add ho jayenge.</div>

            {/* Certifications */}
            <h3 className="h3">Certifications (role based)</h3>
            <div className="chips">
              {suggestedCerts.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={"chip" + (certifications.includes(c) ? " chipOn" : "")}
                  onClick={() => toggleMulti(c, certifications, setCertifications)}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="btnRow">
              <button className="btn blue" disabled={!requiredOk || building} onClick={buildResume}>
                {building ? "Building..." : "Build Resume (Role Based)"}
              </button>
              <button className="btn green" disabled={!requiredOk || downloading} onClick={downloadPdf}>
                {downloading ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="card">
            <div className="previewTop">
              <h2 className="h2">Preview</h2>
              <span className="pillSmall">{generated ? "Generated" : "Live Preview"}</span>
            </div>
            <pre className="preview">{preview}</pre>
          </section>
        </div>

        <style jsx>{`
          .page{max-width:1140px;margin:0 auto;padding:18px;font-family:system-ui;background:#f3f4f6;min-height:100vh}
          .topRow{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
          .back{font-weight:900;color:#111827;text-decoration:none}
          .pill{font-size:12px;font-weight:900;padding:6px 10px;border-radius:999px;border:1px solid #e5e7eb;background:#fff}
          .h1{margin:10px 0 0;font-size:34px;font-weight:950}
          .sub{margin-top:6px;color:#4b5563}
          .grid{display:grid;grid-template-columns:1fr;gap:16px;margin-top:16px}
          @media(min-width:1024px){.grid{grid-template-columns:1fr 1fr}}
          .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 14px 36px rgba(0,0,0,.06)}
          .h2{margin:0;font-size:16px;font-weight:950}
          .h3{margin-top:16px;margin-bottom:0;font-size:13px;font-weight:950;color:#374151}
          .label{display:block;margin-top:12px;margin-bottom:6px;font-weight:900;font-size:13px}
          .input{width:100%;padding:11px;border-radius:12px;border:1px solid #d1d5db;outline:none;background:#fff}
          .hint{font-size:12px;color:#6b7280;margin-top:6px}
          .row{display:flex;gap:10px;flex-wrap:wrap}
          .col{flex:1;min-width:220px}
          .companyWrap{margin-top:10px;display:flex;flex-direction:column;gap:10px}
          .companyCard{border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#f9fafb}
          .companyTitle{font-weight:950;font-size:13px;color:#111827}
          .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
          .chip{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:8px 12px;font-weight:800;font-size:12px;cursor:pointer}
          .chipOn{border-color:#16a34a;color:#16a34a}
          .btnRow{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
          .btn{flex:1;min-width:220px;padding:12px 14px;border-radius:12px;border:none;color:#fff;font-weight:950;cursor:pointer}
          .btn:disabled{opacity:.7;cursor:not-allowed}
          .blue{background:#0ea5e9}
          .green{background:#16a34a}
          .previewTop{display:flex;justify-content:space-between;align-items:center;gap:10px}
          .pillSmall{font-size:12px;font-weight:900;padding:6px 10px;border-radius:999px;border:1px solid #e5e7eb;background:#f9fafb}
          .preview{margin-top:12px;white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:14px;padding:14px;font-size:13px;line-height:1.65;min-height:520px}
        `}</style>
      </main>
    </>
  );
}
