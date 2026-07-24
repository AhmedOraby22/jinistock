import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      navigate(data.user?.role === "admin" ? "/admin" : "/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Cannot reach server. Make sure the backend is running."
          : "Something went wrong");
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <img
        className="login-bg-art"
        src="/login-hero.png"
        alt=""
        aria-hidden="true"
      />

      <div className="container login-content">
        <div className="login-visual">
          <img
            className="login-hero-img"
            src="/login-hero.png"
            alt="AI-generated art"
          />
          <p className="login-tagline">AI image · video · audio</p>
        </div>

        <div className="card login-card">
          <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
          {error && <div className="notice warn">{error}</div>}
          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </>
            )}
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button className="btn-primary" type="submit">
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>
          <p style={{ marginTop: 12, fontSize: 13 }}>
            {mode === "login" ? "No account?" : "Already have an account?"}{" "}
            <a onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "var(--pink)", cursor: "pointer" }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
