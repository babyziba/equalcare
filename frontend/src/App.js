import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import DataSummary from "./components/DataSummary";
import GraphView from "./components/GraphView";
import UploadOverview from "./components/UploadOverview";
import ExplanationBox from "./components/ExplanationBox";

import "./App.css";

// Category list (easy to reuse everywhere)
const categories = [
  "Heart Attack",
  "Stroke",
  "Auto-Immune disease",
  "Depression",
  "Alzheimer’s",
  "Adverse drug reactions",
];

function App() {
  // Holds results like { "Stroke": { total: 100, ... }, ... }
  const [categoryResults, setCategoryResults] = useState({});
  const [explanation, setExplanation] = useState("");


  // Callback for when UploadForm or UploadOverview triggers analysis
  const handleUploadComplete = (category, result) => {
    const key = category && category !== "Unknown" ? category : result.filename;
  
    setCategoryResults((prev) => ({
      ...prev,
      [key]: result,
    }));
  
    // Always trigger explanation if bias level is available
    if (result.bias_level && result.bias_level !== "Unknown") {
      fetch("http://localhost:8000/explain-bias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: category || result.filename, // fallback to filename
          gender_data: result.gender_breakdown,
          bias_level: result.bias_level,
          impact_note: result.impact_note || "",
          source: result.source || ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          setExplanation(data.explanation || "");
        })
        .catch((err) => {
          console.error("Failed to fetch AI explanation", err);
        });
    } else {
      setExplanation(""); // fallback if bias_level is unknown
    }
  };
  

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <header>
        <h1>EqualCare</h1>
        <p>A simple tool to analyze bias in healthcare datasets.</p>
      </header>

      <main>
        {/* Upload Form */}
        <section>
          <UploadForm onUploadComplete={handleUploadComplete} />
        </section>

        {/* Show a summary for each category that has been uploaded */}
        <section>
          <h2>Analysis Results</h2>
          {Object.entries(categoryResults).map(([category, result]) => (
            <div key={category} style={{ marginBottom: "2rem" }}>
              <DataSummary result={result} />
            </div>
          ))}
        </section>

        {/* Chart for most recent result */}
        <GraphView
          genderData={
            Object.values(categoryResults).slice(-1)[0]?.gender_percentages ||
            {}
          }
          genderCounts={
            Object.values(categoryResults).slice(-1)[0]?.gender_breakdown || {}
          }
        />
        <ExplanationBox explanation={explanation} />


        {/* Dashboard Summary section */}
        <section className="section-wrapper">
          <UploadOverview onUploadComplete={handleUploadComplete} />
        </section>
      </main>
    </div>
  );
}

export default App;
