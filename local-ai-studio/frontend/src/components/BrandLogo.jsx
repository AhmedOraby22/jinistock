import { Link } from "react-router-dom";

export default function BrandLogo({ variant = "full", className = "" }) {
  const src = variant === "icon" ? "/logo-icon.png" : "/logo-full.png";
  return (
    <Link to="/" className={`brand-logo ${className}`} aria-label="jiniStock home">
      <img src={src} alt="jiniStock" />
    </Link>
  );
}
