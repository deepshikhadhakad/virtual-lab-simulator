import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = "http://localhost:5000";

// ── localStorage-based auth (works without the backend running)
const localAuth = {
  seed() {
    const users = JSON.parse(localStorage.getItem("mvlab_users") || "[]");
    if (!users.find((u) => u.email === "demo@mvlab.io")) {
      users.push({
        id: "demo_user",
        name: "Demo User",
        email: "demo@mvlab.io",
        password: btoa("demo1234"),
        avatar: { initials: "DU", color: "#3BAF9F" },
        joinedAt: new Date().toISOString(),
      });
      localStorage.setItem("mvlab_users", JSON.stringify(users));
    }
  },
  login(email, password) {
    const users = JSON.parse(localStorage.getItem("mvlab_users") || "[]");
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === btoa(password)
    );
    if (!user) throw new Error("Invalid email or password");
    return {
      id: user.id, name: user.name, email: user.email,
      avatar: user.avatar, joinedAt: user.joinedAt,
    };
  },
  register(name, email, password) {
    const users = JSON.parse(localStorage.getItem("mvlab_users") || "[]");
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error("An account with this email already exists");
    const colors = ["#3BAF9F", "#1E73BE", "#F5A623", "#A78BFA", "#F87171"];
    const initials = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const newUser = {
      id: `u_${Date.now()}`,
      name: name.trim(), email: email.toLowerCase().trim(),
      password: btoa(password),
      avatar: { initials, color: colors[users.length % colors.length] },
      joinedAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem("mvlab_users", JSON.stringify(users));
    return { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar, joinedAt: newUser.joinedAt };
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localAuth.seed();
    const saved = localStorage.getItem("mvlab_session");
    if (saved) {
      try {
        const { userData, expiresAt } = JSON.parse(saved);
        if (Date.now() < expiresAt) setUser(userData);
        else localStorage.removeItem("mvlab_session");
      } catch {
        localStorage.removeItem("mvlab_session");
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (userData) => {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("mvlab_session", JSON.stringify({ userData, expiresAt }));
    setUser(userData);
  };

  const login = async (email, password) => {
    await new Promise((r) => setTimeout(r, 700));
    // Try backend first, fall back to localStorage
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("mvlab_token", data.token);
      saveSession(data.user);
      return data.user;
    } catch (err) {
      if (err.message === "Invalid email or password") throw err;
      // Backend offline → use localStorage
      const userData = localAuth.login(email, password);
      saveSession(userData);
      return userData;
    }
  };

  const register = async (name, email, password) => {
    await new Promise((r) => setTimeout(r, 800));
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("mvlab_token", data.token);
      saveSession(data.user);
      return data.user;
    } catch (err) {
      if (err.message.includes("already exists")) throw err;
      // Backend offline → use localStorage
      const userData = localAuth.register(name, email, password);
      saveSession(userData);
      return userData;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("mvlab_token");
    if (token) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000),
        });
      } catch {}
    }
    localStorage.removeItem("mvlab_session");
    localStorage.removeItem("mvlab_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
