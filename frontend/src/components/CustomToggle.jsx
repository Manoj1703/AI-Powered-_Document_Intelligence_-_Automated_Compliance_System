import React from "react";
import { IconClock, IconInfo } from "./AuthIcons";

function CustomToggle({ checked, onChange }) {
  return (
    <div className="authx-toggle-wrap">
      <button
        type="button"
        className={`authx-toggle ${checked ? "is-on" : ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="authx-toggle-knob" />
      </button>
      <span className="authx-toggle-label">
        <IconClock size={13} />
        <span>Stay signed in for 30 days</span>
        <span className="authx-inline-hint-wrap">
          <button type="button" className="authx-inline-hint" aria-label="Remember me help">
            <IconInfo size={13} />
          </button>
          <span className="authx-inline-hint-text">Keeps you logged in on this device. Do not use on shared computers.</span>
        </span>
      </span>
    </div>
  );
}

export default CustomToggle;
