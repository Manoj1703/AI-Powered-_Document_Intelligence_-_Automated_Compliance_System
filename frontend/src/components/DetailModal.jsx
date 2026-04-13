import React, { useEffect } from "react";
import { formatBytes, formatDate, hasItems, normalizeRisk, prettyRisk } from "../utils";

function DetailModal({ open, loading, error, document: selectedDocument, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = window.document.body.style.overflow || "";
    window.document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  const hasExtraDetails =
    selectedDocument &&
    String(selectedDocument.detailed_summary || "").trim() &&
    String(selectedDocument.detailed_summary || "").trim() !== String(selectedDocument.summary || "").trim();

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <section className="modal-panel glass-card" role="dialog" aria-modal="true" aria-labelledby="doc-insights-title">
        <div className="modal-head">
          <h3 id="doc-insights-title">Document Insights</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-content">
          {loading && <p className="muted">Loading document insights...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && selectedDocument && (
            <div className="detail-grid">
              <article className="glass-card mini-card">
                <h4>{selectedDocument.title}</h4>
                <p className="muted">{selectedDocument.document_type}</p>
                <p>
                  Risk Level:{" "}
                  <span className={`risk-pill risk-${normalizeRisk(selectedDocument.overall_risk_level)}`}>
                    {prettyRisk(selectedDocument.overall_risk_level)}
                  </span>
                </p>
                <p>AI Confidence: {selectedDocument.confidence}%</p>
              </article>

              <article className="glass-card mini-card">
                <h4>Metadata</h4>
                <dl className="modal-meta-list">
                  <div>
                    <dt>Filename</dt>
                    <dd>{selectedDocument.filename}</dd>
                  </div>
                  <div>
                    <dt>Author</dt>
                    <dd>{selectedDocument.author}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{selectedDocument.date || "Not Available"}</dd>
                  </div>
                  <div>
                    <dt>Uploaded</dt>
                    <dd>{formatDate(selectedDocument.uploaded_at)}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{formatBytes(selectedDocument.content_length)}</dd>
                  </div>
                </dl>
              </article>

              <article className="glass-card mini-card full-row">
                <h4>AI Summary</h4>
                <p className="detail-copy">{selectedDocument.summary}</p>
                {hasExtraDetails && (
                  <details className="detail-more">
                    <summary>Detailed Summary</summary>
                    <p className="detail-copy">{selectedDocument.detailed_summary}</p>
                  </details>
                )}
              </article>

              <article className="glass-card mini-card">
                <h4>Clause Extraction</h4>
                {hasItems(selectedDocument.key_clauses) ? (
                  <ul>
                    {selectedDocument.key_clauses.map((item, index) => (
                      <li key={`${index}-${String(item)}`}>{String(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No clauses extracted.</p>
                )}
              </article>

              <article className="glass-card mini-card">
                <h4>Risk Keywords</h4>
                {hasItems(selectedDocument.risk_types) ? (
                  <div className="tag-wrap">
                    {selectedDocument.risk_types.map((item, index) => (
                      <span className="tag" key={`${index}-${String(item)}`}>
                        {String(item)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No risk keywords.</p>
                )}
              </article>

              <article className="glass-card mini-card">
                <h4>Key Topics</h4>
                {hasItems(selectedDocument.key_topics) ? (
                  <div className="tag-wrap">
                    {selectedDocument.key_topics.map((item, index) => (
                      <span className="tag" key={`${index}-${String(item)}`}>
                        {String(item)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No key topics.</p>
                )}
              </article>

              <article className="glass-card mini-card">
                <h4>Obligations</h4>
                {hasItems(selectedDocument.obligations) ? (
                  <ul>
                    {selectedDocument.obligations.map((item, index) => (
                      <li key={`${index}-${String(item)}`}>{String(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No obligations found.</p>
                )}
              </article>

              <article className="glass-card mini-card full-row">
                <h4>Compliance Issues</h4>
                {hasItems(selectedDocument.compliance_issues) ? (
                  <ul>
                    {selectedDocument.compliance_issues.map((item, index) => (
                      <li key={`${index}-${String(item)}`}>{String(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No compliance issues found.</p>
                )}
              </article>

              <article className="glass-card mini-card full-row">
                <h4>Risk Analysis</h4>
                {hasItems(selectedDocument.risks) ? (
                  <div className="risk-grid">
                    {selectedDocument.risks.map((risk, index) => (
                      <div className="risk-item" key={`${index}-${String(risk?.risk_type || "risk")}`}>
                        <div className="risk-item-head">
                          <strong>{risk?.risk_type || "General Risk"}</strong>
                          <span className={`risk-pill risk-${normalizeRisk(risk?.severity)}`}>
                            {prettyRisk(risk?.severity)}
                          </span>
                        </div>
                        <p className="detail-copy">{risk?.description || "No description."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No structured risk entries available.</p>
                )}
              </article>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DetailModal;
