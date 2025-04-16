import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import DataSummary from "./components/DataSummary";
import "./App.css";

// Category list (easy to reuse everywhere)
const categories = [
  "Heart Attack",
  "Stroke",
  "Auto-Immune disease",
  "Depression",
  "Alzheimer’s",
  "Adverse drug reactions"
];

function App() {
  // Holds results like { "Stroke": { total: 100, ... }, ... }
  const [categoryResults, setCategoryResults] = useState({});

  // Callback for when UploadForm finishes analysis
  const handleUploadComplete = (category, result) => {
    setCategoryResults(prev => ({
      ...prev,
      [category]: result
    }));
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
          {categories.map((category) =>
            categoryResults[category] ? (
              <div key={category} style={{ marginBottom: "2rem" }}>
                <h3>{category}</h3>
                <DataSummary result={categoryResults[category]} />
              </div>
            ) : null
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
