import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

function Icon({ name }) {
  const common = {
    className: "nav-item-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    );
  }
  if (name === "documents") {
    return (
      <svg {...common}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "analytics") {
    return (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
      </svg>
    );
  }
  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 7-4-14-3 7H2" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.2a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h.2a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.2a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1z" />
      </svg>
    );
  }
  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }
  return <span className="nav-item-fallback">•</span>;
}

const ICON_BY_KEY = {
  dashboard: "dashboard",
  documents: "documents",
  users: "users",
  analytics: "analytics",
  activity: "activity",
  settings: "settings",
};

function Sidebar({ items, currentPage, collapsed, onToggle, onNavigate, onLogout }) {
  const itemRefs = useRef([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [indicator, setIndicator] = useState({ y: 0, h: 0, visible: false });
  const activeIndex = useMemo(() => items.findIndex((item) => item.key === currentPage), [items, currentPage]);
  const targetIndex = hoveredIndex ?? activeIndex;

  useLayoutEffect(() => {
    if (targetIndex < 0) return;
    const el = itemRefs.current[targetIndex];
    if (!el) return;
    setIndicator({
      y: el.offsetTop,
      h: el.offsetHeight,
      visible: true,
    });
  }, [targetIndex, items, collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <button className="icon-button" onClick={onToggle} type="button" aria-label="Toggle sidebar">
          {collapsed ? ">" : "<"}
        </button>
        {!collapsed && (
          <div>
            <h2>DocAgent</h2>
            <p>Legal Risk Intelligence</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" onMouseLeave={() => setHoveredIndex(null)}>
        <div className="sidebar-nav-list">
          <span
            className={`sidebar-hover-indicator ${indicator.visible ? "visible" : ""}`}
            aria-hidden="true"
            style={{
              height: `${indicator.h}px`,
              transform: `translate3d(0, ${indicator.y}px, 0)`,
            }}
          />
          {items.map((item, index) => (
            <button
              key={item.key}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              className={`nav-link ${currentPage === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon name={ICON_BY_KEY[item.key]} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <button type="button" className="nav-link logout" onClick={onLogout} title="Logout" aria-label="Logout">
        <Icon name="logout" />
        {!collapsed && <span className="nav-label">Logout</span>}
      </button>
    </aside>
  );
}

export default Sidebar;
