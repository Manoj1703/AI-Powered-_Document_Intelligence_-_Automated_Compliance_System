import React, { useMemo, useState } from "react";
import InfoHint from "../components/InfoHint";
import { prettyRisk } from "../utils";

function predictRisk(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.includes("termination") || name.includes("penalty") || name.includes("liability")) return "High";
  if (name.includes("nda") || name.includes("service") || name.includes("agreement")) return "Medium";
  return "Low";
}

function Upload({ uploading, onUpload, uploadHistory = [], onOpenDocuments, onOpenHistoryItem }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const prediction = useMemo(() => {
    if (!file) return null;
    return predictRisk(file);
  }, [file]);

  function handleFile(nextFile) {
    if (!nextFile) return;
    setFile(nextFile);
  }

  async function handleAnalyze() {
    if (!file) return;
    await onUpload(file);
    setFile(null);
  }

  return (
    <section className="page-stack">
      <article
        className={`glass-card panel dropzone ${dragActive ? "active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <h3 className="title-with-help">
          Upload Document
          <InfoHint text="Drop or select a legal file to extract text and run AI risk analysis." />
        </h3>
        <p>Drag and drop files here, or browse manually.</p>
        <label className="primary-button">
          Select File
          <input type="file" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </article>

      <div className="two-col">
        <article className="glass-card panel">
          <h3 className="title-with-help">
            File Preview
            <InfoHint text="Preview basic file metadata before processing." />
          </h3>
          {!file && <p className="muted">No file selected.</p>}
          {file && (
            <div className="preview-box">
              <p>Name: {file.name}</p>
              <p>Type: {file.type || "Unknown"}</p>
              <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </article>

        <article className="glass-card panel">
          <h3 className="title-with-help">
            Risk Prediction Preview
            <InfoHint text="Fast filename-based estimate. Final risk is calculated after full analysis." />
          </h3>
          {!prediction && <p className="muted">Select a file to preview estimated risk.</p>}
          {prediction && (
            <>
              <p className="muted">Pre-analysis estimate</p>
              <p className="prediction">Predicted Risk: {prettyRisk(prediction)}</p>
              <button
                className={`primary-button ${uploading ? "uploading-shimmer" : ""}`}
                type="button"
                disabled={uploading}
                onClick={handleAnalyze}
              >
                {uploading ? "Uploading..." : "Upload & Analyze"}
              </button>
            </>
          )}
        </article>
      </div>

      <article className="glass-card panel">
        <div className="panel-head">
          <h3 className="title-with-help">
            Upload History
            <InfoHint text="Recent files uploaded from this session for quick access." />
          </h3>
          <button type="button" className="ghost-button" onClick={onOpenDocuments}>
            Go to My Documents
          </button>
        </div>
        <div className="history-list">
          {uploadHistory.length === 0 && <p className="muted">No uploads yet.</p>}
          {uploadHistory.map((item, idx) => (
            <div className="history-item" key={`${item.filename}-${idx}`}>
              <div>
                <strong>{item.filename}</strong>
                <p className="muted">{item.time}</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => onOpenHistoryItem?.(item)}>
                Open in My Documents
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default Upload;
