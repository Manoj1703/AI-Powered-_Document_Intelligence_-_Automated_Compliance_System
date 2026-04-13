import React, { memo } from "react";
import { normalizeRisk, prettyRisk } from "../utils";

const DocumentRow = memo(function DocumentRow({ doc, index, onView, onDelete }) {
  return (
    <tr className="doc-row-enter" style={{ animationDelay: `${index * 60}ms` }}>
      <td>{doc.filename || "Unknown"}</td>
      <td>{doc.title || "Unknown"}</td>
      <td>{doc.document_type || "Unknown"}</td>
      <td>
        <span className={`risk-pill risk-${normalizeRisk(doc.overall_risk_level)}`}>
          {prettyRisk(doc.overall_risk_level)}
        </span>
      </td>
      <td>
        <div className="row-actions">
          <button type="button" className="ghost-button" onClick={() => onView(doc.id)} aria-label={`View ${doc.filename || "document"}`}>
            View
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(doc)} aria-label={`Delete ${doc.filename || "document"}`}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

function DocumentTable({ documents, loading, onView, onDelete }) {
  return (
    <div className="table-wrap glass-card">
      <table aria-label="Documents table">
        <caption className="sr-only">Document list with title, type, risk, and actions</caption>
        <thead>
          <tr>
            <th scope="col">Filename</th>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">Risk</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="5" className="table-empty">Loading documents...</td>
            </tr>
          )}

          {!loading && documents.length === 0 && (
            <tr>
              <td colSpan="5" className="table-empty">No documents found.</td>
            </tr>
          )}

          {!loading &&
            documents.map((doc, index) => <DocumentRow key={doc.id || `${doc.filename || "doc"}-${index}`} doc={doc} index={index} onView={onView} onDelete={onDelete} />)}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;
