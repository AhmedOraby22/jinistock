import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";

export default function AppShell({ children, showPromo = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="oa-shell">
      {showPromo && (
        <div className="oa-promo">
          <span>
            Hot Summer Sale for the hottest models! Upgrade by July 31 to lock in up to{" "}
            <strong>40% OFF</strong> for the rest of 2026.
          </span>
          <Link to="/buy-credits" className="oa-promo-btn">
            Upgrade ↗
          </Link>
        </div>
      )}
      <div className={`oa-body${sidebarOpen ? " sidebar-open" : ""}`}>
        {sidebarOpen && (
          <button
            type="button"
            className="oa-sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className="oa-main">
          <TopBar
            sidebarOpen={sidebarOpen}
            onMenuToggle={() => setSidebarOpen((open) => !open)}
          />
          <div className="oa-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
