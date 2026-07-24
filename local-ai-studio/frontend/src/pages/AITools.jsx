import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import AppShell from "../components/layout/AppShell.jsx";
import GenerationForm from "../components/GenerationForm";
import PreviewPanel from "../components/PreviewPanel";
import { modelsByType } from "../data/generationOptions";

export default function AITools() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    type: "text_to_image",
    model: modelsByType.text_to_image[0].id,
    prompt: "",
    duration: "5",
    resolution: "1k",
    inputFile: null,
    inputFileUrl: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const creditLine = useMemo(() => {
    if (!user) return "Loading credits...";
    return `Images ${user.imageCredits}/${user.maxImageCredits} · Videos ${user.videoCredits}/${user.maxVideoCredits}`;
  }, [user]);

  async function uploadIfNeeded() {
    if (form.inputFileUrl) return form.inputFileUrl;
    if (!form.inputFile) return null;

    setUploadProgress("Uploading media...");
    const body = new FormData();
    body.append("file", form.inputFile);
    const res = await api.post("/upload", body, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setUploadProgress("");
    return res.data?.url || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const inputFileUrl = await uploadIfNeeded();
      const payload = {
        generationType: form.model,
        model: form.model,
        prompt: form.prompt,
        duration: form.duration,
        resolution: form.resolution,
        inputFileUrl
      };

      const res = await api.post("/generate", payload);
      setResult({
        ...res.data,
        generationType: form.model
      });
      if (res.data?.credits) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                imageCredits: res.data.credits.image,
                videoCredits: res.data.credits.video
              }
            : prev
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Generation failed");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  }

  return (
    <AppShell>
      <div className="dashboard oa-legacy-page">
        <div className="dashboard-hero">
          <div className="container dashboard-hero-inner">
            <div>
              <p className="dashboard-eyebrow">jiniStock Studio</p>
              <h1>All Tools</h1>
              <p className="dashboard-sub">{creditLine}</p>
            </div>
            <button className="btn-green" type="button" onClick={() => navigate("/buy-credits")}>
              Buy credits
            </button>
          </div>
        </div>

        <div className="container dashboard-body">
          {error && <div className="notice warn">{error}</div>}

          <div className="grid-2">
            <GenerationForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              loading={loading}
              uploadProgress={uploadProgress}
            />
            <PreviewPanel result={result} generationType={form.type} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
