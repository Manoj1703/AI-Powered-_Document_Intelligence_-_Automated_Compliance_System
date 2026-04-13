import React from "react";

function Activity({ items }) {
  return (
    <section className="page-stack">
      <article className="glass-card panel">
        <h3>Activity Log</h3>
        <div className="activity-list">
          {items.length === 0 && <p className="muted">No activity recorded yet.</p>}
          {items.map((item, idx) => (
            <div className="activity-row" key={`${item.time}-${idx}`}>
              <strong>{item.action}</strong>
              <p>{item.detail}</p>
              <span>{item.time}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default Activity;
