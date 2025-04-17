import React from "react";

function DataSummary({ result }) {
  if (!result) return null;

  if (result.error) {
    return <div className="summaryCard error">Error: {result.error}</div>;
  }

  const {
    total,
    gender_breakdown,
    gender_percentages,
    bias_level,
    impact_note,
    source
  } = result;

  // Convert bias label to friendly display
  const biasText = {
    balanced: "Balanced",
    mild_imbalance: "Mild Imbalance",
    significant_bias: "Significant Bias"
  };

  return (
    <div className="summaryCard">
      <h3>Dataset Summary</h3>

      <p><strong>Total Entries:</strong> {total}</p>

      <p><strong>Gender Breakdown:</strong></p>
      <ul>
        {Object.entries(gender_breakdown).map(([key, value]) => (
          <li key={key}>
            {key}: {value} ({gender_percentages?.[key] ?? 0}%)
          </li>
        ))}
      </ul>

      <p>
        <strong>Bias Level:</strong>{" "}
        <span className={`biasLabel ${bias_level}`}>
          {biasText[bias_level] || "Unknown"}
        </span>
      </p>

      {/* Impact Note and Source if available */}
      {impact_note && (
        <>
          <p><strong>Impact Insight:</strong> {impact_note}</p>
          {source && (
            <p>
              <strong>Source:</strong>{" "}
              <a href={source} target="_blank" rel="noopener noreferrer">
                {source}
              </a>
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default DataSummary;
