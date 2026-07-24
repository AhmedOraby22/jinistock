const VIDEO_TYPES = new Set(["image_to_video", "text_to_video", "video_to_video", "audio_to_video"]);
const AUDIO_TYPES = new Set(["text_to_audio", "audio_to_audio", "music"]);

function resolveMediaKind(result, generationType) {
  if (result?.mediaType === "video" || result?.mediaType === "audio" || result?.mediaType === "image") {
    return result.mediaType;
  }
  const id = String(result?.meta?.modelId || result?.generationType || generationType || "").toLowerCase();
  if (id.includes("video") || VIDEO_TYPES.has(generationType)) return "video";
  if (id.includes("audio") || id.includes("tts") || id.includes("suno") || AUDIO_TYPES.has(generationType)) {
    return "audio";
  }
  return "image";
}

export default function PreviewPanel({ result, generationType }) {
  if (!result?.url) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Preview</h3>
        <div className="preview-box">Generated media will appear here.</div>
      </div>
    );
  }

  const kind = resolveMediaKind(result, generationType);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Preview</h3>
      <div className="preview-box">
        {kind === "video" && <video src={result.url} controls />}
        {kind === "audio" && <audio src={result.url} controls style={{ width: "90%" }} />}
        {kind === "image" && <img src={result.url} alt="Generated result" />}
      </div>
      <a
        className="btn-outline"
        href={result.url}
        target="_blank"
        rel="noreferrer"
        style={{ marginTop: 16, display: "inline-flex" }}
      >
        Open / Download
      </a>
    </div>
  );
}
