import React from "react";

// This component displays the analysis results returned from the backend
function DataSummary({ result }) {
  // If there's no result yet don't render anything
  if (!result) return null;

  // If backend returned an error, show it to the user
  if (result.error) {
    return <div className="summaryCard error">Error: {result.error}</div>;
  }

  const { total, gender_breakdown, bias_detected } = result;

  return (
    <div className="summaryCard">
      <h3>Dataset Summary</h3>

      {/* Show the total number of entries in the dataset */}
      <p><strong>Total Entries:</strong> {total}</p>

      {/* Display the gender distribution as a list */}
      <p><strong>Gender Breakdown:</strong></p>
      <ul>
        {Object.entries(gender_breakdown).map(([key, value]) => (
          <li key={key}>{key}: {value}</li>
        ))}
      </ul>

      {/* Indicate if bias was detected */}
      <p>
        <strong>Bias Detected:</strong>{" "}
        {bias_detected ? "Yes — Review Recommended" : "No"}
      </p>
    </div>
  );
}

export default DataSummary;
