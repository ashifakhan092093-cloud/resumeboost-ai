import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ResumeBuilderOnline() {
  // ✅ Only 3 required
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Optional
  const [jobTitle, setJobTitle] = useState("");
  const [expYears, setExpYears] = useState("");
  const [skills, setSkills] = useState(""); // optional

  // AI output (server)
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

  // If user didn’t click "Generate", we still show a nice default preview
  const fallback = useMemo(() => {
    const title = baseProfile.title;
    const summary =
      `Highly motivated ${title} with strong communication, problem-solving, and teamwork skills. ` +
      `Known for delivering quality work on time, learning quickly, and adapting in fast-paced environments.`;

    const defaultSkills = [
      "Communication",
      "Team Collaboration",
      "Problem Solving",
      "Time Management",
      "MS Office / Digital Tools",
      "Customer Handling",
    ];

    const exp =
      `• Supported daily operations and handled assigned responsibilities with accuracy.\n` +
      `• Coordinated with team members to meet targets and deadlines.\n` +
      `• Maintained documentation and ensured quality standards in day-to-day tasks.`;

    const edu = "Bachelor’s Degree / Equivalent Qualification";

    return {
      summary,
      skills: skills.trim()
        ? splitSkills(skills).join(", ")
        : defaultSkills.join(", "),
      experience: exp,
      education: edu,
    };
  }, [baseProfile.title, skills]);

  const finalResume = useMemo(() => {
    const title = baseProfile.title;
    const contact = [email.trim(), mobile.trim()].filter(Boolean).join(" | ");

    const content = ai || fallback;

    const lines = [];
    lines.push(fullName.trim().toUpperCase());
    lines.push(title);
    if (contact) lines.push(contact);
    lines.push("");

    lines.push("SUMMARY");
    lines.push(content.summary);
    lines.push("");

    lines.push("SKILLS");
    lines.push(content.skills);
    lines.push("");

    lines.push("EXPERIENCE");
    lines.push(content.experience);
    lines.push("");

    lines.push("EDUCATION");
    lines.push(content.education);
    lines.push("");

    return lines.join("\n");
  }, [ai, fallback, fullName, email, mobile, baseProfile.title]);

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
          content: finalResume,
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
          content="Create a high-professional ATS-friendly resume in minutes. Just enter name, email and mobile — AI writes the rest. Download PDF instantly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={S.page}>
        <div style={S.topBar}>
          <Link href="/" style={S.backLink}>
            ← Back to ResumeBoost AI
          </Link>
        </div>

        <h1 style={S.h1}>AI Resume Builder Online</h1>
        <p style={S.sub}>
          सिर्फ <b>Name + Email + Mobile</b> डालो — बाकी Summary, Skills, Experience AI बना देगा ✅
        </p>

        <div style={S.grid}>
          {/* FORM */}
          <section style={S.card}>
            <h2 style={S.h2}>Basic details (required)</h2>

            <label style={S.label}>Full Name *</label>
            <input
              style={S.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />

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

            <h3 style={S.h3}>Optional (AI will improve it)</h3>

            <label style={S.label}>Job Title (optional)</label>
            <input
              style={S.input}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Sales Executive / Frontend Developer"
            />

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

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={generateAI}
                disabled={generating || !requiredOk}
                style={{ ...S.btn, background: "#0ea5e9", opacity: generating || !requiredOk ? 0.7 : 1 }}
              >
                {generating ? "Generating..." : "Generate Professional Resume (AI)"}
              </button>

              <button
                onClick={downloadPdf}
                disabled={downloading || !requiredOk}
                style={{ ...S.btn, opacity: downloading || !requiredOk ? 0.7 : 1 }}
              >
                {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>

            <p style={S.note}>
              ✅ अगर AI button नहीं दबाओगे, तब भी preview auto‑professional रहेगा (fallback).
            </p>
          </section>

          {/* PREVIEW */}
          <section style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={S.h2}>High‑Professional Preview</h2>
              <span style={S.badge}>{ai ? "AI Generated" : "Auto (Fallback)"}</span>
            </div>
            <pre style={S.preview}>{finalResume}</pre>
          </section>
        </div>
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

const S = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 18, fontFamily: "system-ui" },
  topBar: { marginBottom: 10 },
  backLink: { textDecoration: "none", fontWeight: 800 },
  h1: { margin: "10px 0 0", fontSize: 34, fontWeight: 900 },
  sub: { marginTop: 8, color: "#4b5563" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 18,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 900 },
  h3: { marginTop: 16, marginBottom: 0, fontSize: 13, fontWeight: 900, color: "#374151" },
  label: { display: "block", marginTop: 12, marginBottom: 6, fontWeight: 800, fontSize: 13 },
  input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #d1d5db" },
  textarea: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #d1d5db" },
  row: { display: "flex", gap: 10, marginTop: 6 },
  btn: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  note: { marginTop: 10, fontSize: 12, color: "#6b7280" },
  preview: {
    marginTop: 12,
    whiteSpace: "pre-wrap",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.6,
    minHeight: 420,
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
};
