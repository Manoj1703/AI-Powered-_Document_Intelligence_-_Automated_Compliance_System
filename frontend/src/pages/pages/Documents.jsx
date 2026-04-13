import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import DocumentTable from "../components/DocumentTable";
import InfoHint from "../components/InfoHint";
import { RISK_FILTERS, prettyRisk } from "../utils";

const PAGE_SIZE = 6;

function Documents({ documents, loading, onView, onDelete }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const indexedDocuments = useMemo(
    () =>
      documents.map((doc) => ({
        doc,
        searchText: `${String(doc.filename || "")} ${String(doc.title || "")} ${String(doc.document_type || "")}`.toLowerCase(),
      })),
    [documents],
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return indexedDocuments
      .filter(({ doc, searchText }) => {
      const passRisk = risk === "All" || prettyRisk(doc.overall_risk_level) === risk;
      const passQuery = !q || searchText.includes(q);
      return passRisk && passQuery;
      })
      .map(({ doc }) => doc);
  }, [indexedDocuments, deferredQuery, risk]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="page-stack">
      <article className="glass-card panel">
        <div className="panel-head">
          <h3 className="title-with-help">
            Document Filters
            <InfoHint text="Filter by text and risk level to quickly find specific contracts or reports." />
          </h3>
        </div>
        <div className="filters-row">
          <input
            aria-label="Search documents"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search documents..."
          />
          <select
            aria-label="Filter by risk"
            value={risk}
            onChange={(e) => {
              setRisk(e.target.value);
              setPage(1);
            }}
          >
            {RISK_FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {filter}
              </option>
            ))}
          </select>
        </div>
      </article>

      <DocumentTable documents={current} loading={loading} onView={onView} onDelete={onDelete} />

      <article className="glass-card panel pagination-row">
        <button type="button" className="ghost-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <p>
          Page {page} of {totalPages}
        </p>
        <button
          type="button"
          className="ghost-button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </article>
    </section>
  );
}

export default Documents;
