import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ResumeBuilderOnline() {
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Build resume text for PDF download (simple + ATS friendly)
  const resumeText = useMemo(() => {
    const lines = [];

    if (fullName) lines.push(fullName.toUpperCase());
    if (headline) lines.push(headline);
    const contact = [email, phone, location].filter(Boolean).join(" | ");
    if (contact) lines.push(contact);

    lines.push("");
    if (summary.trim()) {
      lines.push("SUMMARY");
      lines.push(summary.trim());
      lines.push("");
    }

    if (skills.trim()) {
      lines.push("SKILLS");
      // allow comma or newline
      const s = skills
        .split(/,|\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      lines.push(s.join(", "));
      lines.push("");
    }

    if (experience.trim()) {
      lines.push("EXPERIENCE");
      lines.push(experience.trim());
      lines.push("");
    }

    if (education.trim()) {
      lines.push("EDUCATION");
      lines.push(education.trim());
      lines.push("");
    }

    return lines.join("\n");
  }, [fullName, headline, email, phone, location, summary, skills, experience, education]);

  const downloadPdf = async () => {
    try {
      setDownloading(true);

      if (!fullName.trim()) {
        alert("Full name required.");
        return;
      }

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${fullName} - Resume`,
          content: resumeText || `${fullName}\n\n(Empty resume content)`,
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
      a.download = `${fullName.replaceAll(" ", "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || "Download error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Resume Builder Online (ATS Friendly) | ResumeBoost AI</title>
        <meta
          name="description"
          content="Build an ATS-friendly resume online in minutes. Create, preview, and download a professional resume PDF instantly."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.page}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.backLink}>← Back to ResumeBoost AI</Link>
        </div>

        <h1 style={styles.h1}>Resume Builder Online</h1>
        <p style={styles.sub}>
          Create a professional ATS-friendly resume. Fill details → preview → download PDF.
        </p>

        <div style={styles.grid}>
          {/* FORM */}
          <section style={styles.card}>
            <h2 style={styles.h2}>Enter your details</h2>

            <label style={styles.label}>Full Name *</label>
            <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />

            <label style={styles.label}>Headline (e.g. Frontend Developer)</label>
            <input style={styles.input} value={headline} onChange={(e) => setHeadline(e.target.value)} />

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <label style={styles.label}>Location</label>
            <input style={styles.input} value={location} onChange={(e) => setLocation(e.target.value)} />

            <label style={styles.label}>Summary</label>
            <textarea
              style={styles.textarea}
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="2-4 lines about you..."
            />

            <label style={styles.label}>Skills (comma/new line separated)</label>
            <textarea
              style={styles.textarea}
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Next.js, Tailwind, ..."
            />

            <label style={styles.label}>Experience</label>
            <textarea
              style={styles.textarea}
              rows={6}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder={`Company - Role (2023-2025)\n- Achievement...\n- Achievement...`}
            />

            <label style={styles.label}>Education</label>
            <textarea
              style={styles.textarea}
              rows={3}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="B.Tech - Computer Science, 2020-2024"
            />

            <button
              onClick={downloadPdf}
              disabled={downloading}
              style={{ ...styles.btn, opacity: downloading ? 0.8 : 1 }}
            >
              {downloading ? "Generating PDF..." : "Download Resume PDF"}
            </button>

            <p style={styles.note}>
              Tip: ATS ke liye simple text best hota hai (no heavy design).
            </p>
          </section>

          {/* PREVIEW */}
          <section style={styles.card}>
            <h2 style={styles.h2}>Live Preview</h2>
            <pre style={styles.preview}>{resumeText || "Start typing to see preview..."}</pre>
          </section>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 18, fontFamily: "system-ui" },
  topBar: { marginBottom: 10 },
  backLink: { textDecoration: "none", fontWeight: 700 },
  h1: { margin: "10px 0 0", fontSize: 34, fontWeight: 900 },
  sub: { marginTop: 8, color: "#4b5563" },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 18 },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 900 },
  label: { display: "block", marginTop: 12, marginBottom: 6, fontWeight: 700, fontSize: 13 },
  input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #d1d5db" },
  textarea: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #d1d5db" },
  row: { display: "flex", gap: 10, marginTop: 6 },
  btn: {
    marginTop: 14,
    width: "100%",
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
    lineHeight: 1.55,
    minHeight: 320,
  },
};

// Responsive: 2 columns on big screens
if (typeof window !== "undefined") {
  // no-op (kept simple)
}
