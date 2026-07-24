import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Paymob appends success=true/false in the redirect query string.
    // The actual credit top-up already happened server-side via the
    // /api/payment/callback webhook - this page is just a friendly landing page.
    setSuccess(params.get("success") === "true");
  }, [params]);

  return (
    <div className="container" style={{ textAlign: "center" }}>
      {success === null && <p>Checking payment status...</p>}
      {success === true && (
        <>
          <h2 style={{ color: "var(--green)" }}>Payment successful 🎉</h2>
          <p>Your credits have been added to your account.</p>
        </>
      )}
      {success === false && (
        <>
          <h2 style={{ color: "#dc2626" }}>Payment failed</h2>
          <p>Please try again or use a different payment method.</p>
        </>
      )}
      <Link to="/ai-tools"><button className="btn-primary" style={{ width: "auto", marginTop: 16 }}>Back to AI Tools</button></Link>
    </div>
  );
}
