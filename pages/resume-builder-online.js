import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

const QUALIFICATIONS = [
  "10th",
  "12th",
  "ITI",
  "Diploma",
  "Graduation (UG)",
  "Post Graduation (PG)",
];

const years = (() => {
  const now = new Date().getFullYear();
  return Array.from({ length: 50 }, (_, i) => String(now - i));
})();

// ✅ Expanded small + common jobs (add more anytime)
const JOB_TITLES = [
  // Small / local jobs
  "Delivery Driver",
  "Driver",
  "Auto Mechanic",
  "Bike Mechanic",
  "Car Mechanic",
  "Helper",
  "Office Boy",
  "Peon",
  "Cleaner",
  "Housekeeping Staff",
  "Security Guard",
  "Watchman",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Welder",
  "Machine Operator",
  "Warehouse Picker",
  "Warehouse Executive",
  "Store Helper",
  "Kitchen Helper",
  "Cook",
  "Chef",
  "Waiter",
  "Barber",
  "Tailor",
  "Receptionist",
  "Data Entry Operator",
  "Delivery Boy",
  "Field Executive",
  "Sales Executive",
  "Telecaller",
  "Customer Support Executive",

  // Tech / business
  "Accountant",
  "Billing Executive",
  "Back Office Executive",
  "HR Executive",
  "Marketing Executive",
  "SEO Executive",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Web Developer",
];

const ROLE_SKILLS = [
  { k: ["delivery", "driver", "courier"], s: ["Route Planning", "On-Time Delivery", "Customer Handling", "Cash Handling (COD)", "Vehicle Safety Check", "Navigation (Maps)"] },
  { k: ["mechanic", "auto", "bike", "car mechanic"], s: ["Diagnostics", "Vehicle Servicing", "Engine Basics", "Brakes & Suspension", "Tool Handling", "Safety Compliance"] },
  { k: ["electrician"], s: ["Wiring", "Safety Procedures", "Fault Finding", "Tools & Testing", "Installation", "Maintenance"] },
  { k: ["plumber"], s: ["Pipe Fitting", "Leak Fixing", "Installation", "Maintenance", "Tools Handling", "Safety"] },
  { k: ["security", "watchman"], s: ["Access Control", "Patrolling", "Incident Reporting", "Visitor Management", "Discipline", "Emergency Handling"] },
  { k: ["cleaner", "housekeeping"], s: ["Cleaning SOP", "Hygiene", "Time Management", "Material Handling", "Safety", "Attention to Detail"] },
  { k: ["sales"], s: ["Lead Generation", "Negotiation", "Follow-ups", "Closing", "Customer Handling", "Target Achievement"] },
  { k: ["telecaller", "support", "customer"], s: ["Communication", "Ticket/Query Handling", "Follow-up", "Problem Solving", "Polite Conversation", "Escalation"] },
  { k: ["account", "billing"], s: ["MS Excel", "Invoice/Billing", "Data Accuracy", "Reporting", "Reconciliation", "Documentation"] },
  { k: ["developer", "frontend", "backend", "web"], s: ["JavaScript", "HTML/CSS", "APIs", "Git", "Debugging", "Deployment"] },
];

function pickSkills(jobTitle) {
  const t = (jobTitle || "").toLowerCase();
  for (const r of ROLE_SKILLS) {
    if (r.k.some((x) => t.includes(x))) return r.s;
  }
  return ["Communication", "Teamwork", "Time Management", "Problem Solving", "Work Discipline", "Quick Learning"];
}

export default function ResumeBuilderOnline() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [qualification, setQualification] = useState("10th");
  const [passoutYear, setPassoutYear] = useState(years[0]);

  const [expType, setExpType] = useState("Fresher"); // Fresher | Experienced
  const [companiesCount, setCompaniesCount] = useState(1);
  const [companies, setCompanies] = useState([{ companyName: "", startDate: "", endDate: "" }]);

  const [jobTitle, setJobTitle] = useState("Delivery Driver");

  const suggestedSkills = useMemo(() => pickSkills(jobTitle), [jobTitle]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [ai, setAi] = useState(null);
  const [building, setBuilding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const requiredOk = fullName.trim() && email.trim() && mobile.trim();

  function setCompaniesByCount(n) {
    setCompaniesCount(n);
    setCompanies((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ companyName: "", startDate: "", endDate: "" });
      return next.slice(0, n);
    });
  }

  function toggleSkill(skill) {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      return [...prev, skill].slice(0, 12);
    });
  }

  async function buildResume() {
    if (!requiredOk) return alert("Please fill Name, Email, Mobile.");

    try {
      setBuilding(true);
      setAi(null);

      const r = await fetch("/api/ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          qualification,
          passoutYear,
          expType,
          companies: expType === "Experienced" ? companies : [],
          jobTitle: jobTitle.trim(),
          skillsSelected: selectedSkills,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Build failed");
      setAi(data);
    } catch (e) {
      alert(e?.message || "Error");
    } finally {
      setBuilding(false);
    }
  }

  async function downloadPdf() {
    if (!requiredOk) return alert("Please fill Name, Email, Mobile.");

    try {
      setDownloading(true);

      // Ensure we have generated data
      let payload = ai;
      if (!payload) {
        await buildResume();
        // buildResume is async state; safer: call API fresh
        const r2 = await fetch("/api/ai-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            qualification,
            passoutYear,
            expType,
            companies: expType === "Experienced" ? companies : [],
            jobTitle: jobTitle.trim(),
            skillsSelected: selectedSkills,
          }),
        });
        payload = await r2.json();
      }

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          fileName: `${fullName.trim().replaceAll(" ", "_")}_Resume.pdf`,
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || "PDF download failed");
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

    lines.push(fullName.trim().toUpperCase());
    lines.push(jobTitle || "Professional Executive");
    lines.push([email.trim(), mobile.trim()].filter(Boolean).join(" | "));
    lines.push(sep);

    lines.push("EDUCATION");
    lines.push(`${qualification} | Passout: ${passoutYear}`);
    lines.push("");

    lines.push("SKILLS");
    const skillsText =
      (ai?.skills && ai.skills.length ? ai.skills : (selectedSkills.length ? selectedSkills : suggestedSkills)).join(", ");
    lines.push(skillsText);
    lines.push("");

    lines.push("EXPERIENCE");
    if (expType === "Fresher") {
      lines.push("Fresher");
    } else {
      companies.forEach((c, idx) => {
        lines.push(`Company ${idx + 1}: ${c.companyName || "-"}`);
        lines.push(`Duration: ${c.startDate || "-"} to ${c.endDate || "-"}`);
      });
    }
    lines.push("");

    // ✅ Heading rename
    lines.push("PROFESSIONAL HIGHLIGHTS");
    (ai?.experiencePoints || []).forEach((p) => lines.push(`• ${p}`));

    return lines.join("\n");
  }, [fullName, email, mobile, jobTitle, qualification, passoutYear, expType, companies, selectedSkills, suggestedSkills, ai]);

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
          <section className="card">
            <h2 className="h2">Basic Details</h2>

            <label className="label">Full Name *</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />

            <div className="row">
              <div className="col">
                <label className="label">Email *</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="col">
                <label className="label">Mobile *</label>
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </div>

            <h3 className="h3">Education</h3>
            <div className="row">
              <div className="col">
                <label className="label">Highest Qualification</label>
                <select className="input" value={qualification} onChange={(e) => setQualification(e.target.value)}>
                  {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="col">
                <label className="label">Passout Year</label>
                <select className="input" value={passoutYear} onChange={(e) => setPassoutYear(e.target.value)}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

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
                  <select className="input" value={companiesCount} onChange={(e) => setCompaniesByCount(parseInt(e.target.value, 10))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
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
                  </div>
                ))}
              </div>
            )}

            <h3 className="h3">Job Title</h3>
            <label className="label">Search & Select</label>
            <input
              className="input"
              list="jobTitles"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Select job title..."
            />
            <datalist id="jobTitles">
              {JOB_TITLES.map((t) => <option key={t} value={t} />)}
            </datalist>

            <h3 className="h3">Skills (auto suggestions)</h3>
            <div className="skillsGrid">
              {suggestedSkills.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={"skillBtn" + (selectedSkills.includes(s) ? " skillOn" : "")}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="btnRow">
              <button className="btn blue" disabled={!requiredOk || building} onClick={buildResume}>
                {building ? "Building..." : "Build Resume (Role Based)"}
              </button>
              <button className="btn green" disabled={!requiredOk || downloading} onClick={downloadPdf}>
                {downloading ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="previewTop">
              <h2 className="h2">Preview</h2>
              <span className="pillSmall">{ai ? "Generated" : "Live Preview"}</span>
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
          .row{display:flex;gap:10px;flex-wrap:wrap}
          .col{flex:1;min-width:220px}
          .companyWrap{margin-top:10px;display:flex;flex-direction:column;gap:10px}
          .companyCard{border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#f9fafb}
          .companyTitle{font-weight:950;font-size:13px;color:#111827}
          .skillsGrid{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
          .skillBtn{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:8px 12px;font-weight:800;font-size:12px;cursor:pointer}
          .skillOn{border-color:#16a34a;color:#16a34a}
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
