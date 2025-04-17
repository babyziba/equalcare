import React from "react";
import "../CSS/DataSummary.css";

function DataSummary({ result }) {
  if (!result) return null;

  if (result.error) {
    return <div className="summary-card error">Error: {result.error}</div>;
  }

  const {
    total,
    gender_breakdown,
    gender_percentages,
    bias_level,
    impact_note,
    source,
  } = result;

  const biasText = {
    balanced: "Balanced",
    mild_imbalance: "Mild Imbalance",
    significant_bias: "Significant Bias",
  };

  return (
    <div className="summary-card">
      <h3>
        Dataset Summary
        {result.filename ? ` — ${result.filename}` : ""}
      </h3>

      <p>
        <strong>Total Entries:</strong> {total}
      </p>

      <p>
        <strong>Gender Breakdown:</strong>
      </p>
      <ul className="gender-list">
        {Object.entries(gender_breakdown).map(([key, value]) => (
          <li key={key}>
            {key}: {value} ({gender_percentages?.[key] ?? 0}%)
          </li>
        ))}
      </ul>

      <p>
        <strong>Bias Level:</strong>{" "}
        <span className={`bias-label ${bias_level}`}>
          {biasText[bias_level] || "Unknown"}
        </span>
      </p>
    </div>
  );
}

export default DataSummary;
