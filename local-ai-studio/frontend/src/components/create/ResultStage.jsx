export default function ResultStage({ loading, result, error, kind = "image" }) {
  return (
    <div className="oa-stage">
      <div className="oa-stage-banner">DOWNLOAD THE CONTENT ONCE IT IS READY</div>

      <div className="oa-stage-canvas">
        {error && <div className="oa-stage-error">{error}</div>}

        {loading && (
          <div className="oa-stage-loading">
            <div className="oa-progress">
              <div className="oa-progress-bar" />
            </div>
            <p>CONTENT APPEARING HERE WITH LOADING BAR</p>
          </div>
        )}

        {!loading && result?.url && (
          <div className="oa-stage-result">
            {kind === "video" && <video src={result.url} controls autoPlay loop />}
            {kind === "audio" && <audio src={result.url} controls />}
            {kind === "image" && <img src={result.url} alt="Generated result" />}
            <a className="oa-btn-download" href={result.url} target="_blank" rel="noreferrer">
              Download
            </a>
          </div>
        )}

        {!loading && !result?.url && !error && (
          <div className="oa-stage-empty">
            <div className="oa-stage-placeholder">
              CONTENT APPEAR HERE WITH LOADING BAR
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
