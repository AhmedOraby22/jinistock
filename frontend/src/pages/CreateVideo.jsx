import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosClient";
import AppShell from "../components/layout/AppShell.jsx";
import ModelPicker from "../components/create/ModelPicker.jsx";
import ResultStage from "../components/create/ResultStage.jsx";
import { modelsByType } from "../data/generationOptions";

export default function CreateVideo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const tool = params.get("tool");
  const type = mode === "text" ? "text_to_video" : "image_to_video";

  const [modelsOpen, setModelsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [audioOn, setAudioOn] = useState(true);
  const [genMode, setGenMode] = useState("Normal");
  const [count, setCount] = useState(1);
  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [form, setForm] = useState({
    model: modelsByType[type][0]?.id || "",
    prompt: "",
    duration: "5",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      model: modelsByType[type][0]?.id || "",
    }));
  }, [type]);

  const modelLabel =
    (modelsByType[type] || []).find((m) => m.id === form.model)?.label || "Select model";

  const title =
    tool === "motion-sync"
      ? "Motion Sync"
      : mode === "text"
        ? "Text to Video"
        : "Frame to Video";

  const enhancePrompt = useCallback(() => {
    if (!form.prompt.trim()) return;
    setForm((prev) => ({
      ...prev,
      prompt: `${prev.prompt.trim()}, smooth camera motion, cinematic transition, high fidelity motion`,
    }));
  }, [form.prompt]);

  const swapFrames = () => {
    setStartFrame(endFrame);
    setEndFrame(startFrame);
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
      if (startFrame) inputFileUrl = await uploadFile(startFrame);

      const res = await api.post("/generate", {
        generationType: form.model,
        model: form.model,
        prompt: form.prompt,
        duration: form.duration,
        inputFileUrl,
      });
      setResult(res.data);
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
              <div className="oa-crumb">Create › Video</div>
              <h1>
                {title} <span className="oa-info" title="Bring still images to life with motion.">ⓘ</span>
              </h1>
              {type === "image_to_video" && (
                <p className="oa-sub">Bring still images to life with motion.</p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="oa-model-trigger"
            onClick={() => setModelsOpen(true)}
          >
            <span className="oa-model-bars">▮▮▮</span>
            <span>Model {modelLabel}</span>
            <span className="oa-chevron">▾</span>
          </button>

          {type === "image_to_video" && (
            <div className="oa-field-block">
              <h3>Set start & end frame</h3>
              <div className="oa-frames">
                <label className="oa-frame-zone">
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setStartFrame(e.target.files?.[0] || null)}
                  />
                  {startFrame ? (
                    <img src={URL.createObjectURL(startFrame)} alt="Start frame" />
                  ) : (
                    <>
                      <strong>Add a start frame</strong>
                      <span className="oa-history">History</span>
                    </>
                  )}
                </label>
                <button type="button" className="oa-swap" onClick={swapFrames} aria-label="Swap frames">
                  ⇄
                </button>
                <label className="oa-frame-zone">
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setEndFrame(e.target.files?.[0] || null)}
                  />
                  {endFrame ? (
                    <img src={URL.createObjectURL(endFrame)} alt="End frame" />
                  ) : (
                    <>
                      <strong>Add an end frame</strong>
                      <span className="oa-history">History</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="oa-field-block">
            <h3>Describe your video</h3>
            <div className="oa-prompt-wrap">
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                placeholder="Describe scene transitions, camera movement trajectories, or character actions with text to precisely control the entire video from beginning to end."
                required
                rows={6}
              />
              <div className="oa-prompt-tools">
                <button type="button" className="oa-enhance" onClick={enhancePrompt}>
                  ENHANCE PROMPT
                </button>
                <div className="oa-prompt-icons">
                  <button type="button" className="active" title="Camera">
                    ◎
                  </button>
                  <button type="button" title="Aspect">▦</button>
                  <button
                    type="button"
                    title="Clear"
                    onClick={() => setForm((p) => ({ ...p, prompt: "" }))}
                  >
                    ⌫
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="oa-output-bar">
            <label className="oa-switch pink">
              <input
                type="checkbox"
                checked={audioOn}
                onChange={(e) => setAudioOn(e.target.checked)}
              />
              <span>Audio {audioOn ? "On" : "Off"}</span>
            </label>
            <select value={genMode} onChange={(e) => setGenMode(e.target.value)}>
              <option>Normal</option>
              <option>Fast</option>
              <option>Pro</option>
            </select>
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
            <Link to="/create/video" className="active">
              Video
            </Link>
            <Link to="/create/image">Image</Link>
            <Link to="/create/avatar">Avatar</Link>
            <Link to="/create/audio">Audio</Link>
          </div>
        </form>

        <ResultStage loading={loading} result={result} error={error} kind="video" />

        <ModelPicker
          open={modelsOpen}
          onClose={() => setModelsOpen(false)}
          type={type}
          selectedId={form.model}
          onSelect={(id) => setForm((p) => ({ ...p, model: id }))}
          title="Model"
        />
      </div>
    </AppShell>
  );
}
