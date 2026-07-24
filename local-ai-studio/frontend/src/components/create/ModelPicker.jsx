import { modelsByType } from "../../data/generationOptions";

const FEATURE_FILTERS = [
  { id: "reference", label: "Reference" },
  { id: "variations", label: "Variations" },
  { id: "4k", label: "4K" },
  { id: "svg", label: "SVG" },
  { id: "audio", label: "Audio" },
  { id: "startend", label: "Start/End" },
];

function describeModel(model, type) {
  const id = model.id.toLowerCase();
  if (id.includes("seedance")) return "Cinematic videos with audio & multi-shots.";
  if (id.includes("nano") || id.includes("banana")) return "Google's high-efficiency image model.";
  if (id.includes("flux")) return "Photorealistic detail and creative control.";
  if (id.includes("kling")) return "Sharp motion and character consistency.";
  if (id.includes("veo")) return "Google's next-gen video generation.";
  if (id.includes("grok")) return "Fast imaginative video clips.";
  if (type?.includes("image")) return "High quality image generation.";
  return "Powerful generation model.";
}

function tagsFor(model) {
  const id = model.id.toLowerCase();
  const tags = [];
  if (id.includes("pro") || id.includes("4k") || id.includes("ultra")) tags.push("4K");
  if (id.includes("nano") || id.includes("kontext") || id.includes("edit")) tags.push("Reference");
  if (id.includes("start") || id.includes("seedance") || id.includes("veo")) tags.push("Start/End");
  if (id.includes("audio") || id.includes("seedance") || id.includes("mmaudio")) tags.push("Audio");
  if (!tags.length) tags.push("2K");
  return tags;
}

export default function ModelPicker({
  open,
  onClose,
  type,
  selectedId,
  onSelect,
  title = "Models",
}) {
  const models = modelsByType[type] || [];
  const recommended = models.slice(0, 3);

  if (!open) return null;

  return (
    <div className="oa-model-drawer" role="dialog" aria-label={title}>
      <div className="oa-model-header">
        <h2>{title}</h2>
        <button type="button" className="oa-icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="oa-model-recommended">
        <div className="oa-model-sale-card">
          <span className="oa-pill green">Up to 40% OFF</span>
          <h4>Model Summer Sale</h4>
          <p>Upgrade to unlock premium models</p>
        </div>
        {recommended.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`oa-model-rec-card ${selectedId === m.id ? "active" : ""}`}
            onClick={() => {
              onSelect(m.id);
              onClose();
            }}
          >
            <div className="oa-model-rec-thumb" />
            <h4>{m.label}</h4>
            <p>{describeModel(m, type)}</p>
          </button>
        ))}
      </div>

      <div className="oa-model-filters">
        <details className="oa-filter-details">
          <summary>All features</summary>
          <div className="oa-filter-menu">
            {FEATURE_FILTERS.map((f) => (
              <label key={f.id} className="oa-check">
                <input type="checkbox" />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </details>
        <div className="oa-search">
          <span aria-hidden>⌕</span>
          <input type="search" placeholder="Search" />
        </div>
      </div>

      <div className="oa-model-list">
        {models.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={`oa-model-row ${selectedId === m.id ? "active" : ""}`}
            onClick={() => {
              onSelect(m.id);
              onClose();
            }}
          >
            <div className="oa-model-row-left">
              <div className="oa-model-logo">{m.label.charAt(0)}</div>
              <div>
                <div className="oa-model-name">
                  {m.label}
                  {i < 2 && <span className="oa-pill green">New</span>}
                  {i === 2 && <span className="oa-pill blue">Up to 40% OFF</span>}
                </div>
                <p>{describeModel(m, type)}</p>
              </div>
            </div>
            <div className="oa-model-tags">
              {tagsFor(m).map((t) => (
                <span key={t} className="oa-tag">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
