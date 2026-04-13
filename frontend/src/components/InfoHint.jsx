import React from "react";

function InfoHint({ text, label = "Feature help" }) {
  return (
    <span className="info-hint-wrap">
      <button type="button" className="info-hint" aria-label={label}>
        i
      </button>
      <span className="info-hint-text" role="tooltip">
        {text}
      </span>
    </span>
  );
}

export default InfoHint;
