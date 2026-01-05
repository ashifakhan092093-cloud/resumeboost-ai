import { useEffect, useState } from "react";

export default function Home() {
  const [jobDesc, setJobDesc] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 🔒 Lock: free users will NOT see optimized full text
  const [isLocked, setIsLocked] = useState(true);
  const [paying, setPaying] = useState(false);

  // Load Razorpay checkout script
  useEffect(() => {
    const id = "razorpay-checkout-js";
    if (document.getElementById(id)) return;

    const script = document.createElement("script");
    script.id = id;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleCheck = async () => {
    setError("");
    setResult(null);
    setIsLocked(true);

    if (!resume) return setError("Please upload your resume (PDF/DOCX).");
    if (!jobDesc.trim()) return setError("Please paste the job description.");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDesc", jobDesc);

      const r = await fetch("/api/optimize", {
        method: "POST",
        body: formData,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Something went wrong");

      setResult(data);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ PDF download (called after payment success / unlock)
  const downloadPdf = async () => {
    try {
      if (!result?.optimizedResumeText) {
        return alert("No optimized resume text found.");
      }

      const r = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "ResumeBoost AI – Optimized Resume",
          content: result.optimizedResumeText,
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return alert(err?.error || "Download failed");
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized-resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Download error");
    }
  };

  const startPayment = async () => {
    try {
      setPaying(true);

      if (!result?.optimizedResumeText) {
        setPaying(false);
        return alert("Pehle ATS score generate karo.");
      }

      if (!window.Razorpay) {
        setPaying(false);
        return alert("Razorpay script load nahi hua. Page refresh karo.");
      }

      // 1) Create order (server)
      const orderRes = await fetch("/api/create-order", { method: "POST" });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Order create failed");

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key: key || orderData.key || undefined,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ResumeBoost AI",
        description: "Optimized Resume PDF Download",
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 2) Verify payment (server)
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData?.error || "Payment verify failed");

            // 3) Unlock + auto download
            setIsLocked(false);
            await downloadPdf();
          } catch (e) {
            alert(e.message || "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        theme: { color: "#f59e0b" },
      };

      if (!options.key) {
        setPaying(false);
        return alert("NEXT_PUBLIC_RAZORPAY_KEY_ID missing. Render env me add karo.");
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setPaying(false);
        alert("Payment failed. Try again.");
      });

      rzp.open();
    } catch (e) {
      setPaying(false);
      alert(e.message || "Payment start failed");
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>ResumeBoost AI</h1>
        <p style={styles.subtitle}>Optimize your resume for ATS in seconds.</p>

        {/* ✅ Internal SEO link */}
        <p style={{ textAlign: "center", marginTop: 10 }}>
          <a href="/resume-builder-online" style={styles.topLink}>
            Resume Builder Online
          </a>
        </p>

        <div style={styles.form}>
          <label style={styles.label}>Upload Resume (PDF / DOCX)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />

          <label style={styles.label}>Paste Job Description</label>
          <textarea
            rows="6"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            style={styles.textarea}
          />

          {error ? <p style={styles.error}>{error}</p> : null}

          <button
            style={{ ...styles.button, opacity: loading ? 0.8 : 1 }}
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check ATS Score"}
          </button>

          <p style={styles.note}>Free check • No signup required</p>
        </div>

        {result ? (
          <div style={styles.resultBox}>
            <h2 style={styles.resultTitle}>ATS Score: {result.score}/100</h2>
            <p style={styles.resultText}>{result.summary}</p>

            <h3 style={styles.resultHeading}>Missing keywords</h3>
            <ul style={styles.ul}>
              {(Array.isArray(result.missingKeywords) ? result.missingKeywords : []).map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>

            <h3 style={styles.resultHeading}>Quick tips</h3>
            <ul style={styles.ul}>
              {(Array.isArray(result.tips) ? result.tips : []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>

            <h3 style={styles.resultHeading}>Optimized resume</h3>

            {isLocked ? (
              <div style={styles.lockBox}>
                <p style={{ fontWeight: 800, marginBottom: 6 }}>
                  🔒 Optimized resume is locked
                </p>
                <p style={{ fontSize: 13, color: "#4b5563", margin: 0 }}>
                  Pay once to unlock full resume + PDF download.
                </p>

                <button
                  style={{
                    ...styles.payButton,
                    opacity: paying ? 0.85 : 1,
                    cursor: paying ? "not-allowed" : "pointer",
                  }}
                  onClick={startPayment}
                  disabled={paying}
                >
                  {paying ? "Opening payment..." : "Download Optimized Resume – ₹199"}
                </button>

                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
                  Test mode me UPI/Card fake payment test kar sakte ho.
                </p>
              </div>
            ) : (
              <div>
                <pre style={styles.pre}>{result.optimizedResumeText}</pre>
                <div style={{ marginTop: 10 }}>
                  <button style={styles.secondaryBtn} onClick={downloadPdf}>
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 700,
    background: "#fff",
    padding: 32,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: "#16a34a",
    textAlign: "center",
    margin: 0,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#4b5563",
  },
  topLink: {
    fontWeight: 800,
    textDecoration: "underline",
  },
  form: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: { fontWeight: 600, fontSize: 14 },
  textarea: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    padding: "12px 16px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  note: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  error: { color: "#dc2626", fontSize: 13, marginTop: 4 },
  resultBox: {
    marginTop: 24,
    paddingTop: 18,
    borderTop: "1px solid #e5e7eb",
  },
  resultTitle: { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  resultText: { color: "#374151", fontSize: 14, lineHeight: 1.6 },
  resultHeading: { marginTop: 14, fontSize: 14, fontWeight: 800 },
  ul: { marginTop: 6, paddingLeft: 18, color: "#374151", fontSize: 14 },
  pre: {
    marginTop: 8,
    whiteSpace: "pre-wrap",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.5,
  },
  lockBox: {
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    border: "1px dashed #9ca3af",
    background: "#f9fafb",
    textAlign: "center",
  },
  payButton: {
    marginTop: 12,
    padding: "10px 16px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 900,
  },
  secondaryBtn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },
};
