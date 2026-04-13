import React, { useMemo } from "react";
import InfoHint from "../components/InfoHint";
import { buildMonthlyTrend, exportAnalyticsReport } from "../utils";

function Analytics({ stats, documents }) {
  const riskData = [
    { label: "High", value: Number(stats?.risk_breakdown?.high) || 0, color: "#f87171" },
    { label: "Medium", value: Number(stats?.risk_breakdown?.medium) || 0, color: "#fbbf24" },
    { label: "Low", value: Number(stats?.risk_breakdown?.low) || 0, color: "#34d399" },
  ];

  const trend = useMemo(() => buildMonthlyTrend(documents, 6), [documents]);
  const maxTrend = Math.max(...trend.map((item) => item.count), 1);

  const categories = useMemo(() => {
    const map = new Map();
    documents.forEach((doc) => {
      const key = doc.document_type || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([label, count]) => ({ label, count }));
  }, [documents]);

  function onExport() {
    exportAnalyticsReport({
      generated_at: new Date().toISOString(),
      risk_data: riskData,
      trend,
      categories,
    });
  }

  return (
    <section className="page-stack">
      <article className="glass-card panel">
        <div className="panel-head">
          <h3 className="title-with-help">
            Risk Count by Level
            <InfoHint text="Count of analyzed documents grouped by risk severity." />
          </h3>
          <button type="button" className="primary-button" onClick={onExport}>
            Export Report
          </button>
        </div>
        <div className="bar-grid">
          {riskData.map((item) => (
            <div key={item.label} className="bar-row">
              <span>{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.min(100, item.value * 12 + 6)}%`, background: item.color }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card panel">
        <h3 className="title-with-help">
          Monthly Upload Trend
          <InfoHint text="Upload volume trend across recent months to monitor activity." />
        </h3>
        <svg viewBox="0 0 300 120" className="trend-chart" aria-label="Monthly upload trend">
          <polyline
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="3"
            points={trend
              .map((item, idx) => {
                const x = 20 + idx * 52;
                const y = 100 - (item.count / maxTrend) * 70;
                return `${x},${y}`;
              })
              .join(" ")}
          />
          {trend.map((item, idx) => {
            const x = 20 + idx * 52;
            const y = 100 - (item.count / maxTrend) * 70;
            return <circle key={item.key} cx={x} cy={y} r="4" fill="#e2e8f0" />;
          })}
        </svg>
        <div className="trend-labels">
          {trend.map((item) => (
            <span key={item.key}>{item.label}</span>
          ))}
        </div>
      </article>

      <article className="glass-card panel">
        <h3 className="title-with-help">
          Risk Category Breakdown
          <InfoHint text="Document type distribution to identify dominant contract categories." />
        </h3>
        <div className="category-list">
          {categories.length === 0 && <p className="muted">No categories available.</p>}
          {categories.map((item) => (
            <div className="category-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default Analytics;
