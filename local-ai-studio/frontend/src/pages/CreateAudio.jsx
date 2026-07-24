import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";

const MODES = {
  voice: { title: "Create Voice", hint: "Generate a custom AI voice from text." },
  voiceover: { title: "Create Voice-over", hint: "Narrate scripts with natural speech." },
  music: { title: "Create Music", hint: "Compose tracks from a short description." },
  sfx: { title: "Create Sound Effects", hint: "Design Foley and ambient SFX." },
  clone: { title: "Voice Clone", hint: "Clone a voice from a short sample." },
};

export default function CreateAudio() {
  const [params] = useSearchParams();
  const mode = params.get("mode") || "voice";
  const meta = MODES[mode] || MODES.voice;

  return (
    <AppShell>
      <div className="oa-create">
        <div className="oa-create-panel">
          <div className="oa-create-head">
            <Link to="/" className="oa-back">
              ‹
            </Link>
            <div>
              <div className="oa-crumb">Create › Audio</div>
              <h1>{meta.title}</h1>
              <p className="oa-sub">{meta.hint}</p>
            </div>
          </div>

          <div className="oa-field-block">
            <h3>Describe your audio</h3>
            <div className="oa-prompt-wrap">
              <textarea
                rows={6}
                placeholder="Describe the voice, music, or sound you want to create…"
              />
              <div className="oa-prompt-tools">
                <button type="button" className="oa-enhance">
                  ENHANCE PROMPT
                </button>
              </div>
            </div>
          </div>

          <div className="oa-generate-row">
            <div className="oa-points">POINTS</div>
            <Link to="/login" className="oa-btn-generate">
              Create for Free
            </Link>
          </div>

          <div className="oa-mode-switch">
            <Link to="/create/video">Video</Link>
            <Link to="/create/image">Image</Link>
            <Link to="/create/avatar">Avatar</Link>
            <Link to="/create/audio" className="active">
              Audio
            </Link>
          </div>
        </div>

        <div className="oa-stage">
          <div className="oa-stage-banner">DOWNLOAD THE CONTENT ONCE IT IS READY</div>
          <div className="oa-stage-canvas">
            <div className="oa-stage-empty">
              <div className="oa-stage-placeholder">Audio preview will appear here</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
