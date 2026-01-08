import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ResumeBuilderOnline() {
  // Required
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Optional
  const [jobTitle, setJobTitle] = useState("");
  const [expYears, setExpYears] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [experienceDetails, setExperienceDetails] = useState("");
  const [skills, setSkills] = useState("");

  // Education
  const [highestQualification, setHighestQualification] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  // AI
  const [ai, setAi] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const requiredOk = fullName.trim() && email.trim() && mobile.trim();

  const baseProfile = useMemo(() => {
    const title = jobTitle.trim() || "Professional Executive";
    const years = (expYears || "").toString().trim();
    const yrs = years ? `${years}+ years` : "";
    return { title, yrs };
  }, [jobTitle, expYears]);

  const educationLine = useMemo(() => {
    const q = highestQualification.trim();
    const f = fieldOfStudy.trim();
    const y = graduationYear.trim();

    if (q || f || y) {
      const left = [q || "Bachelor’s Degree", f ? `– ${f}` : ""].join(" ").trim();
      const right = y ? `Year: ${y}` : "";
      return [left, right].filter(Boolean).join(" | ");
    }
    return "Bachelor’s Degree / Equivalent Qualification";
  }, [highestQualification, fieldOfStudy, graduationYear]);

  const fallback = useMemo(() => {
    const title = baseProfile.title;

    const summary =
      `Results-driven ${title} with strong communication and organizational skills. ` +
      `Quick learner with a disciplined approach, known for delivering quality work on time and adapting in fast-paced environments.`;

    const defaultSkills = [
      "Communication",
      "Team Collaboration",
      "Problem Solving",
      "Time Management",
      "MS Office / Digital Tools",
      "Customer Handling",
    ];

    const skillsText = skills.trim()
      ? splitSkills(skills).join(", ")
      : defaultSkills.join(", ");

    const exp = buildExperienceFallback({
      title,
      companyName,
      experienceDetails,
      expYears,
    });

    return {
      summary,
      skills: skillsText,
      experience: exp,
      education: educationLine,
    };
  }, [baseProfile.title, skills, educationLine, companyName, experienceDetails, expYears]);

  const finalData = useMemo(() => ai || fallback, [ai, fallback]);

  const finalResume = useMemo(() => {
    const title = baseProfile.title;
    const contact = [email.trim(), mobile.trim()].filter(Boolean).join(" | ");
    const sep = "────────────────────────────────";

    const lines = [];
    lines.push(fullName.trim().toUpperCase());
    lines.push(title + (baseProfile.yrs ? ` (${baseProfile.yrs})` : ""));
    if (contact) lines.push(contact);
    lines.push(sep);

    lines.push("SUMMARY");
    lines.push(finalData.summary);
    lines.push("");

    lines.push("SKILLS");
    lines.push(finalData.skills);
    lines.push("");

    lines.push("EXPERIENCE");
    lines.push(finalData.experience);
    lines.push("");

    lines.push("EDUCATION");
    lines.push(finalData.education);
    lines.push("");

    return lines.join("\n");
  }, [finalData, fullName, email, mobile, baseProfile.title, baseProfile.yrs]);

  async function generateAI() {
    if (!requiredOk) return alert("Please fill Full Name, Email, Mobile.");

    try {
      setGenerating(true);
      setAi(null);

      const r = await fetch("/api/ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          jobTitle: jobTitle.trim(),
          expYears: expYears.toString().trim(),
          skills: skills.trim(),

          highestQualification: highestQualification.trim(),
          fieldOfStudy: fieldOfStudy.trim(),
          graduationYear: graduationYear.trim(),

          companyName: companyName.trim(),
          experienceDetails: experienceDetails.trim(),
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "AI generate failed");

      setAi({
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        education: data.education,
      });
    } catch (e) {
      alert(e?.message || "AI error");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPdf() {
    if (!requiredOk) return alert("Please fill Full Name, Email, Mobile.");

    try {
      setDownloading(true);

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `${fullName.trim().replaceAll(" ", "_")}_Resume.pdf`,
          content: finalResume,
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

  return (
    <>
      <Head>
        <title>AI Resume Builder Online (ATS Friendly) | ResumeBoost AI</title>
        <meta
          name="description"
          content="Create a high-professional ATS-friendly resume in minutes. Just enter name, email and mobile — AI writes the rest. Download PDF instantly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="page">
        <div className="topRow">
          <Link href="/" className="backLink">← Back to ResumeBoost AI</Link>
          <span className="topBadge">ATS‑Friendly • Recruiter‑Approved Format</span>
        </div>

        <h1 className="h1">AI Resume Builder Online</h1>
        <p className="sub">
          सिर्फ <b>Name + Email + Mobile</b> डालो — बाकी Summary, Skills, Experience, Education AI बना देगा ✅
        </p>

        <div className="trustRow">
          <div className="trustPill">✅ Clean formatting</div>
          <div className="trustPill">✅ ATS safe</div>
          <div className="trustPill">✅ Print & Email ready</div>
        </div>

        <div className="grid">
          {/* FORM */}
          <section className="card">
            <h2 className="h2">Basic details (required)</h2>

            <label className="label">Full Name *</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" />

            <div className="row">
              <div className="col">
                <label className="label">Email *</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@gmail.com" />
              </div>
              <div className="col">
                <label className="label">Mobile *</label>
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="99999 99999" />
              </div>
            </div>

            <h3 className="h3">Optional (AI will improve it)</h3>

            <label className="label">Job Title</label>
            <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Mechanic / Sales Executive" />

            <label className="label">Experience in years</label>
            <input className="input" value={expYears} onChange={(e) => setExpYears(e.target.value)} placeholder="e.g. 4" />

            <label className="label">Company Name</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. XYZ Garage" />

            <label className="label">Experience details</label>
            <textarea
              className="textarea"
              rows={4}
              value={experienceDetails}
              onChange={(e) => setExperienceDetails(e.target.value)}
              placeholder={`Example:\nMechanic – XYZ Garage (2020–2024)\n• Vehicle servicing & repair\n• Diagnostics & maintenance\n• Customer handling`}
            />

            <label className="label">Qualification / Education</label>
            <div className="row">
              <div className="col">
                <input className="input" value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} placeholder="e.g. 10th / Diploma" />
              </div>
              <div className="col">
                <input className="input" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="e.g. Mechanical" />
              </div>
            </div>

            <label className="label">Passing Year</label>
            <input className="input" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="e.g. 2022" />

            <label className="label">Skills</label>
            <textarea className="textarea" rows={3} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Engine Repair, Diagnostics, Teamwork" />

            <div className="btnRow">
              <button className="btn btnBlue" onClick={generateAI} disabled={generating || !requiredOk}>
                {generating ? "Building..." : "✨ Build My Professional Resume (AI)"}
              </button>

              <button className="btn btnGreen" onClick={downloadPdf} disabled={downloading || !requiredOk}>
                {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>

            <div className="smallLine">Free preview • PDF download from server</div>
          </section>

          {/* PREVIEW */}
          <section className="card">
            <div className="previewTop">
              <h2 className="h2">Professional Preview</h2>
              <span className="badge">{ai ? "AI Generated" : "Auto (Fallback)"}</span>
            </div>

            <div className="whyBox">
              <div className="whyTitle">Why recruiters like this</div>
              <ul className="whyList">
                <li>Clean, ATS-friendly structure</li>
                <li>Good keywords + readable layout</li>
                <li>Works for fresher & experienced</li>
              </ul>
            </div>

            <pre className="preview">{finalResume}</pre>
          </section>
        </div>

        <style jsx>{`
          .page{max-width:1140px;margin:0 auto;padding:18px;font-family:system-ui;background:#f3f4f6;min-height:100vh}
          .topRow{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
          .backLink{text-decoration:none;font-weight:900;color:#111827}
          .topBadge{font-size:12px;font-weight:900;padding:6px 10px;border-radius:999px;border:1px solid #e5e7eb;background:#f9fafb;color:#374151}
          .h1{margin:10px 0 0;font-size:36px;font-weight:950;letter-spacing:-0.02em}
          .sub{margin-top:8px;color:#4b5563;line-height:1.6}
          .trustRow{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
          .trustPill{font-size:12px;font-weight:800;padding:6px 10px;border-radius:999px;background:#ecfeff;border:1px solid #cffafe;color:#075985}
          .grid{display:grid;grid-template-columns:1fr;gap:16px;margin-top:18px}
          @media(min-width:1024px){ .grid{grid-template-columns:1fr 1fr;} }
          .card{border:1px solid #e5e7eb;border-radius:16px;padding:16px;background:#fff;box-shadow:0 14px 36px rgba(0,0,0,0.06)}
          .h2{margin:0;font-size:16px;font-weight:950}
          .h3{margin-top:16px;margin-bottom:0;font-size:13px;font-weight:950;color:#374151}
          .label{display:block;margin-top:12px;margin-bottom:6px;font-weight:900;font-size:13px;color:#111827}
          .input,.textarea{width:100%;padding:11px;border-radius:12px;border:1px solid #d1d5db;outline:none;background:#fff}
          .textarea{resize:vertical}
          .row{display:flex;gap:10px;flex-wrap:wrap}
          .col{flex:1;min-width:220px}
          .btnRow{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
          .btn{flex:1;min-width:220px;padding:12px 14px;border-radius:12px;border:none;color:#fff;font-weight:950;cursor:pointer}
          .btn:disabled{opacity:.7;cursor:not-allowed}
          .btnBlue{background:#0ea5e9}
          .btnGreen{background:#16a34a}
          .smallLine{margin-top:10px;font-size:12px;color:#6b7280;font-weight:700}
          .previewTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
          .badge{font-size:12px;font-weight:950;padding:6px 10px;border-radius:999px;border:1px solid #e5e7eb;background:#f9fafb;color:#374151}
          .whyBox{margin-top:12px;border-radius:14px;border:1px solid #e5e7eb;background:#f9fafb;padding:12px}
          .whyTitle{font-weight:950;font-size:13px;margin-bottom:8px}
          .whyList{margin:0;padding-left:18px;color:#374151;font-size:13px;line-height:1.6}
          .preview{margin-top:12px;white-space:pre-wrap;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;font-size:13px;line-height:1.65;min-height:520px}
        `}</style>
      </main>
    </>
  );
}

function splitSkills(text) {
  return (text || "")
    .split(/,|\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function buildExperienceFallback({ title, companyName, experienceDetails, expYears }) {
  const yearsNum = parseInt((expYears || "").toString().trim(), 10);
  const hasExp = !Number.isNaN(yearsNum) && yearsNum > 0;
  const compLine = companyName?.trim() ? `Company: ${companyName.trim()}` : "";
  const userDetails = (experienceDetails || "").trim();

  if (userDetails) {
    const bullets = userDetails
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith("•") ? l : `• ${l}`))
      .slice(0, 10)
      .join("\n");

    return [`Role: ${title}`, compLine, "", bullets].filter(Boolean).join("\n");
  }

  if (hasExp) {
    return (
      `Role: ${title}\n` +
      (compLine ? `${compLine}\n\n` : "\n") +
      `• Delivered consistent quality work on time\n` +
      `• Coordinated with team and followed process discipline\n` +
      `• Maintained documentation and handled responsibilities professionally`
    );
  }

  return (
    `Role: ${title}\n` +
    (compLine ? `${compLine}\n\n` : "\n") +
    `• Assisted in day-to-day work with accuracy and professionalism\n` +
    `• Supported team timelines and maintained records\n` +
    `• Demonstrated punctuality and willingness to learn`
  );
}
