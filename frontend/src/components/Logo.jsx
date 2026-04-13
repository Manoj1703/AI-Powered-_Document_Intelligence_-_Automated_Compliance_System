import React from "react";

function Logo({ size = "large", compact = false }) {
  const dims = size === "large" ? { w: 48, h: 54, fs: "2.1rem" } : { w: 28, h: 32, fs: "1.25rem" };
  return (
    <div className={`authx-logo ${size === "large" ? "is-large" : "is-small"}`}>
      <span className="authx-logo-mark" aria-hidden="true">
        <svg width={dims.w} height={dims.h} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`shieldGradient-${size}`} x1="5" y1="3" x2="27" y2="33" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1D4ED8" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path
            d="M16 2L28 7V17.5C28 25 23.6 30.6 16 34C8.4 30.6 4 25 4 17.5V7L16 2Z"
            fill={`url(#shieldGradient-${size})`}
            stroke="rgba(59,130,246,0.55)"
            strokeWidth="1.2"
          />
          <path d="M10 10.5V25.5L20.8 22.6V13.4L10 10.5Z" stroke="#DDEBFF" strokeWidth="1.4" />
          <path d="M10 25.5L20.8 13.4" stroke="#DDEBFF" strokeWidth="1.2" />
        </svg>
      </span>
      {!compact && (
        <span className="authx-logo-text" style={{ fontSize: dims.fs }}>
          DocAgent
        </span>
      )}
    </div>
  );
}

export default Logo;
