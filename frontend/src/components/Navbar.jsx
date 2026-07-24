import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axiosClient";
import BrandLogo from "./BrandLogo.jsx";

export default function Navbar() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const isLoggedIn = !!localStorage.getItem("token");
  const isAdmin = user?.role === "admin";

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

  return (
    <header className="navbar">
      <BrandLogo />
      <nav className="links">
        <Link to="/" className={pathname === "/" ? "active" : ""}>
          Home
        </Link>
        <Link to="/ai-tools" className={pathname === "/ai-tools" ? "active" : ""}>
          Dashboard
        </Link>
        {isLoggedIn && (
          <Link to="/buy-credits" className={pathname === "/buy-credits" ? "active" : ""}>
            Subscription
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className={pathname === "/admin" ? "active" : ""}>
            Admin
          </Link>
        )}
      </nav>
      <div className="right">
        {isLoggedIn ? (
          <button type="button" className="btn-outline" onClick={logout}>
            Log out
          </button>
        ) : (
          <Link to="/login" className="btn-outline">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
