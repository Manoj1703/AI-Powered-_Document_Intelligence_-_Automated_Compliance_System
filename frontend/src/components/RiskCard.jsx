import React, { useEffect, useState } from "react";
import { normalizeRisk } from "../utils";

function RiskCard({ label, value, risk, icon, trend }) {
  const tone = risk ? `risk-${normalizeRisk(risk)}` : "";
  const target = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const durationMs = 700;
    const frameMs = 16;
    const steps = Math.max(1, Math.floor(durationMs / frameMs));
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      const next = Math.round((target * step) / steps);
      setDisplayValue(next);
      if (step >= steps) {
        window.clearInterval(timer);
        setDisplayValue(target);
      }
    }, frameMs);

    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <article className={`glass-card stat-card ${tone}`}>
      <div className="stat-head">
        <p className="card-label">{label}</p>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <h3>{displayValue}</h3>
      {trend && <p className="stat-trend">{trend}</p>}
    </article>
  );
}

export default RiskCard;
