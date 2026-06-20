import { useState } from "react";
import { useAuth } from "./AuthContext";

const C = {
  teal: "#3BAF9F",
  blue: "#1E73BE",
  orange: "#F5A623",
  purple: "#A78BFA",
  dark: {
    bg: "#0F1117",
    card: "#16191F",
    elevated: "#1E2230",
    border: "#2A2F3D",
    text: "#E2E8F0",
    muted: "#6B7A99",
    subtle: "#3D4558",
  },
};

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special char", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthColors = ["#F87171", "#F5A623", "#3BAF9F", "#A78BFA"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const color = password.length === 0 ? C.dark.border : strengthColors[score - 1] || "#F87171";

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 4,
            background: i < score ? color : C.dark.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        {password && (
          <span style={{ fontSize: 11, color, fontWeight: 600 }}>
            {strengthLabels[score - 1] || "Too weak"}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {checks.map((c) => (
          <span key={c.label} style={{
            fontSize: 10, fontWeight: 600,
            padding: "2px 8px", borderRadius: 20,
            background: c.ok ? `${C.teal}18` : C.dark.elevated,
            border: `1px solid ${c.ok ? C.teal + "44" : C.dark.border}`,
            color: c.ok ? C.teal : C.dark.muted,
            transition: "all 0.2s",
          }}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2)
      return "Please enter your full name (at least 2 characters)";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return "Please enter a valid email address";
    if (form.password.length < 8)
      return "Password must be at least 8 characters";
    if (form.password !== form.confirm)
      return "Passwords do not match";
    if (!agreed)
      return "Please accept the terms to continue";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: focusedField === field ? "rgba(30,115,190,0.08)" : C.dark.elevated,
    border: `1.5px solid ${focusedField === field ? C.blue : C.dark.border}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: C.dark.text,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float { 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-30px) scale(1.2)} }
        .auth-input::placeholder { color: ${C.dark.muted}; }
        .reg-card { animation: fadeSlideIn 0.5s ease forwards; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,175,159,0.3) !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.dark.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.teal}0D 0%, transparent 70%)`,
          top: "-200px", right: "-100px",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.purple}0A 0%, transparent 70%)`,
          bottom: "-100px", left: "-100px",
          pointerEvents: "none",
        }} />

        <div className="reg-card" style={{
          width: "100%",
          maxWidth: 520,
          background: C.dark.card,
          border: `1px solid ${C.dark.border}`,
          borderRadius: 24,
          padding: "40px 44px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60,
              background: `linear-gradient(135deg, ${C.teal}33, ${C.blue}22)`,
              border: `1px solid ${C.teal}44`,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 26,
            }}>
              🔬
            </div>
            <h2 style={{
              fontSize: 26, fontWeight: 700,
              color: C.dark.text,
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
            }}>
              Create your account
            </h2>
            <p style={{ color: C.dark.muted, fontSize: 14 }}>
              Join Micro Virtual Lab — it's free
            </p>
          </div>

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8892A4", marginBottom: 7, letterSpacing: "0.04em" }}>
                FULL NAME
              </label>
              <input
                className="auth-input"
                placeholder="Your full name"
                value={form.name}
                onChange={update("name")}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle("name")}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8892A4", marginBottom: 7, letterSpacing: "0.04em" }}>
                EMAIL ADDRESS
              </label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle("email")}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8892A4", marginBottom: 7, letterSpacing: "0.04em" }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPwd ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={update("password")}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle("password"), paddingRight: 48 }}
                  autoComplete="new-password"
                />
                <button
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.dark.muted, cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center",
                  }}
                >
                  <EyeIcon visible={showPwd} />
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8892A4", marginBottom: 7, letterSpacing: "0.04em" }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  style={{
                    ...inputStyle("confirm"),
                    paddingRight: 48,
                    borderColor: form.confirm && form.confirm !== form.password
                      ? "#F87171"
                      : form.confirm && form.confirm === form.password
                        ? C.teal
                        : focusedField === "confirm" ? C.blue : C.dark.border,
                  }}
                  autoComplete="new-password"
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.dark.muted, cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center",
                  }}
                >
                  <EyeIcon visible={showConfirm} />
                </button>
                {form.confirm && (
                  <span style={{
                    position: "absolute", right: 46, top: "50%", transform: "translateY(-50%)",
                    fontSize: 16,
                  }}>
                    {form.confirm === form.password ? "✅" : "❌"}
                  </span>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                cursor: "pointer", padding: "12px 14px",
                background: agreed ? `${C.teal}0D` : C.dark.elevated,
                border: `1.5px solid ${agreed ? C.teal + "44" : C.dark.border}`,
                borderRadius: 12,
                transition: "all 0.2s",
                userSelect: "none",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: agreed ? C.teal : "transparent",
                border: `2px solid ${agreed ? C.teal : C.dark.subtle}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                marginTop: 1,
              }}>
                {agreed && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: C.dark.muted, lineHeight: 1.5 }}>
                I agree to the{" "}
                <span style={{ color: C.teal }}>Terms of Service</span>
                {" "}and{" "}
                <span style={{ color: C.teal }}>Privacy Policy</span>
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 10,
                color: "#F87171", fontSize: 13,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "14px 0",
                borderRadius: 12,
                background: loading
                  ? C.dark.elevated
                  : `linear-gradient(135deg, ${C.teal}, ${C.blue})`,
                border: "none",
                color: loading ? C.dark.muted : "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontFamily: "inherit",
                letterSpacing: "0.02em",
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: `2px solid ${C.dark.muted}`,
                    borderTopColor: C.teal,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Creating account...
                </>
              ) : "Create Account →"}
            </button>
          </div>

          {/* Switch to login */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: C.dark.muted }}>
            Already have an account?{" "}
            <button
              onClick={onSwitch}
              style={{
                background: "none", border: "none",
                color: C.teal, fontWeight: 700,
                cursor: "pointer", fontSize: 14,
                padding: 0, fontFamily: "inherit",
              }}
            >
              Sign in →
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
