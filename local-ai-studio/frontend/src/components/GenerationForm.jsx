import { generationTypes, modelsByType } from "../data/generationOptions";

const VIDEO_TYPES = new Set(["image_to_video", "text_to_video", "video_to_video", "audio_to_video"]);
const IMAGE_UPLOAD_TYPES = new Set(["image_to_video", "image_to_image"]);
const VIDEO_UPLOAD_TYPES = new Set(["video_to_video", "audio_to_video"]);

export default function GenerationForm({ form, setForm, onSubmit, loading, uploadProgress }) {
  const models = modelsByType[form.type] || [];
  const showDuration = VIDEO_TYPES.has(form.type);
  const showResolution = form.type === "text_to_image" || form.type === "image_to_image";
  const showImageUpload = IMAGE_UPLOAD_TYPES.has(form.type);
  const showVideoUpload = VIDEO_UPLOAD_TYPES.has(form.type);

  return (
    <form className="card" onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0 }}>Generation Settings</h3>

      <label>Generation Type</label>
      <select
        value={form.type}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            type: e.target.value,
            model: (modelsByType[e.target.value] || [])[0]?.id || "",
            inputFile: null,
            inputFileUrl: ""
          }))
        }
      >
        {generationTypes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      <label>Model</label>
      <select
        value={form.model}
        onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
      >
        {models.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      <label>Prompt</label>
      <textarea
        rows={5}
        value={form.prompt}
        onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
        placeholder="Describe what you want to generate..."
        required
      />

      {showDuration && (
        <>
          <label>Duration (seconds)</label>
          <select
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
          >
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10">10</option>
          </select>
        </>
      )}

      {showResolution && (
        <>
          <label>Resolution</label>
          <select
            value={form.resolution}
            onChange={(e) => setForm((prev) => ({ ...prev, resolution: e.target.value }))}
          >
            <option value="1k">1K</option>
            <option value="2k">2K</option>
            <option value="4k">4K</option>
          </select>
        </>
      )}

      {(showImageUpload || showVideoUpload) && (
        <>
          <label>{showVideoUpload ? "Upload video / media" : "Upload image"}</label>
          <input
            type="file"
            accept={showVideoUpload ? "video/*,image/*,audio/*" : "image/*"}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setForm((prev) => ({
                ...prev,
                inputFile: file,
                inputFileUrl: ""
              }));
            }}
          />
          {form.inputFile && (
            <p className="dashboard-sub" style={{ marginTop: -8, fontSize: 13 }}>
              Selected: {form.inputFile.name}
            </p>
          )}
          {uploadProgress && (
            <p className="dashboard-sub" style={{ marginTop: -8, fontSize: 13 }}>
              {uploadProgress}
            </p>
          )}
        </>
      )}

      <label>Or paste media URL (optional)</label>
      <input
        type="url"
        value={form.inputFileUrl}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            inputFileUrl: e.target.value,
            inputFile: null
          }))
        }
        placeholder="https://..."
      />

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
