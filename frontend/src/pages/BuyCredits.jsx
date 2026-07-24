import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import AppShell from "../components/layout/AppShell.jsx";

export default function BuyCredits() {
  const [packages, setPackages] = useState([]);
  const [method, setMethod] = useState("card");
  const [phone, setPhone] = useState("");
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/payment/packages").then(({ data }) => setPackages(data.packages || []));
  }, []);

  const buy = async (packageId) => {
    setError("");
    setLoadingKey(packageId);
    try {
      const { data } = await api.post("/payment/checkout", { packageId, method, phoneNumber: phone });
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err.response?.data?.message || "Could not start checkout");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <AppShell>
    <div className="container oa-legacy-page">
      <h2 style={{ fontFamily: '"Syne", "DM Sans", sans-serif' }}>Subscription & Credits</h2>
      <p style={{ color: "var(--text-light)", marginTop: -8 }}>
        Choose a package to keep generating on jiniStock.
      </p>

      <div className="card" style={{ maxWidth: 420, marginBottom: 24 }}>
        <label>Payment method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="card">Credit / Debit Card</option>
          <option value="wallet">Mobile Wallet (Vodafone Cash, etc)</option>
        </select>
        {method === "wallet" && (
          <>
            <label>Wallet phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
          </>
        )}
      </div>

      {error && <div className="notice warn">{error}</div>}

      <div className="packages">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card ${pkg.highlight ? "highlight" : ""}`}>
            <h3>{pkg.name}</h3>
            <div className="price">{pkg.priceCents / 100} EGP</div>
            {pkg.description && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{pkg.description}</p>}
            <p>{pkg.imageCredits} image credits</p>
            <p>{pkg.videoCredits} video credits</p>
            <button className="btn-primary" disabled={loadingKey === pkg.slug} onClick={() => buy(pkg.slug)}>
              {loadingKey === pkg.slug ? "Redirecting..." : "Buy"}
            </button>
          </div>
        ))}
        {!packages.length && (
          <p style={{ color: "var(--text-muted)" }}>No packages available right now.</p>
        )}
      </div>
    </div>
    </AppShell>
  );
}
