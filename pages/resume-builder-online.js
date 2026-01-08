import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ResumeBuilder() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    jobTitle: "",
    experienceYears: "",
    qualification: "",
    experienceDetails: "",
    skills: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Head>
        <title>AI Resume Builder Online – ATS Friendly</title>
        <meta
          name="description"
          content="Create a professional ATS-friendly resume using AI. Just enter name, email & mobile. AI writes summary, skills & experience."
        />
      </Head>

      <main style={styles.page}>
        <div style={styles.container}>
          <Link href="/" style={styles.back}>← Back to ResumeBoost AI</Link>

          <h1 style={styles.title}>AI Resume Builder Online</h1>
          <p style={styles.subtitle}>
            Sirf <b>Name + Email + Mobile</b> dalo — baaki sab AI bana dega ✅
          </p>

          {/* BASIC DETAILS */}
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Basic Details (Required)</h2>

            <input
              name="name"
              placeholder="Full Name (e.g. Rahul Sharma)"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />

            <div style={styles.row}>
              <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                name="mobile"
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </section>

          {/* OPTIONAL DETAILS */}
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>
              Optional Details <span style={styles.aiTag}>AI will improve</span>
            </h2>

            <input
              name="jobTitle"
              placeholder="Job Title (optional – AI will choose best)"
              value={form.jobTitle}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="experienceYears"
              placeholder="Experience in Years (e.g. 0 / 1 / 3)"
              value={form.experienceYears}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="qualification"
              placeholder="Qualification (e.g. Bachelor’s Degree)"
              value={form.qualification}
              onChange={handleChange}
              style={styles.input}
            />

            <textarea
              name="experienceDetails"
              placeholder="Experience details (optional – AI will write professionally)"
              value={form.experienceDetails}
              onChange={handleChange}
              style={styles.textarea}
              rows={4}
            />

            <textarea
              name="skills"
              placeholder="Skills (optional, comma separated – AI will optimize)"
              value={form.skills}
              onChange={handleChange}
              style={styles.textarea}
              rows={3}
            />
          </section>

          {/* ACTIONS */}
          <section style={styles.actions}>
            <button style={styles.primaryBtn}>
              ✨ Build My Professional Resume (AI)
            </button>
            <button style={styles.secondaryBtn}>
              Download High‑Quality PDF
            </button>
          </section>

          <p style={styles.note}>
            ✔ ATS‑Friendly &nbsp; ✔ Recruiter Approved &nbsp; ✔ One‑Page Resume
          </p>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily: "system-ui",
    padding: 20,
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
    background: "#fff",
    padding: 28,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  back: {
    display: "inline-block",
    marginBottom: 10,
    color: "#2563eb",
    fontWeight: 600,
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 6,
    color: "#4b5563",
    fontSize: 14,
  },
  card: {
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 12,
  },
  aiTag: {
    fontSize: 11,
    background: "#16a34a",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 999,
    marginLeft: 8,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    resize: "vertical",
  },
  row: {
    display: "flex",
    gap: 12,
  },
  actions: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    flex: 1,
    padding: "14px 16px",
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    flex: 1,
    padding: "14px 16px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
  },
  note: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
    color: "#6b7280",
  },
};
