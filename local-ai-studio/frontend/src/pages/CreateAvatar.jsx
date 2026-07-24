import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";

export default function CreateAvatar() {
  return (
    <AppShell>
      <div className="oa-create">
        <div className="oa-create-panel">
          <div className="oa-create-head">
            <Link to="/" className="oa-back">
              ‹
            </Link>
            <div>
              <div className="oa-crumb">Create › Avatar</div>
              <h1>Lip-Sync Avatar</h1>
              <p className="oa-sub">Turn a face and audio into a talking avatar.</p>
            </div>
          </div>

          <div className="oa-field-block">
            <h3>Upload face & audio</h3>
            <label className="oa-upload-zone">
              <input type="file" accept="image/*" hidden />
              <strong>Add avatar image</strong>
              <small>JPEG, PNG, WEBP</small>
            </label>
            <label className="oa-upload-zone" style={{ marginTop: 10 }}>
              <input type="file" accept="audio/*,video/*" hidden />
              <strong>Add speech / video</strong>
              <small>MP3, WAV, MP4</small>
            </label>
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
            <Link to="/create/avatar" className="active">
              Avatar
            </Link>
            <Link to="/create/audio">Audio</Link>
          </div>
        </div>

        <div className="oa-stage">
          <div className="oa-stage-banner">DOWNLOAD THE CONTENT ONCE IT IS READY</div>
          <div className="oa-stage-canvas">
            <div className="oa-stage-empty">
              <div className="oa-stage-placeholder">Avatar preview will appear here</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
