import React from "react";
import "../CSS/ExplanationBox.css";

const ExplanationBox = ({ explanation }) => {
  if (!explanation) return null;

  return (
    <div className="explanation-box">
      <h3>AI-Powered Insight</h3>
      <p>{explanation}</p>
    </div>
  );
};

export default ExplanationBox;
