import React from "react";

function PasswordStrengthBar({ score, label }) {
  const active = Math.max(0, Math.min(4, Number(score) || 0));
  return (
    <div className="authx-strength">
      <div className="authx-strength-head">
        <span>Password Strength</span>
        <strong className={`authx-strength-label level-${active}`}>{label}</strong>
      </div>
      <div className="authx-strength-track" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={active}>
        {[1, 2, 3, 4].map((index) => (
          <span key={index} className={`authx-strength-segment ${active >= index ? "is-on" : ""} level-${index}`} />
        ))}
      </div>
    </div>
  );
}

export default PasswordStrengthBar;
