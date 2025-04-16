import React from "react";

function DataSummary({ result }) {
  if (!result) return null;

  if (result.error) {
    return <div className="summaryCard error">Error: {result.error}</div>;
  }

  const { total, gender_breakdown, bias_detected } = result;

  return (
    <div className="summaryCard">
      <h3>Dataset Summary</h3>
      <p><strong>Total Entries:</strong> {total}</p>
      <p><strong>Gender Breakdown:</strong></p>
      <ul>
        {Object.entries(gender_breakdown).map(([key, value]) => (
          <li key={key}>{key}: {value}</li>
        ))}
      </ul>
      <p>
        <strong>Bias Detected:</strong>{" "}
        {bias_detected ? "Yes — Review Recommended" : "No"}
      </p>
    </div>
  );
}

export default DataSummary;
