import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { defaultInspireItems } from "../data/defaultInspire.js";
import { resolveMediaUrl } from "../utils/mediaUrl.js";
import AppShell from "../components/layout/AppShell.jsx";

const TOOLS = [
  {
    id: "motion",
    label: "MOTION SYNC",
    to: "/create/video?tool=motion-sync",
    menu: null,
  },
  {
    id: "video",
    label: "Video",
    to: "/create/video",
    menu: [
      { label: "Frame to Video", to: "/create/video" },
      { label: "Text to Video", to: "/create/video?mode=text" },
      { label: "Motion Sync", to: "/create/video?tool=motion-sync" },
    ],
  },
  {
    id: "image",
    label: "Image",
    to: "/create/image",
    menu: [
      { label: "Text to Image", to: "/create/image" },
      { label: "Edit Image", to: "/create/image?mode=edit" },
    ],
  },
  {
    id: "avatar",
    label: "Avatar",
    to: "/create/avatar",
    menu: [
      { label: "Lip-Sync Avatar", to: "/create/avatar" },
      { label: "Talking Head", to: "/create/avatar" },
    ],
  },
  {
    id: "prompt",
    label: "PROMPT",
    to: "/#inspire",
    menu: null,
  },
  {
    id: "audio",
    label: "Audio",
    to: "/create/audio",
    menu: [
      { label: "Create Voice", to: "/create/audio?mode=voice" },
      { label: "Create voice-over", to: "/create/audio?mode=voiceover" },
      { label: "Create Music", to: "/create/audio?mode=music" },
      { label: "Create Sound Effects", to: "/create/audio?mode=sfx" },
      { label: "Voice Clone", to: "/create/audio?mode=clone" },
    ],
  },
];

const FEATURES = [
  {
    title: "40% OFF Summer Sale",
    badge: "Upgrade to unlock",
    to: "/buy-credits",
    image:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Seedance 2.0: 4K & Mini",
    badge: "Try Now",
    to: "/create/video",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "GPT Image 2.0",
    badge: "Try Now",
    to: "/create/image",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Lumina 2.0 — Most Powerful Video",
    badge: "Try Now",
    to: "/create/video",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format&fit=crop",
  },
];

function ToolBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="oa-toolbar" ref={ref}>
      {TOOLS.map((tool) => (
        <div key={tool.id} className="oa-toolbar-item">
          <button
            type="button"
            className={`oa-tool-chip ${open === tool.id ? "open" : ""}`}
            onClick={() => {
              if (tool.menu) {
                setOpen(open === tool.id ? null : tool.id);
              } else {
                navigate(tool.to);
              }
            }}
          >
            {tool.label}
            {tool.menu && <span className="oa-chevron">▾</span>}
          </button>
          {tool.menu && open === tool.id && (
            <div className="oa-dropdown">
              {tool.menu.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="oa-dropdown-item"
                  onClick={() => {
                    setOpen(null);
                    navigate(item.to);
                  }}
                >
                  <span className="oa-dropdown-dot" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const scroller = useRef(null);
  const [inspireImages, setInspireImages] = useState(defaultInspireItems);

  useEffect(() => {
    api
      .get("/home/inspire")
      .then(({ data }) => {
        const uploaded = (data.images || []).map((img) => ({
          id: img.id,
          url: resolveMediaUrl(img.url),
          title: img.title,
        }));
        setInspireImages([...uploaded, ...defaultInspireItems()]);
      })
      .catch(() => {
        setInspireImages(defaultInspireItems());
      });
  }, []);

  const scrollInspire = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <AppShell>
      <div className="oa-home">
        <section className="oa-home-hero">
          <h1>
            What would you like to create today? <span className="oa-cursor">✦</span>
          </h1>
          <ToolBar />
        </section>

        <section className="oa-feature-row">
          {FEATURES.map((card) => (
            <Link key={card.title} to={card.to} className="oa-feature-card">
              <img src={card.image} alt="" loading="lazy" />
              <div className="oa-feature-overlay" />
              <span className="oa-feature-badge">{card.badge}</span>
              <h3>{card.title}</h3>
            </Link>
          ))}
        </section>

        <section className="oa-inspire" id="inspire">
          <div className="oa-inspire-label">INSPIRE</div>
          <button
            type="button"
            className="oa-inspire-arrow left"
            onClick={() => scrollInspire(-1)}
            aria-label="Scroll left"
          >
            ‹
          </button>
          <div className="oa-inspire-track" ref={scroller}>
            {inspireImages.map((item, i) => {
              const src = typeof item === "string" ? item : item.url;
              const key = typeof item === "string" ? src : item.id;
              const alt = typeof item === "string" ? `Inspiration ${i + 1}` : item.title || `Inspiration ${i + 1}`;
              return (
                <div key={key} className="oa-inspire-item">
                  <img src={src} alt={alt} loading="lazy" />
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="oa-inspire-arrow right"
            onClick={() => scrollInspire(1)}
            aria-label="Scroll right"
          >
            ›
          </button>
        </section>
      </div>
    </AppShell>
  );
}
