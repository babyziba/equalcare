import React from "react";
import "../CSS/DataSummary.css";

function DataSummary({ result }) {
  // If there's no result, render nothing
  if (!result) return null;
  
  // If there's an error in the result object, show error message
  if (result.error) {
    return <div className="summary-card error">Error: {result.error}</div>;
  }
  
  // Destructure values from result
  const {
    total,
    gender_breakdown,
    gender_percentages,
    bias_level,
    impact_note,
    source,
    filename,
  } = result;
  
  // Friendly labels for bias levels
  const biasText = {
    balanced: "Balanced",
    mild_imbalance: "Mild Imbalance",
    significant_bias: "Significant Bias",
  };
  
  // Clean and format the filename for display (remove timestamp, underscores, extension)
  const formatFilename = (name) => {
    return name
      ?.replace(/^\d{14}_/, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  return (
    <div className="summary-card">
      <h3 className="summary-title">
        Dataset Summary
        {filename ? ` — ${formatFilename(filename)}` : ""}
      </h3>
      
      {/* Show total number of entries in the dataset */}
      <p className="summary-stat">
        <strong>Total Entries:</strong> {total}
      </p>
      
      {/* Gender breakdown list with counts and percentages */}
      <p className="summary-label">
        <strong>Gender Breakdown:</strong>
      </p>
      <ul className="gender-list">
        {Object.entries(gender_breakdown).map(([key, value]) => (
          <li key={key}>
            {key}: {value} ({gender_percentages?.[key] ?? 0}%)
          </li>
        ))}
      </ul>
      
      {/* Bias level with styled label */}
      <p className="summary-stat bias-row">
        <strong>Bias Level:</strong>{" "}
        <span className={`bias-label ${bias_level}`}>
          {biasText[bias_level] || "Unknown"}
        </span>
      </p>
    </div>
  );
}

export default DataSummary;