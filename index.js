require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

//  Middleware 
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

//  In-memory store (swap with DB in production)
const users = new Map();
const sessions = new Map();

const hashPassword = (pwd) =>
  crypto.createHash("sha256").update(pwd + (process.env.PASSWORD_SALT || "mvlab_salt")).digest("hex");

const generateToken = () => crypto.randomBytes(32).toString("hex");

//  Validate session (returns session or null)
function getSession(req) {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token || token === "undefined" || token === "null") return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) { sessions.delete(token); return null; }
  return session;
}

// AUTH ROUTES

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });
  if (password.length < 8)
    return res.status(400).json({ error: "Password must be at least 8 characters" });

  const emailKey = email.toLowerCase().trim();
  if (users.has(emailKey))
    return res.status(409).json({ error: "An account with this email already exists" });

  const colors = ["#3BAF9F", "#1E73BE", "#F5A623", "#A78BFA", "#F87171"];
  const initials = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const user = {
    id: `u_${Date.now()}`,
    name: name.trim(), email: emailKey,
    passwordHash: hashPassword(password),
    avatar: { initials, color: colors[users.size % colors.length] },
    joinedAt: new Date().toISOString(),
  };
  users.set(emailKey, user);

  const token = generateToken();
  sessions.set(token, { userId: user.id, email: emailKey, expiresAt: Date.now() + 7 * 86400000 });
  console.log(`✅ Registered: ${emailKey}`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, joinedAt: user.joinedAt } });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const emailKey = email.toLowerCase().trim();
  const user = users.get(emailKey);
  if (!user || user.passwordHash !== hashPassword(password))
    return res.status(401).json({ error: "Invalid email or password" });

  const token = generateToken();
  sessions.set(token, { userId: user.id, email: emailKey, expiresAt: Date.now() + 7 * 86400000 });
  console.log(`✅ Login: ${emailKey}`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, joinedAt: user.joinedAt } });
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// GET /api/auth/me
app.get("/api/auth/me", (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Invalid or expired session" });
  const user = users.get(session.email);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, joinedAt: user.joinedAt } });
});


// AI ROUTE — soft auth (works with or without token)

app.post("/api/ask", async (req, res) => {
  try {
    // Soft auth: log who is asking, but don't block if token missing (localStorage-auth users)
    const session = getSession(req);
    const label = session ? session.email : "guest(localStorage-auth)";
    console.log(`🤖 AI request from: ${label}`);

    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ reply: "⚠️ No messages provided" });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENROUTER_API_KEY not set in .env");
      return res.json({ reply: "⚠️ Server config error: API key not set. Please add OPENROUTER_API_KEY to server/.env" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Micro Virtual Lab",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: "You are an expert engineering and science tutor for a virtual lab. Give clear, concise answers about electrical engineering, control systems, mathematics, and computer science. Use formulas and examples when helpful. Keep responses under 200 words.",
          },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content),
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", response.status, errText);
      return res.json({ reply: `⚠️ AI API error (${response.status}). Check your OpenRouter API key in server/.env` });
    }

    const data = await response.json();
    console.log("OpenRouter response received");

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      console.error("Empty reply from OpenRouter:", JSON.stringify(data));
      return res.json({ reply: "⚠️ AI returned an empty response. Try again." });
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ /api/ask error:", err.message);
    res.json({ reply: `⚠️ Server error: ${err.message}` });
  }
});

//  Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "Micro Virtual Lab Server running" }));

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
