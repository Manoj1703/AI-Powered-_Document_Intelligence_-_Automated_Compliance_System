import React from "react";

function strokeProps(size = 16) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
}

export function IconMail({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function IconLock({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function IconShieldCheck({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconUser({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconBriefcase({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5h6v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function IconClock({ size = 14 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconKey({ size = 14 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h10" />
      <path d="M18 12v3" />
      <path d="M15 12v2" />
    </svg>
  );
}

export function IconEye({ size = 18 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}

export function IconEyeOff({ size = 18 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.3A11 11 0 0 1 12 6c6.5 0 10 6 10 6a18.5 18.5 0 0 1-4.1 4.7" />
      <path d="M6.4 8.1A18.5 18.5 0 0 0 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.8" />
      <path d="M10 10a3 3 0 0 0 4 4" />
    </svg>
  );
}

export function IconAlert({ size = 14 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheckCircle({ size = 14 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.7" />
    </svg>
  );
}

export function IconFileText({ size = 20 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14h14V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function IconActivity({ size = 20 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M3 12h4l2-4 3 8 2-4h7" />
    </svg>
  );
}

export function IconScale({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M12 4v16" />
      <path d="M5 7h14" />
      <path d="M7 7l-3 6h6l-3-6z" />
      <path d="M17 7l-3 6h6l-3-6z" />
    </svg>
  );
}

export function IconInfo({ size = 13 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7.2" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconLogin({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H4" />
      <path d="M20 4v16" />
    </svg>
  );
}

export function IconUserPlus({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  );
}

export function IconUserCircle({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconCheck({ size = 16 }) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

