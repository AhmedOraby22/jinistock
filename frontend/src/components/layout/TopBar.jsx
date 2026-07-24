import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api/axiosClient";

export default function TopBar({ onMenuToggle, sidebarOpen = false }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        const u = data.user || data;
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {});
  }, [isLoggedIn, pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className="oa-topbar">
      <button
        type="button"
        className="oa-menu-btn"
        onClick={onMenuToggle}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="oa-topbar-right">
        {isLoggedIn && user && (
          <>
            <div className="oa-credits-chip oa-credits-chip--full">
              Images: {user.imageCredits ?? 0}/{user.maxImageCredits ?? 0}, Videos:{" "}
              {user.videoCredits ?? 0}/{user.maxVideoCredits ?? 0} Credits Remaining
            </div>
            <div className="oa-credits-chip oa-credits-chip--compact">
              {user.imageCredits ?? 0} img · {user.videoCredits ?? 0} vid
            </div>
          </>
        )}
        {isLoggedIn ? (
          <>
            <Link to="/buy-credits" className="oa-link-muted">
              Pricing
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="oa-link-muted oa-link-admin">
                Admin
              </Link>
            )}
            <button type="button" className="oa-avatar-btn" onClick={logout} title="Log out">
              {initial}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="oa-link-muted">
              Login
            </Link>
            <Link to="/login" className="oa-btn-cta">
              Start for Free <span aria-hidden>›</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
