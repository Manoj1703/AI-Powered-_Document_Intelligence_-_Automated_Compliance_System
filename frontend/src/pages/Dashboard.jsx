import React, { useMemo, useState } from "react";
import RiskCard from "../components/RiskCard";
import InfoHint from "../components/InfoHint";
import { formatDate, normalizeRisk, prettyRisk } from "../utils";

function toDate(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function inRange(date, range, customStart, customEnd) {
  if (!date) return false;
  const stamp = date.getTime();
  const now = Date.now();

  if (range === "today") return stamp >= startOfToday();
  if (range === "week") return stamp >= now - 7 * 24 * 60 * 60 * 1000;
  if (range === "month") return stamp >= now - 30 * 24 * 60 * 60 * 1000;
  if (range === "year") return stamp >= now - 365 * 24 * 60 * 60 * 1000;
  if (range === "custom") {
    if (!customStart || !customEnd) return true;
    const start = new Date(`${customStart}T00:00:00`).getTime();
    const end = new Date(`${customEnd}T23:59:59`).getTime();
    return stamp >= start && stamp <= end;
  }
  return true;
}

function periodLengthMs(range, customStart, customEnd) {
  if (range === "today") return 24 * 60 * 60 * 1000;
  if (range === "week") return 7 * 24 * 60 * 60 * 1000;
  if (range === "month") return 30 * 24 * 60 * 60 * 1000;
  if (range === "year") return 365 * 24 * 60 * 60 * 1000;
  if (range === "custom" && customStart && customEnd) {
    const start = new Date(`${customStart}T00:00:00`).getTime();
    const end = new Date(`${customEnd}T23:59:59`).getTime();
    return Math.max(24 * 60 * 60 * 1000, end - start + 1);
  }
  return 7 * 24 * 60 * 60 * 1000;
}

function fmtDiff(value) {
  if (value > 0) return `up +${value}`;
  if (value < 0) return `down ${value}`;
  return "stable";
}

function Dashboard({ stats, documents, onNavigate, onQuickUpload, canUpload, isAdmin, onOpenDocument }) {
  const [range, setRange] = useState("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [hoveredSlice, setHoveredSlice] = useState("");

  const scopedDocs = useMemo(() => {
    return documents.filter((doc) => inRange(toDate(doc.uploaded_at || doc.created_at), range, customStart, customEnd));
  }, [documents, range, customStart, customEnd]);

  const high = scopedDocs.filter((doc) => normalizeRisk(doc.overall_risk_level) === "high").length;
  const medium = scopedDocs.filter((doc) => normalizeRisk(doc.overall_risk_level) === "medium").length;
  const low = scopedDocs.filter((doc) => normalizeRisk(doc.overall_risk_level) === "low").length;
  const reviewed = high + medium + low;
  const total = reviewed || 1;
  const unresolved = Math.max(0, scopedDocs.length - reviewed);
  const highShare = Math.round((high / total) * 100);

  const prevPeriodDocs = useMemo(() => {
    const now = Date.now();
    const len = periodLengthMs(range, customStart, customEnd);
    const start = now - len;
    const prevStart = start - len;
    return documents.filter((doc) => {
      const date = toDate(doc.uploaded_at || doc.created_at);
      if (!date) return false;
      const stamp = date.getTime();
      return stamp >= prevStart && stamp < start;
    });
  }, [documents, range, customStart, customEnd]);

  const diffFor = (risk) => {
    const current = scopedDocs.filter((doc) => normalizeRisk(doc.overall_risk_level) === risk).length;
    const previous = prevPeriodDocs.filter((doc) => normalizeRisk(doc.overall_risk_level) === risk).length;
    return current - previous;
  };
  const totalDiff = scopedDocs.length - prevPeriodDocs.length;

  const slices = [
    { label: "High", value: high, color: "#f87171" },
    { label: "Medium", value: medium, color: "#fbbf24" },
    { label: "Low", value: low, color: "#34d399" },
  ];
  const withPct = slices.map((slice) => ({
    ...slice,
    pct: Math.round((slice.value / total) * 100),
  }));

  const hoveredData = withPct.find((item) => item.label === hoveredSlice) || null;
  const dominant = [...withPct].sort((a, b) => b.value - a.value)[0] || withPct[0];

  const riskScore = reviewed
    ? Math.round(((low * 1 + medium * 0.62 + high * 0.28) / reviewed) * 100)
    : 0;

  const recent = [...documents].slice(0, 5);

  return (
    <section className="page-stack dashboard-page">
      <div className="stats-grid">
        <RiskCard label="Total Documents" value={scopedDocs.length} icon="DOC" trend={`${fmtDiff(totalDiff)} vs previous`} />
        <RiskCard label="High Risk" value={high} risk="high" icon="H" trend={`${fmtDiff(diffFor("high"))} this ${range}`} />
        <RiskCard label="Medium Risk" value={medium} risk="medium" icon="M" trend={`${fmtDiff(diffFor("medium"))} this ${range}`} />
        <RiskCard label="Low Risk" value={low} risk="low" icon="L" trend={`${fmtDiff(diffFor("low"))} this ${range}`} />
      </div>

      <div className="dashboard-analytics-grid">
        <article className="glass-card panel">
          <div className="panel-head">
            <h3 className="title-with-help">
              Risk Distribution
              <InfoHint text="Shows how uploaded documents are split by High, Medium, and Low risk." />
            </h3>
            <div className="range-filters" role="group" aria-label="Dashboard range">
              <button type="button" className={`ghost-button ${range === "today" ? "active-filter" : ""}`} onClick={() => setRange("today")}>
                Today
              </button>
              <button type="button" className={`ghost-button ${range === "week" ? "active-filter" : ""}`} onClick={() => setRange("week")}>
                Week
              </button>
              <button type="button" className={`ghost-button ${range === "month" ? "active-filter" : ""}`} onClick={() => setRange("month")}>
                Month
              </button>
              <button type="button" className={`ghost-button ${range === "year" ? "active-filter" : ""}`} onClick={() => setRange("year")}>
                Year
              </button>
              <button type="button" className={`ghost-button ${range === "custom" ? "active-filter" : ""}`} onClick={() => setRange("custom")}>
                Custom
              </button>
            </div>
          </div>

          {range === "custom" && (
            <div className="custom-range-row">
              <label>
                Start
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </label>
              <label>
                End
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </label>
            </div>
          )}

          <div className="risk-layout">
            <div>
              <div className="chart-shell">
                <svg viewBox="0 0 40 40" className="pie-chart pie-draw" aria-label="Risk distribution">
                  {(() => {
                    let offset = 0;
                    return withPct.map((slice) => {
                      const segment = (slice.value / total) * 100;
                      const active = !hoveredSlice || hoveredSlice === slice.label;
                      const node = (
                        <circle
                          key={slice.label}
                          r="15.5"
                          cx="20"
                          cy="20"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="5.8"
                          strokeDasharray={`${segment} ${100 - segment}`}
                          strokeDashoffset={-offset}
                          className={`pie-segment ${active ? "active" : "muted"}`}
                          onMouseEnter={() => setHoveredSlice(slice.label)}
                          onMouseLeave={() => setHoveredSlice("")}
                        />
                      );
                      offset += segment;
                      return node;
                    });
                  })()}
                </svg>
                <div className="donut-center">
                  <div className="donut-center-inner">
                    <strong>{scopedDocs.length}</strong>
                    <span>Total Docs</span>
                  </div>
                </div>
                {hoveredData && (
                  <div className="chart-tooltip">
                    <strong>{hoveredData.label} Risk</strong>
                    <span>{hoveredData.value} documents</span>
                    <span>{hoveredData.pct}%</span>
                  </div>
                )}
              </div>

              <div className="legend-grid">
                {withPct.map((slice) => (
                  <div
                    key={slice.label}
                    className={`legend-item ${hoveredSlice === slice.label ? "active-legend" : ""}`}
                    onMouseEnter={() => setHoveredSlice(slice.label)}
                    onMouseLeave={() => setHoveredSlice("")}
                  >
                    <span style={{ backgroundColor: slice.color }} />
                    <strong>{slice.label} Risk</strong>
                    <small>
                      {slice.value} ({slice.pct}%)
                    </small>
                  </div>
                ))}
              </div>

              <div className="risk-breakdown">
                <h4>Risk Breakdown</h4>
                {withPct.map((slice) => (
                  <div key={`${slice.label}-bar`} className="risk-break-row">
                    <div className="risk-break-head">
                      <span>{slice.label} Risk</span>
                      <small>
                        {slice.value} docs ({slice.pct}%)
                      </small>
                    </div>
                    <div className="risk-break-track">
                      <div className="risk-break-fill" style={{ width: `${slice.pct}%`, backgroundColor: slice.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="glass-card panel">
          <div className="panel-head">
            <h3 className="title-with-help">
              AI Insight
              <InfoHint text="Quick summary generated from current results to help prioritize review work." />
            </h3>
          </div>
          <div className="insight-panel">
            <p>
              Most documents are <strong>{dominant.label}</strong> risk ({dominant.pct}%).
              {" "}
              {high} high-risk document{high === 1 ? "" : "s"} need priority review.
            </p>
            <div className="insight-stats">
              <div className="insight-stat">
                <span>Total Analyzed</span>
                <strong>{reviewed}</strong>
              </div>
              <div className="insight-stat">
                <span>Risk Score</span>
                <strong>{riskScore} / 100</strong>
              </div>
              <div className="insight-stat">
                <span>Documents Analyzed Today</span>
                <strong>{documents.filter((doc) => inRange(toDate(doc.uploaded_at || doc.created_at), "today")).length}</strong>
              </div>
            </div>
            <div className="trend-lines">
              <p>
                <strong>High Risk</strong> {fmtDiff(diffFor("high"))}
              </p>
              <p>
                <strong>Medium Risk</strong> {fmtDiff(diffFor("medium"))}
              </p>
              <p>
                <strong>Low Risk</strong> {fmtDiff(diffFor("low"))}
              </p>
            </div>
            <div className="insight-mini-grid">
              <div className="insight-mini">
                <span>Average Risk Score</span>
                <strong>{riskScore} / 100</strong>
              </div>
              <div className="insight-mini">
                <span>High Risk Docs</span>
                <strong>{high}</strong>
              </div>
              <div className="insight-mini">
                <span>Medium Risk Docs</span>
                <strong>{medium}</strong>
              </div>
            </div>
          </div>
        </article>

      </div>

      <article className="glass-card panel">
        <div className="panel-head">
          <h3 className="title-with-help">
            {isAdmin ? "Admin Control Center" : "Quick Actions"}
            <InfoHint text="Shortcuts for navigation and role-based tasks you can perform right now." />
          </h3>
        </div>
        <div className="dashboard-actions-grid">
          {canUpload && (
            <button className="primary-button" type="button" onClick={onQuickUpload}>
              Quick Upload
            </button>
          )}
          <button className="ghost-button" type="button" onClick={() => onNavigate("documents")}>
            Open Documents
          </button>
          <button className="ghost-button" type="button" onClick={() => onNavigate("analytics")}>
            View Analytics
          </button>
          {isAdmin && (
            <button className="ghost-button" type="button" onClick={() => onNavigate("users")}>
              Manage Users
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="admin-snapshot-grid">
            <div className="admin-kpi">
              <p className="card-label">High Risk Share</p>
              <strong>{highShare}%</strong>
            </div>
            <div className="admin-kpi">
              <p className="card-label">Pending Classification</p>
              <strong>{unresolved}</strong>
            </div>
            <div className="admin-kpi">
              <p className="card-label">Reviewed</p>
              <strong>{reviewed}</strong>
            </div>
          </div>
        )}
      </article>

      <article className="glass-card panel">
        <div className="panel-head">
          <h3 className="title-with-help">
            Recent Documents
            <InfoHint text="Latest uploaded files with direct actions to view details or open analytics." />
          </h3>
          <button type="button" className="ghost-button" onClick={() => onNavigate("documents")}>
            View All
          </button>
        </div>
        <div className="recent-list">
          {recent.length === 0 && <p className="muted">No documents yet.</p>}
          {recent.map((doc) => (
            <div key={doc.id} className="recent-row">
              <div className="recent-meta">
                <strong>DOC {doc.filename || "Unknown"}</strong>
                <p>{doc.title || "Untitled"}</p>
              </div>
              <div className="recent-actions">
                <span className={`risk-pill risk-${normalizeRisk(doc.overall_risk_level)}`}>
                  {prettyRisk(doc.overall_risk_level)}
                </span>
                <small>{formatDate(doc.uploaded_at || doc.created_at)}</small>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => onOpenDocument?.(doc.id)}>
                    View
                  </button>
                  <button type="button" className="ghost-button" onClick={() => onNavigate("analytics")}>
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default Dashboard;
