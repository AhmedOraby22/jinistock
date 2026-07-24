import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosClient";
import AppShell from "../components/layout/AppShell.jsx";
import ModelPicker from "../components/create/ModelPicker.jsx";
import ResultStage from "../components/create/ResultStage.jsx";
import { modelsByType } from "../data/generationOptions";

export default function CreateImage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEdit = params.get("mode") === "edit";
  const type = isEdit ? "image_to_image" : "text_to_image";

  const [user, setUser] = useState(null);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [aspect, setAspect] = useState("4:3");
  const [resolution, setResolution] = useState("1k");
  const [count, setCount] = useState(1);
  const [autoPolish, setAutoPolish] = useState(true);
  const [refs, setRefs] = useState([]);
  const [form, setForm] = useState({
    model: modelsByType[type][0]?.id || "",
    prompt: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      model: modelsByType[type][0]?.id || "",
    }));
  }, [type]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {});
  }, []);

  const modelLabel =
    (modelsByType[type] || []).find((m) => m.id === form.model)?.label || "Select model";

  const enhancePrompt = useCallback(() => {
    if (!form.prompt.trim()) return;
    setForm((prev) => ({
      ...prev,
      prompt: `${prev.prompt.trim()}, highly detailed, cinematic lighting, sharp focus, masterpiece`,
    }));
  }, [form.prompt]);

  const onRefFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - refs.length);
    setRefs((prev) => [...prev, ...files].slice(0, 10));
  };

  async function uploadFile(file) {
    const body = new FormData();
    body.append("file", file);
    const res = await api.post("/upload", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url || null;
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let inputFileUrl = null;
      if (refs[0]) inputFileUrl = await uploadFile(refs[0]);

      const res = await api.post("/generate", {
        generationType: form.model,
        model: form.model,
        prompt: form.prompt,
        resolution,
        inputFileUrl,
      });
      setResult(res.data);
      if (res.data?.credits && user) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                imageCredits: res.data.credits.image,
                videoCredits: res.data.credits.video,
              }
            : prev
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="oa-create">
        <form className="oa-create-panel" onSubmit={handleGenerate}>
          <div className="oa-create-head">
            <Link to="/" className="oa-back">
              ‹
            </Link>
            <div>
              <div className="oa-crumb">Create › Image</div>
              <h1>{isEdit ? "Edit Image" : "Create Image"}</h1>
            </div>
          </div>

          <button
            type="button"
            className="oa-model-trigger"
            onClick={() => setModelsOpen(true)}
          >
            <span className="oa-model-g">G</span>
            <span>Model {modelLabel}</span>
            <span className="oa-chevron">▾</span>
          </button>

          <div className="oa-field-block">
            <h3>Describe your image.</h3>
            <label className="oa-upload-zone">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={onRefFiles} />
              <strong>Add visual references</strong>
              <span>(Optional) {refs.length}/10</span>
              <small>JPEG, PNG, WEBP, GIF, 20 MB max</small>
            </label>
            {refs.length > 0 && (
              <div className="oa-ref-chips">
                {refs.map((f) => (
                  <span key={f.name + f.size} className="oa-tag">
                    {f.name}
                  </span>
                ))}
              </div>
            )}

            <div className="oa-prompt-wrap">
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                placeholder="What do you want to see? Example: 'A cat sitting on a table, warm morning light.'"
                required
                rows={6}
              />
              <div className="oa-prompt-tools">
                <button type="button" className="oa-enhance" onClick={enhancePrompt}>
                  ENHANCE PROMPT
                </button>
                <label className="oa-switch">
                  <input
                    type="checkbox"
                    checked={autoPolish}
                    onChange={(e) => setAutoPolish(e.target.checked)}
                  />
                  <span>Auto Polish</span>
                </label>
              </div>
            </div>
          </div>

          <div className="oa-output-bar">
            <div className="oa-output-meta">
              <select value={aspect} onChange={(e) => setAspect(e.target.value)}>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="1k">1K</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
              </select>
            </div>
            <div className="oa-qty">
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))}>
                −
              </button>
              <span>
                {count} / 4
              </span>
              <button type="button" onClick={() => setCount((c) => Math.min(4, c + 1))}>
                +
              </button>
            </div>
          </div>

          <div className="oa-generate-row">
            <div className="oa-points">POINTS</div>
            <button className="oa-btn-generate" type="submit" disabled={loading}>
              {loading ? "Generating…" : "Create for Free"}
            </button>
          </div>

          <div className="oa-mode-switch">
            <Link to="/create/video">Video</Link>
            <Link to="/create/image" className="active">
              Image
            </Link>
            <Link to="/create/avatar">Avatar</Link>
            <Link to="/create/audio">Audio</Link>
          </div>
        </form>

        <ResultStage loading={loading} result={result} error={error} kind="image" />

        <ModelPicker
          open={modelsOpen}
          onClose={() => setModelsOpen(false)}
          type={type}
          selectedId={form.model}
          onSelect={(id) => setForm((p) => ({ ...p, model: id }))}
        />
      </div>
    </AppShell>
  );
}
