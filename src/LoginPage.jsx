import { useState } from "react";
import { useAuth } from "./AuthContext";

const C = {
  teal: "#3BAF9F",
  blue: "#1E73BE",
  orange: "#F5A623",
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

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.id % 3 === 0 ? C.teal : p.id % 3 === 1 ? C.blue : C.orange,
            opacity: p.opacity,
            animation: `float ${p.duration}s ${p.delay}s infinite ease-in-out alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault?.();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: focusedField === field ? "rgba(30,115,190,0.08)" : C.dark.elevated,
    border: `1.5px solid ${focusedField === field ? C.blue : C.dark.border}`,
    borderRadius: 12,
    padding: "14px 16px",
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes float { 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-30px) scale(1.2)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
        .auth-input:focus { outline: none !important; }
        .auth-input::placeholder { color: ${C.dark.muted}; }
        .link-btn:hover { color: ${C.teal} !important; text-decoration: underline; }
        .login-card { animation: fadeSlideIn 0.5s ease forwards; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,175,159,0.3) !important; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.dark.bg,
        display: "flex",
        position: "relative",
        fontFamily: "'Space Grotesk', sans-serif",
        overflow: "hidden",
      }}>
        <FloatingParticles />

        {/* Left decorative panel */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 40px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glowing orbs */}
          <div style={{
            position: "absolute", width: 400, height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.teal}22 0%, transparent 70%)`,
            top: "10%", left: "10%",
          }} />
          <div style={{
            position: "absolute", width: 300, height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.blue}18 0%, transparent 70%)`,
            bottom: "15%", right: "5%",
          }} />
          <div style={{
            position: "absolute", width: 200, height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.orange}15 0%, transparent 70%)`,
            top: "60%", left: "30%",
          }} />

          <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420 }}>
            {/* Logo */}
            <div style={{
              width: 72, height: 72,
              background: `linear-gradient(135deg, ${C.teal}33, ${C.blue}22)`,
              border: `1px solid ${C.teal}44`,
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              fontSize: 32,
              boxShadow: `0 0 40px ${C.teal}22`,
            }}>
              🔬
            </div>

            <h1 style={{
              fontSize: 42, fontWeight: 700,
              background: `linear-gradient(135deg, #E2E8F0 0%, ${C.teal} 50%, ${C.blue} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}>
              Micro Virtual<br />Lab
            </h1>

            <p style={{ color: C.dark.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
              Your interactive engineering & science laboratory.<br />
              Explore. Experiment. Learn.
            </p>

            {/* Feature badges */}
            {[
              { icon: "⚡", text: "Electrical Engineering Simulations" },
              { icon: "🎛️", text: "Control Systems Analysis" },
              { icon: "📐", text: "Mathematics & Statistics Tools" },
              { icon: "🤖", text: "AI-Powered Lab Assistant" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px",
                background: C.dark.card,
                border: `1px solid ${C.dark.border}`,
                borderRadius: 12,
                marginBottom: 8,
                textAlign: "left",
                animation: `fadeSlideIn 0.5s ${0.1 * i + 0.3}s both`,
              }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "#A0AEC0" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 1,
          background: `linear-gradient(to bottom, transparent, ${C.dark.border}, transparent)`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: 32, height: 32,
            background: C.dark.bg,
            border: `1px solid ${C.dark.border}`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: C.dark.muted,
          }}>or</div>
        </div>

        {/* Right — Login form */}
        <div style={{
          width: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          flexShrink: 0,
        }}>
          <div className="login-card">
            <div style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: 28, fontWeight: 700,
                color: C.dark.text,
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}>
                Welcome back 👋
              </h2>
              <p style={{ color: C.dark.muted, fontSize: 14 }}>
                Sign in to continue to your virtual lab
              </p>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8892A4", marginBottom: 7, letterSpacing: "0.03em" }}>
                  EMAIL ADDRESS
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                  style={inputStyle("email")}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#8892A4", letterSpacing: "0.03em" }}>
                    PASSWORD
                  </label>
                  <button
                    className="link-btn"
                    onClick={() => {}}
                    style={{ background: "none", border: "none", color: C.dark.muted, fontSize: 12, cursor: "pointer", padding: 0, transition: "color 0.2s" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    className="auth-input"
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                    style={{ ...inputStyle("password"), paddingRight: 48 }}
                    autoComplete="current-password"
                  />
                  <button
                    onClick={() => setShowPwd(!showPwd)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", color: C.dark.muted, cursor: "pointer",
                      padding: 4, display: "flex", alignItems: "center",
                    }}
                  >
                    <EyeIcon visible={showPwd} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 14px",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: 10,
                  color: "#F87171",
                  fontSize: 13,
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
                  marginTop: 4,
                  letterSpacing: "0.02em",
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
                    Signing in...
                  </>
                ) : "Sign In →"}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: C.dark.border }} />
                <span style={{ color: C.dark.muted, fontSize: 12 }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.dark.border }} />
              </div>

              {/* Demo account */}
              <button
                onClick={() => { setEmail("demo@mvlab.io"); setPassword("demo1234"); }}
                style={{
                  width: "100%", padding: "13px 0",
                  borderRadius: 12,
                  background: "transparent",
                  border: `1.5px solid ${C.dark.border}`,
                  color: C.dark.muted,
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.teal + "66";
                  e.currentTarget.style.color = C.teal;
                  e.currentTarget.style.background = C.teal + "0D";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.dark.border;
                  e.currentTarget.style.color = C.dark.muted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                🧪 Use Demo Account
              </button>
            </div>

            {/* Switch to register */}
            <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: C.dark.muted }}>
              Don't have an account?{" "}
              <button
                className="link-btn"
                onClick={onSwitch}
                style={{
                  background: "none", border: "none",
                  color: C.teal, fontWeight: 700,
                  cursor: "pointer", fontSize: 14,
                  padding: 0, transition: "color 0.2s",
                  fontFamily: "inherit",
                }}
              >
                Create account →
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
