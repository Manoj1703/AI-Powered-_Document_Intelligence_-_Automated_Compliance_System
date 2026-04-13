import React, { useEffect, useRef, useState } from "react";
import { IconUserCircle, IconShieldCheck, IconCheck } from "./AuthIcons";

const ROLE_OPTIONS = [
  {
    value: "user",
    label: "User",
    Icon: IconUserCircle,
    description: "Standard user for upload and analysis access.",
    color: "#CDEEE1",
  },
  {
    value: "admin",
    label: "Admin",
    Icon: IconShieldCheck,
    description: "Complete system and user management access.",
    color: "#FFE2AE",
  },
];

function mapToBackendRole(value) {
  if (value === "admin") return "admin";
  return "user";
}

function CustomDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const wrapRef = useRef(null);
  const selected = ROLE_OPTIONS.find((item) => item.value === value) || ROLE_OPTIONS[0];

  useEffect(() => {
    function onDocClick(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(next) {
    setOpen(false);
    onChange(next.value, mapToBackendRole(next.value));
  }

  const options = ROLE_OPTIONS;
  const displayOption = hoveredOption || selected;

  return (
    <div className="authx-dropdown" ref={wrapRef}>
      <button
        type="button"
        className={`authx-dropdown-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="authx-dropdown-value">
          <selected.Icon size={16} />
          {selected.label}
        </span>
        <span className="authx-dropdown-caret" aria-hidden="true">v</span>
      </button>

      <div className="authx-dropdown-desc" style={{ color: displayOption?.color }}>
        {displayOption?.description}
      </div>

      <ul className={`authx-dropdown-list ${open ? "is-open" : ""}`} role="listbox">
        {options.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              className={`authx-dropdown-option ${value === item.value ? "is-selected" : ""}`}
              onClick={() => choose(item)}
              onMouseEnter={() => setHoveredOption(item)}
              onMouseLeave={() => setHoveredOption(null)}
              role="option"
              aria-selected={value === item.value}
            >
              <span className="authx-option-icon" style={{ color: item.color }}>
                <item.Icon size={16} />
              </span>
              <span className="authx-option-label">{item.label}</span>
              {value === item.value && (
                <span className="authx-option-check">
                  <IconCheck size={14} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomDropdown;
