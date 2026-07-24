import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosClient";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token || !email) {
      setError("Reset link is missing token or email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword: password,
      });
      localStorage.setItem("token", data.token);
      try {
        const me = await api.get("/auth/me");
        const u = me.data.user || me.data;
        localStorage.setItem("user", JSON.stringify(u));
        navigate(u.role === "admin" ? "/admin" : "/ai-tools");
      } catch {
        navigate("/ai-tools");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2>Set new password</h2>
        <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 0 }}>
          {email || "Open this page from your reset link."}
        </p>
        {error && <div className="notice warn">{error}</div>}
        <form onSubmit={submit}>
          <label>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <label>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
