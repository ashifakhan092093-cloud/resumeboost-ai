import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ResumeBuilderOnline() {
  // ✅ Required (only 3)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Optional (AI improves)
  const [jobTitle, setJobTitle] = useState("");
  const [expYears, setExpYears] = useState("");
  const [skills, setSkills] = useState("");

  // ✅ NEW: Qualification (optional)
  const [qualification, setQualification] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institute, setInstitute] = useState("");
  const [gradYear, setGradYear] = useState("");

  // ✅ NEW: Experience (optional, if user wants to add)
  const [experienceNotes, setExperienceNotes] = useState("");

  // AI output (server)
  const [ai, setAi] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const requiredOk = fullName.trim() && email.trim() && mobile.trim();

  const profile = useMemo(() => {
    const title = jobTitle.trim() || "Professional Executive";
    const yearsStr = (expYears || "").toString().trim();
    const yearsNum = parseInt(yearsStr, 10);
    const hasExp = !Number.isNaN(yearsNum) && yearsNum > 0;
    return { title, yearsStr, yearsNum, hasExp };
  }, [jobTitle, expYears]);

  // Fallback content (even without AI click)
  const fallback = useMemo(() => {
    const title = profile.title;

    const summary =
      `Results-driven ${title} with strong communication and organizational skills. ` +
      `Quick learner with a professional mindset, able to handle responsibilities efficiently and adapt in fast-paced environments. ` +
      `Actively seeking opportunities to contribute to organizational growth.`;

    const defaultSkills = [
      "Communication",
      "Team Collaboration",
      "Problem Solving",
      "Time Management",
      "MS Office / Digital Tools",
      "Customer Handling",
    ];

    const skillsLine = skills.trim()
      ? splitSkills(skills).join(", ")
      : defaultSkills.join(", ");

    const expAutoExperienced =
      `• Managed day-to-day responsibilities with accuracy and consistent quality.\n` +
      `• Coordinated with team/stakeholders to meet targets and deadlines.\n` +
      `• Maintained documentation and improved workflow through process discipline.\n` +
      `• Demonstrated professionalism, punctuality, and a results-oriented mindset.`;

    const expAutoFresher =
      `• Assisted in day-to-day operations and handled assigned tasks with accuracy and professionalism.\n` +
      `• Coordinated with team members to support targets, timelines, and quality standards.\n` +
      `• Maintained records/documentation and ensured timely completion of responsibilities.\n` +
      `• Demonstrated professionalism, punctuality, and a results-oriented mindset.`;

    const experienceText =
      experienceNotes.trim() ||
      (profile.hasExp ? expAutoExperienced : expAutoFresher);

    const educationText = buildEducation({
      qualification,
      fieldOfStudy,
      institute,
      gradYear,
    });

    return {
      summary,
      skills: skillsLine,
      experience: experienceText,
      education: educationText,
    };
  }, [
    profile.title,
    profile.hasExp,
    skills,
    experienceNotes,
    qualification,
    fieldOfStudy,
    institute,
    gradYear,
  ]);

  const content = ai || fallback;

  const resumeText = useMemo(() => {
    const title = profile.title;
    const contact = [email.trim(), mobile.trim()].filter(Boolean).join(" | ");

    const lines = [];
    lines.push(fullName.trim().toUpperCase());
    lines.push(title);
    if (contact) lines.push(contact);
    lines.push("");

    lines.push("SUMMARY");
    lines.push(ruleLine());
    lines.push(content.summary);
    lines.push("");

    lines.push("SKILLS");
    lines.push(ruleLine());
    lines.push(content.skills);
    lines.push("");

    lines.push("EXPERIENCE");
    lines.push(ruleLine());
    lines.push(content.experience);
    lines.push("");

    lines.push("EDUCATION");
    lines.push(ruleLine());
    lines.push(content.education);
    lines.push("");

    return lines.join("\n");
  }, [fullName, email, mobile, profile.title, content]);

  async function generateAI() {
    try {
      if (!requiredOk) {
        alert("Please fill Full Name, Email, Mobile.");
        return;
      }
      setGenerating(true);
      setAi(null);

      const r = await fetch("/api/ai-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          jobTitle: jobTitle.trim(),
          expYears: expYears.toString().trim(),
          skills: skills.trim(),
          qualification: qualification.trim(),
          fieldOfStudy: fieldOfStudy.trim(),
          institute: institute.trim(),
          gradYear: gradYear.trim(),
          experienceNotes: experienceNotes.trim(),
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
    try {
      if (!requiredOk) {
        alert("Please fill Full Name, Email, Mobile.");
        return;
      }
      setDownloading(true);

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${fullName.trim()} - Resume`,
          content: resumeText,
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err?.error || "PDF download failed");
        return;
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
          content="Create a high-professional ATS-friendly resume in minutes. Enter name, email and mobile — AI writes the rest. Add qualification & experience optionally. Download PDF instantly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={S.page}>
        <div style={S.topBar}>
          <Link href="/" style={S.backLink}>← Back to ResumeBoost AI</Link>
        </div>

        <div style={S.hero}>
          <h1 style={S.h1}>AI Resume Builder Online</h1>
          <p style={S.sub}>
            सिर्फ <b>Name + Email + Mobile</b> डालो — बाकी Summary, Skills, Experience AI बना देगा ✅
          </p>

          <div style={S.trustRow}>
            <span style={S.trustPill}>ATS-Friendly</span>
            <span style={S.trustPill}>Recruiter Style Format</span>
            <span style={S.trustPill}>High-Quality PDF</span>
            <span style={S.trustPill}>No Signup</span>
          </div>
        </div>

        <div style={S.grid}>
          {/* FORM */}
          <section style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.h2}>Basic details (required)</h2>
              <span style={S.step}>Step 1</span>
            </div>

            <label style={S.label}>Full Name *</label>
            <input
              style={S.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />
            <div style={S.help}>Resume header automatically professional format me set ho jayega.</div>

            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Email *</label>
                <input
                  style={S.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@gmail.com"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Mobile *</label>
                <input
                  style={S.input}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="99999 99999"
                />
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.cardHeader}>
              <h3 style={S.h3}>Optional (AI will improve it)</h3>
              <span style={S.step}>Step 2</span>
            </div>

            <label style={S.label}>Job Title (optional)</label>
            <input
              style={S.input}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Sales Executive / Frontend Developer"
            />
            <div style={S.help}>Leave empty if unsure — AI best professional title choose karega.</div>

            <label style={S.label}>Experience in years (optional)</label>
            <input
              style={S.input}
              value={expYears}
              onChange={(e) => setExpYears(e.target.value)}
              placeholder="e.g. 0 / 1 / 3"
            />

            <label style={S.label}>Skills (optional, comma/new line)</label>
            <textarea
              style={S.textarea}
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Excel, Communication, Sales"
            />
            <div style={S.help}>No worries — skills na bhi likho to AI relevant skills add karega.</div>

            <div style={S.divider} />

            <div style={S.cardHeader}>
              <h3 style={S.h3}>Qualification (optional)</h3>
              <span style={S.step}>Step 3</span>
            </div>

            <label style={S.label}>Highest Qualification</label>
            <input
              style={S.input}
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. B.Com / B.Tech / 12th"
            />

            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Field / Stream</label>
                <input
                  style={S.input}
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g. Commerce / Computer Science"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Year</label>
                <input
                  style={S.input}
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="e.g. 2024"
                />
              </div>
            </div>

            <label style={S.label}>Institute / College</label>
            <input
              style={S.input}
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
              placeholder="e.g. ABC College"
            />

            <div style={S.divider} />

            <div style={S.cardHeader}>
              <h3 style={S.h3}>Experience details (optional)</h3>
              <span style={S.step}>Step 4</span>
            </div>

            <label style={S.label}>Write your experience (if you want)</label>
            <textarea
              style={S.textarea}
              rows={5}
              value={experienceNotes}
              onChange={(e) => setExperienceNotes(e.target.value)}
              placeholder={`Example:\nSales Executive - XYZ Company (2023-2024)\n• Lead generation & follow-ups\n• Client handling\n• Target support`}
            />
            <div style={S.help}>Agar empty chhodo, AI auto professional experience generate karega.</div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={generateAI}
                disabled={generating || !requiredOk}
                style={{
                  ...S.btn,
                  background: "#0ea5e9",
                  opacity: generating || !requiredOk ? 0.7 : 1,
                }}
              >
                {generating ? "Building..." : "✨ Build My Professional Resume (AI)"}
              </button>

              <button
                onClick={downloadPdf}
                disabled={downloading || !requiredOk}
                style={{ ...S.btn, opacity: downloading || !requiredOk ? 0.7 : 1 }}
              >
                {downloading ? "Generating..." : "Download PDF"}
              </button>
            </div>

            <div style={S.smallLine}>High-quality PDF • Print & Email Ready</div>
            <div style={S.note}>
              ✅ Agar AI button nahi dabao, tab bhi preview auto-professional rahega (fallback).
            </div>
          </section>

          {/* PREVIEW */}
          <section style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.h2}>Premium Preview</h2>
              <span style={S.badge}>{ai ? "AI Generated" : "Auto (Fallback)"}</span>
            </div>

            <div style={S.whyBox}>
              <div style={S.whyTitle}>Why recruiters like this resume</div>
              <div style={S.whyList}>
                <div>✔ Clean & professional formatting</div>
                <div>✔ ATS-friendly keywords</div>
                <div>✔ No unnecessary design elements</div>
                <div>✔ Ready for fresher & experienced roles</div>
              </div>
            </div>

            <pre style={S.preview}>{resumeText}</pre>
          </section>
        </div>

        <style jsx>{`
          @media (min-width: 980px) {
            .grid2 {
              grid-template-columns: 1.05fr 0.95fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function splitSkills(text) {
  return text
    .split(/,|\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function ruleLine() {
  return "────────────";
}

function buildEducation({ qualification, fieldOfStudy, institute, gradYear }) {
  const q = (qualification || "").trim();
  const f = (fieldOfStudy || "").trim();
  const i = (institute || "").trim();
  const y = (gradYear || "").trim();

  // If user filled something, format nicely
  if (q || f || i || y) {
    const left = [q, f].filter(Boolean).join(" - ");
    const right = [i, y].filter(Boolean).join(" | ");
    if (left && right) return `${left}\n${right}`;
    if (left) return left;
    if (right) return right;
  }

  // Default safe
  return "Bachelor’s Degree / Equivalent Qualification";
}

const S = {
  page: { maxWidth: 1120, margin: "0 auto", padding: 18, fontFamily: "system-ui" },
  topBar: { marginBottom: 10 },
  backLink: { textDecoration: "none", fontWeight: 900 },

  hero: { marginTop: 6, marginBottom: 14 },
  h1: { margin: "10px 0 0", fontSize: 36, fontWeight: 950, letterSpacing: "-0.02em" },
  sub: { marginTop: 8, color: "#4b5563", lineHeight: 1.55 },

  trustRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  trustPill: {
    fontSize: 12,
    fontWeight: 800,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 18,
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },

  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  h2: { margin: 0, fontSize: 16, fontWeight: 950 },
  h3: { margin: 0, fontSize: 13, fontWeight: 950, color: "#374151" },

  step: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },

  label: { display: "block", marginTop: 12, marginBottom: 6, fontWeight: 900, fontSize: 13 },
  input: { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" },
  textarea: { width: "100%", padding: 10, borderRadius: 12, border: "1px solid #d1d5db" },
  row: { display: "flex", gap: 10, marginTop: 6 },

  help: { marginTop: 6, fontSize: 12, color: "#6b7280" },
  divider: { height: 1, background: "#f3f4f6", marginTop: 16 },

  btn: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  smallLine: { marginTop: 10, fontSize: 12, color: "#6b7280", fontWeight: 700 },
  note: { marginTop: 10, fontSize: 12, color: "#6b7280" },

  badge: {
    fontSize: 12,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },

  whyBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  whyTitle: { fontWeight: 950, fontSize: 13, marginBottom: 8 },
  whyList: { fontSize: 12, color: "#374151", display: "grid", gap: 4 },

  preview: {
    marginTop: 12,
    whiteSpace: "pre-wrap",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    lineHeight: 1.65,
    minHeight: 520,
  },
};
