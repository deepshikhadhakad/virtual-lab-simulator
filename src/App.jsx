import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";


// ── Color system
const C = {
  blue: "#1E73BE",
  darkGray: "#2C2F36",
  teal: "#3BAF9F",
  orange: "#F5A623",
  light: "#EAEDF0",
  dark: {
    bg: "#1A1D23",
    card: "#22262E",
    border: "#333842",
    text: "#E2E8F0",
    muted: "#8892A4",
  },
  lt: {
    bg: "#F4F6F9",
    card: "#FFFFFF",
    border: "#D1D9E6",
    text: "#1E2432",
    muted: "#6B7A99",
  },
};

//  Utility
const round = (n, d = 3) => +n.toFixed(d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

//  AI Chat via Anthropic API
async function askAI(messages) {
  try {
    const token = localStorage.getItem("mvlab_token") || "";
    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("API error:", data);
      return `⚠️ ${data.error || "Server error"}`;
    }

    return data.reply || "⚠️ No response from AI";
  } catch (error) {
    console.error("Error:", error);
    return "⚠️ Connection error — make sure the backend server is running on port 5000.";
  }
}
// THEME CONTEXT

import { createContext, useContext } from "react";
const ThemeCtx = createContext("dark");
const useTheme = () => useContext(ThemeCtx);

function useColors() {
  const t = useTheme();
  return t === "dark" ? C.dark : C.lt;
}

// MINI SVG CHART (inline, no library)

function LineChart({
  data,
  color = C.teal,
  label = "",
  h = 120,
  xLabel = "",
  yLabel = "",
}) {
  if (!data || data.length < 2) return null;
  const w = 320;
  const pad = { t: 16, r: 16, b: 36, l: 44 };
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const minX = data[0].x,
    maxX = data[data.length - 1].x;
  const px = (x) =>
    pad.l + ((x - minX) / (maxX - minX || 1)) * (w - pad.l - pad.r);
  const py = (y) =>
    pad.t + (1 - (y - minY) / (maxY - minY || 1)) * (h - pad.t - pad.b);
  const pts = data.map((d) => `${px(d.x)},${py(d.y)}`).join(" ");
  const fillPts = `${px(minX)},${py(minY)} ${pts} ${px(maxX)},${py(minY)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`g${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.t + t * (h - pad.t - pad.b);
        const val = maxY - t * (maxY - minY);
        return (
          <g key={t}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke="#ffffff18"
              strokeWidth="0.5"
            />
            <text
              x={pad.l - 4}
              y={y + 4}
              fontSize="9"
              fill="#8892A4"
              textAnchor="end"
            >
              {round(val, 1)}
            </text>
          </g>
        );
      })}
      {/* Fill */}
      <polygon points={fillPts} fill={`url(#g${color})`} />
      {/* Line */}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Axes labels */}
      {xLabel && (
        <text
          x={w / 2}
          y={h - 2}
          fontSize="9"
          fill="#8892A4"
          textAnchor="middle"
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={8}
          y={h / 2}
          fontSize="9"
          fill="#8892A4"
          textAnchor="middle"
          transform={`rotate(-90, 8, ${h / 2})`}
        >
          {yLabel}
        </text>
      )}
      {label && (
        <text
          x={pad.l + 4}
          y={pad.t + 12}
          fontSize="10"
          fill={color}
          fontWeight="600"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

function BarChart({ bars, color = C.teal, h = 120 }) {
  const w = 320,
    pad = { t: 16, r: 16, b: 36, l: 44 };
  const maxV = Math.max(...bars.map((b) => b.v), 0.001);
  const bw = ((w - pad.l - pad.r) / bars.length) * 0.6;
  const gap = (w - pad.l - pad.r) / bars.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {bars.map((b, i) => {
        const bh = (b.v / maxV) * (h - pad.t - pad.b);
        const x = pad.l + gap * i + (gap - bw) / 2;
        const y = h - pad.b - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={bh}
              fill={color}
              rx="3"
              opacity="0.85"
            />
            <text
              x={x + bw / 2}
              y={h - pad.b + 12}
              fontSize="9"
              fill="#8892A4"
              textAnchor="middle"
            >
              {b.label}
            </text>
            <text
              x={x + bw / 2}
              y={y - 4}
              fontSize="9"
              fill={color}
              textAnchor="middle"
            >
              {round(b.v, 2)}
            </text>
          </g>
        );
      })}
      <line
        x1={pad.l}
        y1={pad.t}
        x2={pad.l}
        y2={h - pad.b}
        stroke="#ffffff20"
        strokeWidth="0.5"
      />
      <line
        x1={pad.l}
        y1={h - pad.b}
        x2={w - pad.r}
        y2={h - pad.b}
        stroke="#ffffff20"
        strokeWidth="0.5"
      />
    </svg>
  );
}

// SHARED UI

function Card({ children, style }) {
  const cl = useColors();
  return (
    <div
      style={{
        background: cl.card,
        border: `1px solid ${cl.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children, style }) {
  const cl = useColors();
  return (
    <label
      style={{
        fontSize: 12,
        color: cl.muted,
        display: "block",
        marginBottom: 6,
        fontWeight: 500,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {children}
    </label>
  );
}

function Slider({ label, min, max, step = 1, value, onChange, unit = "" }) {
  const cl = useColors();
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Label style={{ margin: 0 }}>{label}</Label>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: C.teal }}
      />
    </div>
  );
}

function MetricBox({ label, value, unit = "", color = C.teal }) {
  const cl = useColors();
  return (
    <div
      style={{
        background: cl.bg,
        border: `1px solid ${cl.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: cl.muted,
          marginBottom: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
        <span style={{ fontSize: 13, marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div
      style={{
        background: `${C.blue}18`,
        border: `1px solid ${C.blue}44`,
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 12.5,
        lineHeight: 1.65,
        color: "#a8c4e0",
        marginTop: 10,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: C.teal,
        marginBottom: 14,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  );
}

// MODULE: ELECTRICAL ENGINEERING

function ElectricalLab() {
  const [tab, setTab] = useState("ohm");
  const tabs = [
    { id: "ohm", label: "Ohm's Law" },
    { id: "power", label: "AC Power" },
    { id: "rlc", label: "RLC Circuit" },
    { id: "wave", label: "Waveforms" },
  ];
  return (
    <div>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? C.blue : "#333842"}`,
              background: tab === t.id ? `${C.blue}22` : "transparent",
              color: tab === t.id ? C.blue : "#8892A4",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "ohm" && <OhmLab />}
      {tab === "power" && <PowerLab />}
      {tab === "rlc" && <RLCLab />}
      {tab === "wave" && <WaveLab />}
    </div>
  );
}

function OhmLab() {
  const [V, setV] = useState(12);
  const [R, setR] = useState(100);
  const I = round(V / R, 4);
  const P = round(V * I, 4);
  const data = Array.from({ length: 50 }, (_, i) => {
    const r = 10 + i * 10;
    return { x: r, y: V / r };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <SectionTitle>Controls</SectionTitle>
        <Slider
          label="Voltage (V)"
          min={1}
          max={100}
          value={V}
          onChange={setV}
          unit="V"
        />
        <Slider
          label="Resistance (Ω)"
          min={10}
          max={1000}
          step={10}
          value={R}
          onChange={setR}
          unit="Ω"
        />
        <InfoBox>
          V = IR → I = V/R = {V}/{R} = <strong>{I} A</strong>
          <br />P = V·I = {V}·{I} = <strong>{P} W</strong>
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Results</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <MetricBox label="Current" value={I} unit="A" color={C.teal} />
          <MetricBox label="Power" value={P} unit="W" color={C.orange} />
        </div>
        <LineChart
          data={data}
          color={C.teal}
          label="I vs R"
          xLabel="Resistance (Ω)"
          yLabel="Current (A)"
        />
      </Card>
    </div>
  );
}

function PowerLab() {
  const [V, setV] = useState(230);
  const [I, setI] = useState(10);
  const [pf, setPf] = useState(0.8);
  const S = round(V * I, 2);
  const P = round(S * pf, 2);
  const Q = round(S * Math.sqrt(1 - pf * pf), 2);
  const theta = round((Math.acos(pf) * 180) / Math.PI, 1);
  const bars = [
    { label: "S (kVA)", v: S / 1000 },
    { label: "P (kW)", v: P / 1000 },
    { label: "Q (kVAR)", v: Q / 1000 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <SectionTitle>AC Power</SectionTitle>
        <Slider
          label="Voltage"
          min={100}
          max={480}
          value={V}
          onChange={setV}
          unit="V"
        />
        <Slider
          label="Current"
          min={1}
          max={100}
          value={I}
          onChange={setI}
          unit="A"
        />
        <Slider
          label="Power Factor"
          min={0.1}
          max={1}
          step={0.01}
          value={pf}
          onChange={setPf}
        />
        <InfoBox>
          θ = cos⁻¹(PF) = <strong>{theta}°</strong>
          <br />S = V·I = <strong>{S} VA</strong>
          <br />P = S·cos(θ) = <strong>{P} W</strong>
          <br />Q = S·sin(θ) = <strong>{Q} VAR</strong>
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Power Triangle</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <MetricBox label="Apparent S" value={round(S / 1000, 2)} unit="kVA" />
          <MetricBox
            label="Real P"
            value={round(P / 1000, 2)}
            unit="kW"
            color={C.teal}
          />
          <MetricBox
            label="Reactive Q"
            value={round(Q / 1000, 2)}
            unit="kVAR"
            color={C.orange}
          />
        </div>
        <BarChart bars={bars} color={C.blue} />
        <PowerTriangleSVG P={P} Q={Q} S={S} />
      </Card>
    </div>
  );
}

function PowerTriangleSVG({ P, Q, S }) {
  const scale = 120 / Math.max(P, Q, S, 1);
  const pw = P * scale,
    qh = Q * scale;
  return (
    <svg viewBox="0 0 240 140" width="100%" style={{ marginTop: 10 }}>
      <line
        x1="20"
        y1="110"
        x2={20 + pw}
        y2="110"
        stroke={C.teal}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1={20 + pw}
        y1="110"
        x2={20 + pw}
        y2={110 - qh}
        stroke={C.orange}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="110"
        x2={20 + pw}
        y2={110 - qh}
        stroke={C.blue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
      <text
        x={20 + pw / 2}
        y={126}
        fontSize="10"
        fill={C.teal}
        textAnchor="middle"
      >
        P (Real)
      </text>
      <text
        x={20 + pw + 16}
        y={110 - qh / 2}
        fontSize="10"
        fill={C.orange}
        textAnchor="start"
      >
        Q
      </text>
      <text
        x={20 + pw / 2 - 10}
        y={110 - qh / 2 - 6}
        fontSize="10"
        fill={C.blue}
        textAnchor="middle"
      >
        S (Apparent)
      </text>
    </svg>
  );
}

function RLCLab() {
  const [R, setR] = useState(10);
  const [L, setL] = useState(0.1);
  const [C2, setC2] = useState(100e-6);
  const [freq, setFreq] = useState(50);
  const w = 2 * Math.PI * freq;
  const XL = round(w * L, 3);
  const XC = round(1 / (w * C2), 3);
  const Z = round(Math.sqrt(R * R + (XL - XC) ** 2), 3);
  const f0 = round(1 / (2 * Math.PI * Math.sqrt(L * C2)), 2);
  const data = Array.from({ length: 80 }, (_, i) => {
    const f = 1 + i * 20;
    const ww = 2 * Math.PI * f;
    const xl = ww * L,
      xc = 1 / (ww * C2);
    return { x: f, y: Math.sqrt(R * R + (xl - xc) ** 2) };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <SectionTitle>RLC Parameters</SectionTitle>
        <Slider
          label="Resistance R"
          min={1}
          max={100}
          value={R}
          onChange={setR}
          unit="Ω"
        />
        <Slider
          label="Inductance L"
          min={0.01}
          max={1}
          step={0.01}
          value={L}
          onChange={setL}
          unit="H"
        />
        <Slider
          label="Capacitance C (μF)"
          min={10}
          max={1000}
          step={10}
          value={C2 * 1e6}
          onChange={(v) => setC2(v * 1e-6)}
          unit="μF"
        />
        <Slider
          label="Frequency"
          min={1}
          max={500}
          value={freq}
          onChange={setFreq}
          unit="Hz"
        />
        <InfoBox>
          Resonant freq f₀ = 1/(2π√LC) = <strong>{f0} Hz</strong>
          <br />
          At f₀, XL = XC → Z = R = <strong>{R}Ω</strong>
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Impedance Analysis</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <MetricBox label="XL" value={XL} unit="Ω" color={C.teal} />
          <MetricBox label="XC" value={XC} unit="Ω" color={C.orange} />
          <MetricBox label="|Z|" value={Z} unit="Ω" color={C.blue} />
        </div>
        <LineChart
          data={data}
          color={C.teal}
          label="Impedance vs Frequency"
          xLabel="Frequency (Hz)"
          yLabel="|Z| (Ω)"
        />
      </Card>
    </div>
  );
}

function WaveLab() {
  const [amp, setAmp] = useState(5);
  const [freq, setFreq] = useState(50);
  const [waveType, setWaveType] = useState("sine");
  const [duty, setDuty] = useState(50);
  const T = 1 / freq;
  const pts = Array.from({ length: 200 }, (_, i) => {
    const t = (i / 199) * 3 * T;
    let y;
    if (waveType === "sine") y = amp * Math.sin(2 * Math.PI * freq * t);
    else if (waveType === "square")
      y = amp * Math.sign(Math.sin(2 * Math.PI * freq * t));
    else {
      const phase = (t * freq) % 1;
      y = amp * (phase < duty / 100 ? 1 : -1);
    }
    return { x: t * 1000, y };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
      <Card>
        <SectionTitle>Waveform Settings</SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["sine", "square", "pwm"].map((w) => (
            <button
              key={w}
              onClick={() => setWaveType(w)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: `1px solid ${waveType === w ? C.teal : "#333842"}`,
                background: waveType === w ? `${C.teal}22` : "transparent",
                color: waveType === w ? C.teal : "#8892A4",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {w.toUpperCase()}
            </button>
          ))}
        </div>
        <Slider
          label="Amplitude"
          min={0.5}
          max={20}
          step={0.5}
          value={amp}
          onChange={setAmp}
          unit="V"
        />
        <Slider
          label="Frequency"
          min={5}
          max={500}
          value={freq}
          onChange={setFreq}
          unit="Hz"
        />
        {waveType === "pwm" && (
          <Slider
            label="Duty Cycle"
            min={5}
            max={95}
            value={duty}
            onChange={setDuty}
            unit="%"
          />
        )}
        <InfoBox>
          Period T = 1/f = {round(T * 1000, 3)} ms
          <br />ω = 2πf = {round(2 * Math.PI * freq, 2)} rad/s
          <br />
          {waveType === "sine" && (
            <>
              Vrms = Vpk/√2 = <strong>{round(amp / Math.sqrt(2), 3)} V</strong>
            </>
          )}
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Waveform</SectionTitle>
        <LineChart
          data={pts}
          color={
            waveType === "sine"
              ? C.teal
              : waveType === "square"
                ? C.orange
                : C.blue
          }
          label={`${waveType.toUpperCase()} — ${amp}V @ ${freq}Hz`}
          xLabel="Time (ms)"
          yLabel="Voltage (V)"
          h={160}
        />
      </Card>
    </div>
  );
}

// MODULE: CONTROL SYSTEMS

function ControlLab() {
  const [tab, setTab] = useState("first");
  const tabs = [
    { id: "first", label: "1st Order" },
    { id: "second", label: "2nd Order" },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? C.blue : "#333842"}`,
              background: tab === t.id ? `${C.blue}22` : "transparent",
              color: tab === t.id ? C.blue : "#8892A4",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "first" && <FirstOrder />}
      {tab === "second" && <SecondOrder />}
    </div>
  );
}

function FirstOrder() {
  const [K, setK] = useState(2);
  const [tau, setTau] = useState(1);
  const [input, setInput] = useState("step");
  const tEnd = 5 * tau;
  const data = Array.from({ length: 200 }, (_, i) => {
    const t = (i / 199) * tEnd;
    let y;
    if (input === "step") y = K * (1 - Math.exp(-t / tau));
    else if (input === "ramp") y = K * (t - tau * (1 - Math.exp(-t / tau)));
    else y = (K / tau) * Math.exp(-t / tau);
    return { x: t, y };
  });
  const rise = round(tau * Math.log(9), 3);
  const settle = round(4 * tau, 3);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
      <Card>
        <SectionTitle>First-Order System: K/(τs+1)</SectionTitle>
        <Slider
          label="Gain K"
          min={0.1}
          max={5}
          step={0.1}
          value={K}
          onChange={setK}
        />
        <Slider
          label="Time Constant τ (s)"
          min={0.1}
          max={5}
          step={0.1}
          value={tau}
          onChange={setTau}
          unit="s"
        />
        <div style={{ marginBottom: 14 }}>
          <Label>Input Type</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {["step", "ramp", "impulse"].map((t) => (
              <button
                key={t}
                onClick={() => setInput(t)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 7,
                  border: `1px solid ${input === t ? C.teal : "#333842"}`,
                  background: input === t ? `${C.teal}22` : "transparent",
                  color: input === t ? C.teal : "#8892A4",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <MetricBox label="Rise Time" value={rise} unit="s" color={C.teal} />
          <MetricBox
            label="Settle Time"
            value={settle}
            unit="s"
            color={C.orange}
          />
        </div>
      </Card>
      <Card>
        <SectionTitle>System Response</SectionTitle>
        <LineChart
          data={data}
          color={C.teal}
          label={`${input} response`}
          xLabel="Time (s)"
          yLabel="Output"
          h={160}
        />
        <InfoBox>
          H(s) = K/(τs+1) = {K}/({}(taus)+1)
          <br />
          Rise time (10→90%): <strong>{rise}s</strong> &nbsp;|&nbsp; Settling
          (2%): <strong>{settle}s</strong>
        </InfoBox>
      </Card>
    </div>
  );
}

function SecondOrder() {
  const [wn, setWn] = useState(2);
  const [zeta, setZeta] = useState(0.5);
  const [K, setK] = useState(1);
  const tEnd = 10 / wn;
  const data = Array.from({ length: 300 }, (_, i) => {
    const t = (i / 299) * tEnd;
    let y;
    if (zeta < 1) {
      const wd = wn * Math.sqrt(1 - zeta * zeta);
      y =
        K *
        (1 -
          Math.exp(-zeta * wn * t) *
            (Math.cos(wd * t) +
              (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t)));
    } else if (zeta === 1) {
      y = K * (1 - (1 + wn * t) * Math.exp(-wn * t));
    } else {
      const s1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
      const s2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
      y =
        K *
        (1 +
          (s2 / (s1 - s2)) * Math.exp(s1 * t) -
          (s1 / (s1 - s2)) * Math.exp(s2 * t));
    }
    return { x: t, y };
  });
  const ys = data.map((d) => d.y);
  const overshoot = zeta < 1 ? round((Math.max(...ys) / K - 1) * 100, 2) : 0;
  const peakT =
    zeta < 1 ? round(Math.PI / (wn * Math.sqrt(1 - zeta * zeta)), 3) : Infinity;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
      <Card>
        <SectionTitle>2nd Order: ωn²/(s²+2ζωns+ωn²)</SectionTitle>
        <Slider
          label="Natural Freq ωn"
          min={0.5}
          max={10}
          step={0.5}
          value={wn}
          onChange={setWn}
          unit=" rad/s"
        />
        <Slider
          label="Damping Ratio ζ"
          min={0.1}
          max={2}
          step={0.05}
          value={zeta}
          onChange={setZeta}
        />
        <Slider
          label="Gain K"
          min={0.1}
          max={3}
          step={0.1}
          value={K}
          onChange={setK}
        />
        <div
          style={{
            marginTop: 10,
            padding: "10px",
            background: `${zeta < 1 ? C.orange : C.teal}18`,
            borderRadius: 8,
            fontSize: 12,
            color: zeta < 1 ? C.orange : C.teal,
            fontWeight: 600,
          }}
        >
          System:{" "}
          {zeta < 1
            ? "⚡ Underdamped"
            : zeta === 1
              ? "✓ Critically damped"
              : "✓ Overdamped"}
        </div>
      </Card>
      <Card>
        <SectionTitle>Step Response</SectionTitle>
        <LineChart
          data={data}
          color={zeta < 1 ? C.orange : C.teal}
          label="Step response"
          xLabel="Time (s)"
          yLabel="Output"
          h={150}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 12,
          }}
        >
          <MetricBox
            label="Overshoot"
            value={overshoot}
            unit="%"
            color={overshoot > 0 ? C.orange : C.teal}
          />
          <MetricBox
            label="Peak Time"
            value={peakT === Infinity ? "∞" : peakT}
            unit={peakT !== Infinity ? "s" : ""}
            color={C.blue}
          />
        </div>
      </Card>
    </div>
  );
}

// MODULE: MATHEMATICS

function MathLab() {
  const [tab, setTab] = useState("algebra");
  const tabs = [
    { id: "algebra", label: "Algebra" },
    { id: "calculus", label: "Calculus" },
    { id: "stats", label: "Statistics" },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? C.blue : "#333842"}`,
              background: tab === t.id ? `${C.blue}22` : "transparent",
              color: tab === t.id ? C.blue : "#8892A4",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "algebra" && <AlgebraLab />}
      {tab === "calculus" && <CalculusLab />}
      {tab === "stats" && <StatsLab />}
    </div>
  );
}

function AlgebraLab() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-3);
  const [cc, setCc] = useState(2);
  const disc = b * b - 4 * a * cc;
  const roots =
    disc >= 0
      ? [
          round((-b + Math.sqrt(disc)) / (2 * a), 4),
          round((-b - Math.sqrt(disc)) / (2 * a), 4),
        ]
      : null;
  const data = Array.from({ length: 100 }, (_, i) => {
    const x = -5 + i * 0.1;
    return { x, y: a * x * x + b * x + cc };
  });
  const vertex = {
    x: round(-b / (2 * a), 3),
    y: round(cc - (b * b) / (4 * a), 3),
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 18 }}>
      <Card>
        <SectionTitle>Quadratic: ax² + bx + c</SectionTitle>
        <Slider
          label="a"
          min={-5}
          max={5}
          step={0.5}
          value={a}
          onChange={setA}
        />
        <Slider
          label="b"
          min={-10}
          max={10}
          step={0.5}
          value={b}
          onChange={setB}
        />
        <Slider
          label="c"
          min={-10}
          max={10}
          step={0.5}
          value={cc}
          onChange={setCc}
        />
        <InfoBox>
          Equation:{" "}
          <strong>
            {a}x² + {b}x + {cc} = 0
          </strong>
          <br />
          Discriminant Δ = b²-4ac ={" "}
          <strong style={{ color: disc >= 0 ? C.teal : C.orange }}>
            {round(disc, 2)}
          </strong>
          <br />
          Vertex:{" "}
          <strong>
            ({vertex.x}, {vertex.y})
          </strong>
          <br />
          {roots ? (
            <>
              Roots: x = <strong>{roots[0]}</strong>,{" "}
              <strong>{roots[1]}</strong>
            </>
          ) : (
            <span style={{ color: C.orange }}>Complex roots (Δ &lt; 0)</span>
          )}
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Parabola Graph</SectionTitle>
        <LineChart
          data={data}
          color={disc >= 0 ? C.teal : C.orange}
          label={`${a}x²+${b}x+${cc}`}
          xLabel="x"
          yLabel="y"
          h={170}
        />
      </Card>
    </div>
  );
}

function CalculusLab() {
  const [fn, setFn] = useState("sin");
  const [scale, setScale] = useState(1);
  const fns = {
    sin: (x) => scale * Math.sin(x),
    cos: (x) => scale * Math.cos(x),
    exp: (x) => (scale * Math.exp(x / 3)) / 5,
    x2: (x) => (scale * x * x) / 10,
    ln: (x) => (x > 0 ? scale * Math.log(x) : NaN),
  };
  const f = fns[fn];
  const dx = 0.05;
  const xs = Array.from({ length: 100 }, (_, i) => -5 + i * 0.1);
  const fnData = xs.filter((x) => !isNaN(f(x))).map((x) => ({ x, y: f(x) }));
  const deriv = xs
    .filter((x) => !isNaN(f(x + dx)) && !isNaN(f(x)))
    .map((x) => ({ x, y: (f(x + dx) - f(x)) / dx }));
  const integ = (() => {
    let acc = 0;
    return xs
      .filter((x) => !isNaN(f(x)))
      .map((x) => {
        acc += f(x) * 0.1;
        return { x, y: acc };
      });
  })();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card>
        <SectionTitle>Function</SectionTitle>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {Object.keys(fns).map((k) => (
            <button
              key={k}
              onClick={() => setFn(k)}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${fn === k ? C.teal : "#333842"}`,
                background: fn === k ? `${C.teal}22` : "transparent",
                color: fn === k ? C.teal : "#8892A4",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {k === "x2" ? "x²" : k === "ln" ? "ln(x)" : k + "(x)"}
            </button>
          ))}
        </div>
        <Slider
          label="Scale"
          min={0.1}
          max={5}
          step={0.1}
          value={scale}
          onChange={setScale}
        />
        <SectionTitle style={{ marginTop: 16 }}>f(x)</SectionTitle>
        <LineChart data={fnData} color={C.teal} label="f(x)" h={110} />
      </Card>
      <Card>
        <SectionTitle>Derivative f'(x)</SectionTitle>
        <LineChart
          data={deriv}
          color={C.orange}
          label="f'(x) — slope"
          h={110}
        />
        <SectionTitle style={{ marginTop: 8 }}>Integral ∫f(x)dx</SectionTitle>
        <LineChart data={integ} color={C.blue} label="∫f(x)dx — area" h={110} />
      </Card>
    </div>
  );
}

function StatsLab() {
  const [rawData, setRawData] = useState(
    "4, 7, 13, 2, 1, 7, 8, 9, 3, 7, 15, 6",
  );
  const nums = rawData
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  const sorted = [...nums].sort((a, b) => a - b);
  const mean = nums.length
    ? round(nums.reduce((a, b) => a + b, 0) / nums.length, 3)
    : 0;
  const median = nums.length
    ? nums.length % 2 === 0
      ? round((sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2, 3)
      : sorted[Math.floor(nums.length / 2)]
    : 0;
  const freq = nums.reduce((acc, n) => {
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  const variance = nums.length
    ? round(nums.reduce((a, n) => a + (n - mean) ** 2, 0) / nums.length, 3)
    : 0;
  const std = round(Math.sqrt(variance), 3);
  const bars = Object.entries(freq)
    .sort((a, b) => +a[0] - +b[0])
    .map(([label, v]) => ({ label, v }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
      <Card>
        <SectionTitle>Dataset</SectionTitle>
        <Label>Enter comma-separated numbers</Label>
        <textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          style={{
            width: "100%",
            background: "#1A1D23",
            border: "1px solid #333842",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#E2E8F0",
            fontSize: 13,
            resize: "vertical",
            minHeight: 80,
            fontFamily: "'JetBrains Mono', monospace",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 14,
          }}
        >
          <MetricBox label="Mean" value={mean} color={C.teal} />
          <MetricBox label="Median" value={median} color={C.blue} />
          <MetricBox label="Mode" value={mode} color={C.orange} />
          <MetricBox label="Std Dev" value={std} color="#A78BFA" />
        </div>
      </Card>
      <Card>
        <SectionTitle>Frequency Distribution</SectionTitle>
        <BarChart bars={bars} color={C.teal} h={160} />
        <InfoBox>
          n = {nums.length} &nbsp;|&nbsp; Variance σ² ={" "}
          <strong>{variance}</strong>
          <br />
          Range = {sorted[sorted.length - 1] - sorted[0]} &nbsp;|&nbsp; Min=
          {sorted[0]}, Max={sorted[sorted.length - 1]}
        </InfoBox>
      </Card>
    </div>
  );
}

// MODULE: COMPUTER SCIENCE

function CSLab() {
  const [tab, setTab] = useState("sort");
  const tabs = [
    { id: "sort", label: "Sorting" },
    { id: "logic", label: "Logic Gates" },
    { id: "complexity", label: "Complexity" },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${tab === t.id ? C.blue : "#333842"}`,
              background: tab === t.id ? `${C.blue}22` : "transparent",
              color: tab === t.id ? C.blue : "#8892A4",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "sort" && <SortLab />}
      {tab === "logic" && <LogicGates />}
      {tab === "complexity" && <ComplexityLab />}
    </div>
  );
}

function SortLab() {
  const genArr = () =>
    Array.from({ length: 20 }, () => Math.floor(Math.random() * 90) + 10);
  const [arr, setArr] = useState(genArr());
  const [sorted, setSorted] = useState(null);
  const [algo, setAlgo] = useState("bubble");
  const [steps, setSteps] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [running, setRunning] = useState(false);

  const runSort = async () => {
    setRunning(true);
    const a = [...arr];
    let sw = 0,
      cmp = 0;
    if (algo === "bubble") {
      for (let i = 0; i < a.length; i++)
        for (let j = 0; j < a.length - i - 1; j++) {
          cmp++;
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            sw++;
          }
        }
    } else if (algo === "selection") {
      for (let i = 0; i < a.length; i++) {
        let mi = i;
        for (let j = i + 1; j < a.length; j++) {
          cmp++;
          if (a[j] < a[mi]) mi = j;
        }
        if (mi !== i) {
          [a[i], a[mi]] = [a[mi], a[i]];
          sw++;
        }
      }
    } else {
      a.sort((x, y) => {
        cmp++;
        return x - y;
      });
    }
    setSorted(a);
    setSteps(sw);
    setComparisons(cmp);
    setRunning(false);
  };

  const display = sorted || arr;
  const maxV = Math.max(...display);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
      <Card>
        <SectionTitle>Algorithm</SectionTitle>
        {["bubble", "selection", "quick"].map((a) => (
          <button
            key={a}
            onClick={() => setAlgo(a)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              marginBottom: 8,
              borderRadius: 8,
              border: `1px solid ${algo === a ? C.teal : "#333842"}`,
              background: algo === a ? `${C.teal}18` : "transparent",
              color: algo === a ? C.teal : "#8892A4",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)} Sort
          </button>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => {
              setArr(genArr());
              setSorted(null);
              setSteps(0);
              setComparisons(0);
            }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: `1px solid ${C.blue}`,
              background: `${C.blue}18`,
              color: C.blue,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            New Array
          </button>
          <button
            onClick={runSort}
            disabled={running}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: `1px solid ${C.teal}`,
              background: `${C.teal}22`,
              color: C.teal,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              opacity: running ? 0.5 : 1,
            }}
          >
            Sort!
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 12,
          }}
        >
          <MetricBox label="Swaps" value={steps} color={C.orange} />
          <MetricBox label="Comparisons" value={comparisons} color={C.teal} />
        </div>
      </Card>
      <Card>
        <SectionTitle>Array Visualization</SectionTitle>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 140,
            marginBottom: 8,
          }}
        >
          {display.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: sorted ? C.teal : C.blue,
                height: `${(v / maxV) * 100}%`,
                borderRadius: "3px 3px 0 0",
                opacity: 0.85,
                transition: "height 0.4s ease",
              }}
              title={v}
            />
          ))}
        </div>
        <InfoBox>
          Array size: {arr.length} elements
          <br />
          Complexity — Bubble: O(n²) | Selection: O(n²) | Quick: O(n log n) avg
        </InfoBox>
      </Card>
    </div>
  );
}

function LogicGates() {
  const [A, setA] = useState(true);
  const [B, setB] = useState(false);
  const gates = [
    { name: "AND", fn: (a, b) => a && b, sym: "∧" },
    { name: "OR", fn: (a, b) => a || b, sym: "∨" },
    { name: "NAND", fn: (a, b) => !(a && b), sym: "↑" },
    { name: "NOR", fn: (a, b) => !(a || b), sym: "↓" },
    { name: "XOR", fn: (a, b) => a !== b, sym: "⊕" },
    { name: "XNOR", fn: (a, b) => a === b, sym: "⊙" },
  ];
  const Bit = ({ on }) => (
    <span
      style={{
        display: "inline-block",
        width: 32,
        height: 32,
        lineHeight: "32px",
        textAlign: "center",
        borderRadius: 6,
        background: on ? `${C.teal}33` : "#22262E",
        border: `1px solid ${on ? C.teal : "#333842"}`,
        color: on ? C.teal : "#8892A4",
        fontWeight: 700,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {on ? "1" : "0"}
    </span>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
      <Card>
        <SectionTitle>Inputs</SectionTitle>
        {[
          ["A", A, setA],
          ["B", B, setB],
        ].map(([label, val, set]) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <span style={{ color: "#E2E8F0", fontWeight: 700, width: 16 }}>
              {label}
            </span>
            <button
              onClick={() => set(!val)}
              style={{
                padding: "6px 24px",
                borderRadius: 8,
                border: `1px solid ${val ? C.teal : "#333842"}`,
                background: val ? `${C.teal}22` : "transparent",
                color: val ? C.teal : "#8892A4",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {val ? "1 (HIGH)" : "0 (LOW)"}
            </button>
          </div>
        ))}
        <InfoBox>
          A = <strong>{A ? 1 : 0}</strong>, B = <strong>{B ? 1 : 0}</strong>
          <br />
          Click buttons to toggle inputs
        </InfoBox>
      </Card>
      <Card>
        <SectionTitle>Gate Outputs</SectionTitle>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {gates.map((g) => {
            const out = g.fn(A, B);
            return (
              <div
                key={g.name}
                style={{
                  background: "#1A1D23",
                  border: `1px solid ${out ? C.teal + "88" : "#333842"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}
                  >
                    {g.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#8892A4" }}>
                    A {g.sym} B
                  </div>
                </div>
                <Bit on={out} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ComplexityLab() {
  const [n, setN] = useState(20);
  const ns = Array.from({ length: 50 }, (_, i) => i + 1);
  const complexities = [
    { label: "O(1)", fn: () => 1, color: C.teal },
    { label: "O(log n)", fn: (n) => Math.log2(n), color: "#A78BFA" },
    { label: "O(n)", fn: (n) => n, color: C.blue },
    { label: "O(n log n)", fn: (n) => n * Math.log2(n), color: C.orange },
    { label: "O(n²)", fn: (n) => n * n, color: "#F87171" },
  ];
  const maxVal = Math.max(...complexities.map((c) => c.fn(n)));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
      <Card>
        <SectionTitle>Time Complexity Comparison</SectionTitle>
        <Slider
          label="Input size n"
          min={1}
          max={50}
          value={n}
          onChange={setN}
        />
        {complexities.map((c) => {
          const v = round(c.fn(n), 1);
          const pct = (v / maxVal) * 100;
          return (
            <div key={c.label} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: c.color, fontWeight: 600 }}>
                  {c.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#8892A4",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {v} ops
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "#22262E",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${clamp(pct, 0, 100)}%`,
                    height: "100%",
                    background: c.color,
                    borderRadius: 4,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </Card>
      <Card>
        <SectionTitle>Growth Curves</SectionTitle>
        {complexities.slice(0, 4).map((c) => {
          const data = ns.map((x) => ({ x, y: Math.min(c.fn(x), 300) }));
          return (
            <div key={c.label} style={{ marginBottom: 6 }}>
              <LineChart data={data} color={c.color} label={c.label} h={70} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// AI CHAT PANEL

function AIChat({ activeModule }) {
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      content: `👋 Hi! I'm your AI lab assistant. Ask me anything about ${activeModule} — theory, formulas, concepts, or how to interpret your results.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role: "user", content: userMsg }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const reply = await askAI(
        newMsgs.slice(-10).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      );
      setMsgs((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Connection error. Please try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const suggestions = {
    "Electrical Engineering": [
      "Explain power factor",
      "What is resonance in RLC?",
      "How does PWM work?",
    ],
    "Control Systems": [
      "What is damping ratio?",
      "Explain time constant",
      "What causes overshoot?",
    ],
    Mathematics: [
      "Explain discriminant",
      "What is Euler's method?",
      "Define standard deviation",
    ],
    "Computer Science": [
      "Why is O(n²) bad?",
      "Explain XOR gate",
      "What is quicksort?",
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 0",
          minHeight: 200,
          maxHeight: 400,
        }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 14,
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.role === "assistant" && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `${C.teal}33`,
                  border: `1px solid ${C.teal}66`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12 }}>AI</span>
              </div>
            )}
            <div
              style={{
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius:
                  m.role === "user"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                background: m.role === "user" ? `${C.blue}33` : "#22262E",
                border: `1px solid ${m.role === "user" ? C.blue + "44" : "#333842"}`,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "#E2E8F0",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: `${C.teal}33`,
                border: `1px solid ${C.teal}66`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 12 }}>AI</span>
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px 12px 12px 4px",
                background: "#22262E",
                border: "1px solid #333842",
                fontSize: 13,
              }}
            >
              <span style={{ opacity: 0.7 }}>Thinking</span>
              <span style={{ animation: "pulse 1s infinite" }}>...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {suggestions[activeModule] && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          {suggestions[activeModule].map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                border: `1px solid #333842`,
                background: "transparent",
                color: "#8892A4",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Ask about ${activeModule}...`}
          style={{
            flex: 1,
            background: "#1A1D23",
            border: "1px solid #333842",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#E2E8F0",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: loading ? "#333842" : `${C.teal}33`,
            border: `1px solid ${loading ? "#333842" : C.teal}`,
            color: loading ? "#8892A4" : C.teal,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// QUIZ SYSTEM

const QUIZ_DATA = {
  "Electrical Engineering": [
    {
      q: "What is the formula for Ohm's Law?",
      opts: ["V = IR", "P = IV", "V = IC", "I = VR"],
      ans: 0,
    },
    {
      q: "Power factor of a purely resistive circuit is:",
      opts: ["0", "0.5", "1", "Undefined"],
      ans: 2,
    },
    {
      q: "At resonance in an RLC circuit, impedance Z equals:",
      opts: ["XL + XC", "R", "0", "∞"],
      ans: 1,
    },
  ],
  "Control Systems": [
    {
      q: "A system with ζ > 1 is:",
      opts: ["Underdamped", "Critically damped", "Overdamped", "Unstable"],
      ans: 2,
    },
    {
      q: "Rise time is the time to go from:",
      opts: ["0% to 100%", "10% to 90%", "0% to 50%", "5% to 95%"],
      ans: 1,
    },
    {
      q: "Settling time is typically defined as ±__% of final value:",
      opts: ["1%", "2%", "5%", "10%"],
      ans: 1,
    },
  ],
  Mathematics: [
    {
      q: "If discriminant Δ < 0, the quadratic has:",
      opts: [
        "Two real roots",
        "One real root",
        "No real roots",
        "Infinite roots",
      ],
      ans: 2,
    },
    {
      q: "The derivative of sin(x) is:",
      opts: ["cos(x)", "-cos(x)", "-sin(x)", "tan(x)"],
      ans: 0,
    },
    {
      q: "The median of {1,2,3,4,5} is:",
      opts: ["2", "3", "2.5", "15"],
      ans: 1,
    },
  ],
  "Computer Science": [
    {
      q: "Bubble sort worst-case complexity is:",
      opts: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      ans: 2,
    },
    {
      q: "Output of XOR gate when A=1, B=1:",
      opts: ["0", "1", "Undefined", "Both"],
      ans: 0,
    },
    {
      q: "Which complexity is MOST efficient for large n?",
      opts: ["O(n²)", "O(n log n)", "O(n)", "O(2ⁿ)"],
      ans: 2,
    },
  ],
};

function QuizPanel({ module: mod }) {
  const qs = QUIZ_DATA[mod] || [];
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = qs[qi];

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.ans) setScore((s) => s + 1);
  };
  const next = () => {
    if (qi + 1 >= qs.length) setDone(true);
    else {
      setQi(qi + 1);
      setSelected(null);
    }
  };
  const reset = () => {
    setQi(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (!qs.length) return <InfoBox>No quiz available for this module.</InfoBox>;
  if (done)
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#E2E8F0",
              marginBottom: 8,
            }}
          >
            Quiz Complete!
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color:
                score === qs.length
                  ? C.teal
                  : score >= qs.length / 2
                    ? C.orange
                    : "#F87171",
              marginBottom: 16,
            }}
          >
            {score}/{qs.length}
          </div>
          <div style={{ fontSize: 14, color: "#8892A4", marginBottom: 20 }}>
            {score === qs.length
              ? "Perfect score! 🌟"
              : score >= qs.length / 2
                ? "Good effort! Keep practicing."
                : "Review the theory and try again."}
          </div>
          <button
            onClick={reset}
            style={{
              padding: "10px 28px",
              borderRadius: 10,
              background: `${C.teal}22`,
              border: `1px solid ${C.teal}`,
              color: C.teal,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Retry Quiz
          </button>
        </div>
      </Card>
    );

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 12, color: "#8892A4", fontWeight: 600 }}>
          Q {qi + 1} of {qs.length}
        </span>
        <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>
          Score: {score}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#E2E8F0",
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        {q.q}
      </div>
      {q.opts.map((opt, i) => {
        let bg = "transparent",
          border = "#333842",
          color = "#8892A4";
        if (selected !== null) {
          if (i === q.ans) {
            bg = `${C.teal}22`;
            border = C.teal;
            color = C.teal;
          } else if (i === selected && i !== q.ans) {
            bg = "#F87171" + "22";
            border = "#F87171";
            color = "#F87171";
          }
        } else if (selected === null) {
          color = "#E2E8F0";
        }
        return (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            style={{
              display: "block",
              width: "100%",
              padding: "11px 14px",
              marginBottom: 8,
              borderRadius: 9,
              border: `1px solid ${border}`,
              background: bg,
              color,
              cursor: selected !== null ? "default" : "pointer",
              fontSize: 13.5,
              textAlign: "left",
              fontWeight: 500,
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 8 }}>
              {String.fromCharCode(65 + i)}.
            </span>
            {opt}
          </button>
        );
      })}
      {selected !== null && (
        <button
          onClick={next}
          style={{
            marginTop: 8,
            padding: "10px 24px",
            borderRadius: 9,
            background: `${C.blue}22`,
            border: `1px solid ${C.blue}`,
            color: C.blue,
            cursor: "pointer",
            fontWeight: 700,
            float: "right",
          }}
        >
          {qi + 1 >= qs.length ? "See Results" : "Next →"}
        </button>
      )}
    </Card>
  );
}

// MAIN APP

const MODULES = [
  {
    id: "electrical",
    label: "Electrical Engineering",
    icon: "⚡",
    color: C.orange,
    component: ElectricalLab,
  },
  {
    id: "control",
    label: "Control Systems",
    icon: "🎛️",
    color: C.blue,
    component: ControlLab,
  },
  {
    id: "math",
    label: "Mathematics",
    icon: "📘",
    color: "#A78BFA",
    component: MathLab,
  },
  {
    id: "cs",
    label: "Computer Science",
    icon: "💻",
    color: C.teal,
    component: CSLab,
  },
];

const MODULE_NAME = {
  electrical: "Electrical Engineering",
  control: "Control Systems",
  math: "Mathematics",
  cs: "Computer Science",
};

export default function App() {
  const { user, loading, logout } = useAuth();
  const [authPage, setAuthPage] = useState("login");
  const [theme, setTheme] = useState("dark");
  const [activeModule, setActiveModule] = useState("electrical");
  const [rightPanel, setRightPanel] = useState("ai");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const cl = theme === "dark" ? C.dark : C.lt;
  const ActiveLab =
    MODULES.find((m) => m.id === activeModule)?.component || ElectricalLab;

  // Loading splash
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0F1117",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>🔬</div>
        <div style={{
          width: 36, height: 36,
          border: "3px solid #2A2F3D",
          borderTopColor: "#3BAF9F",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return authPage === "login"
      ? <LoginPage onSwitch={() => setAuthPage("register")} />
      : <RegisterPage onSwitch={() => setAuthPage("login")} />;
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; }
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        input[type=range] { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333842; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .user-menu-btn:hover { background: #22262E !important; }
        .logout-btn:hover { background: rgba(248,113,113,0.12) !important; color: #F87171 !important; border-color: rgba(248,113,113,0.3) !important; }
      `}</style>
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: cl.bg,
          color: cl.text,
          overflow: "hidden",
        }}
        onClick={() => setShowUserMenu(false)}
      >
        {/* Sidebar */}
        <div
          style={{
            width: sidebarOpen ? 220 : 60,
            flexShrink: 0,
            background: C.darkGray,
            transition: "width 0.3s",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: `1px solid #333842`,
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid #333842",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: `${C.teal}33`,
                border: `1px solid ${C.teal}66`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16 }}>🔬</span>
            </div>
            {sidebarOpen && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  lineHeight: 1.2,
                }}
              >
                Virtual
                <br />
                <span style={{ color: C.teal }}>Lab</span>
              </div>
            )}
          </div>
          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            {sidebarOpen && (
              <div
                style={{
                  fontSize: 10,
                  color: "#555F73",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "0 8px 8px",
                }}
              >
                MODULES
              </div>
            )}
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: sidebarOpen ? "10px 12px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 10,
                  marginBottom: 4,
                  border: `1px solid ${activeModule === m.id ? m.color + "55" : "transparent"}`,
                  background:
                    activeModule === m.id ? `${m.color}18` : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                {sidebarOpen && (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: activeModule === m.id ? m.color : "#8892A4",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.label}
                  </span>
                )}
              </button>
            ))}
          </nav>
          {/* Sidebar footer - User avatar */}
          <div style={{ padding: "12px 8px", borderTop: "1px solid #333842" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: sidebarOpen ? "8px 12px" : "8px 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              borderRadius: 10,
              background: "#1E2230",
              border: "1px solid #2A2F3D",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: user.avatar?.color || C.teal,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
              }}>
                {user.avatar?.initials || user.name?.[0]?.toUpperCase()}
              </div>
              {sidebarOpen && (
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#8892A4" }}>Online</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 24px",
              borderBottom: `1px solid ${cl.border}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: cl.card,
            }}
          >
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                background: "none",
                border: "none",
                color: "#8892A4",
                cursor: "pointer",
                fontSize: 18,
                padding: 4,
                borderRadius: 6,
              }}
            >
              ☰
            </button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {MODULES.find((m) => m.id === activeModule)?.icon}{" "}
                {MODULE_NAME[activeModule]}
              </div>
              <div style={{ fontSize: 11, color: "#8892A4" }}>
                Interactive Virtual Lab • AI-Powered
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {[
                { id: "ai", label: "🤖 AI Chat" },
                { id: "quiz", label: "📝 Quiz" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRightPanel(p.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${rightPanel === p.id ? C.teal : cl.border}`,
                    background:
                      rightPanel === p.id ? `${C.teal}18` : "transparent",
                    color: rightPanel === p.id ? C.teal : "#8892A4",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: cl.border, margin: "0 4px" }} />

              {/* User profile menu */}
              <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "6px 10px 6px 6px",
                    borderRadius: 10,
                    border: `1px solid ${showUserMenu ? C.teal + "66" : cl.border}`,
                    background: showUserMenu ? `${C.teal}0D` : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: user.avatar?.color || C.teal,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff",
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${(user.avatar?.color || C.teal) + "44"}`,
                  }}>
                    {user.avatar?.initials || user.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cl.text, lineHeight: 1.2 }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#8892A4", lineHeight: 1.2 }}>
                      {user.email}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8892A4" strokeWidth="2.5" style={{ marginLeft: 2, transform: showUserMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    width: 220,
                    background: "#1E2230",
                    border: `1px solid ${C.dark.border}`,
                    borderRadius: 14,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    animation: "fadeIn 0.15s ease",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}>
                    {/* Profile info */}
                    <div style={{
                      padding: "16px",
                      borderBottom: `1px solid ${C.dark.border}`,
                      background: "#161921",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: user.avatar?.color || C.teal,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, fontWeight: 700, color: "#fff",
                          boxShadow: `0 0 0 3px ${(user.avatar?.color || C.teal) + "33"}`,
                        }}>
                          {user.avatar?.initials || user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: "#8892A4" }}>{user.email}</div>
                        </div>
                      </div>
                      <div style={{
                        marginTop: 10, padding: "6px 10px",
                        background: `${C.teal}12`,
                        border: `1px solid ${C.teal}33`,
                        borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ fontSize: 10 }}>🗓️</span>
                        <span style={{ fontSize: 10, color: "#8892A4" }}>
                          Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: "8px" }}>
                      <button
                        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "9px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: "transparent",
                          color: "#A0AEC0",
                          cursor: "pointer",
                          fontSize: 13,
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#22262E"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ fontSize: 16 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
                        {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      </button>

                      <div style={{ height: 1, background: C.dark.border, margin: "6px 0" }} />

                      <button
                        className="logout-btn"
                        onClick={logout}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "9px 12px",
                          borderRadius: 9,
                          border: "1px solid transparent",
                          background: "transparent",
                          color: "#8892A4",
                          cursor: "pointer",
                          fontSize: 13,
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 15 }}>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
            {/* Lab area */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <ActiveLab />
            </div>
            {/* Right panel */}
            <div
              style={{
                width: 340,
                borderLeft: `1px solid ${cl.border}`,
                background: cl.card,
                display: "flex",
                flexDirection: "column",
                padding: 18,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.teal,
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {rightPanel === "ai" ? "AI Assistant" : "Quick Quiz"}
              </div>
              {rightPanel === "ai" ? (
                <AIChat activeModule={MODULE_NAME[activeModule]} />
              ) : (
                <QuizPanel module={MODULE_NAME[activeModule]} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
