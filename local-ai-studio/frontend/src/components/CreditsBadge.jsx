export default function CreditsBadge({ credits }) {
  if (!credits) return null;
  return (
    <div className="credits-pill">
      <strong>Credits Remaining:</strong>{" "}
      Images: {credits.imageCredits} | Videos/Audio: {credits.videoCredits}
    </div>
  );
}
