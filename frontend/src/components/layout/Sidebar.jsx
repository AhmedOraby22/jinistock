import { Link, useLocation } from "react-router-dom";
import BrandLogo from "../BrandLogo.jsx";

const CREATE_LINKS = [
  { to: "/create/video", label: "Video", icon: "video" },
  { to: "/create/image", label: "Image", icon: "image" },
  { to: "/create/avatar", label: "Avatar", icon: "avatar" },
  { to: "/create/audio", label: "Audio", icon: "audio" },
];

const PINNED = [
  { to: "/ai-tools", label: "All Tools", icon: "grid" },
  { to: "/create/video?tool=motion-sync", label: "Motion Sync", icon: "motion" },
  { to: "/create/avatar", label: "Lip-Sync", icon: "lips" },
  { to: "/create/image", label: "Edit Image", icon: "edit" },
  { to: "/create/video", label: "Edit Video", icon: "film" },
];

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3z" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m21 16-5-5-8 8" />
        </svg>
      );
    case "avatar":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-4 14.5-4 16 0" />
        </svg>
      );
    case "audio":
      return (
        <svg {...common}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="16" r="2" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "motion":
      return (
        <svg {...common}>
          <path d="M4 12h4l2-6 4 12 2-6h4" />
        </svg>
      );
    case "lips":
      return (
        <svg {...common}>
          <path d="M4 12c2-4 14-4 16 0-2 4-14 4-16 0z" />
          <path d="M4 12h16" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      );
    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "prompt":
      return (
        <svg {...common}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ open = false, onNavigate }) {
  const { pathname, search } = useLocation();
  const full = pathname + search;

  const isActive = (to) => {
    const [path] = to.split("?");
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navProps = { onClick: onNavigate };

  return (
    <aside className={`oa-sidebar${open ? " open" : ""}`}>
      <div className="oa-sidebar-brand">
        <BrandLogo />
      </div>

      <nav className="oa-sidebar-nav">
        <Link to="/" className={`oa-nav-item ${pathname === "/" ? "active" : ""}`} {...navProps}>
          <Icon name="home" />
          <span>Home</span>
        </Link>

        <div className="oa-nav-section">
          <div className="oa-nav-label">
            <span>Create</span>
            <span className="oa-nav-badge">JINI ENGINE</span>
          </div>
          <div className="oa-create-grid">
            {CREATE_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`oa-create-btn ${isActive(item.to) ? "active" : ""}`}
                {...navProps}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="oa-create-tags">
            <span>MOTION SYNC</span>
            <span>PROMPT</span>
          </div>
        </div>

        <div className="oa-nav-section">
          <div className="oa-nav-label">Resources</div>
          <Link to="/" className="oa-nav-item subtle" {...navProps}>
            <Icon name="book" />
            <span>Tutorials</span>
          </Link>
          <Link to="/#inspire" className="oa-nav-item subtle" {...navProps}>
            <Icon name="prompt" />
            <span>Prompts</span>
          </Link>
        </div>

        <div className="oa-nav-section">
          <div className="oa-nav-label">Pinned Tools</div>
          {PINNED.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`oa-nav-item subtle ${isActive(item.to) || full.includes(item.to) ? "active-soft" : ""}`}
              {...navProps}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
