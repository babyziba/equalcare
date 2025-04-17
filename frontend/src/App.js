import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import DataSummary from "./components/DataSummary";
import GraphView from "./components/GraphView";
import UploadOverview from "./components/UploadOverview";
import ExplanationBox from "./components/ExplanationBox";

import "./App.css";

function App() {
  const [fileResults, setFileResults] = useState({});
  const [explanations, setExplanations] = useState({});
  const [activeFile, setActiveFile] = useState(null);

  const handleUploadComplete = (filename, result) => {
    if (!filename) return;

    setFileResults((prev) => ({
      ...prev,
      [filename]: result,
    }));
    setActiveFile(filename);

    if (result.bias_level && result.bias_level !== "Unknown") {
      fetch("http://localhost:8000/explain-bias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: filename,
          gender_data: result.gender_breakdown,
          bias_level: result.bias_level,
          impact_note: result.impact_note || "",
          source: result.source || "",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setExplanations((prev) => ({
            ...prev,
            [filename]: data.explanation || "",
          }));
        })
        .catch((err) => {
          console.error("Failed to fetch AI explanation", err);
        });
    }
  };

  const handleClear = () => {
    setFileResults({});
    setExplanations({});
    setActiveFile(null);
  };

  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <header>
        <h1>EqualCare</h1>
        <p>A simple tool to analyze bias in healthcare datasets.</p>
      </header>

      <main>
        <section>
          <UploadForm onUploadComplete={handleUploadComplete} />
        </section>

        {Object.keys(fileResults).length > 0 && (
          <section className="analysis-section">
            <div className="analysis-wrapper">
              {/* Left side - scrollable summaries */}
              <div className="scrollable-summary-list">
                {Object.entries(fileResults).map(([file, result]) => (
                  <div
                    key={file}
                    className={`summary-card-wrapper ${
                      activeFile === file ? "active" : ""
                    }`}
                    onClick={() => setActiveFile(file)}
                  >
                    <DataSummary result={result} />
                  </div>
                ))}
                <button className="clear-button" onClick={handleClear}>
                  Clear All
                </button>
              </div>

              {/* Right side - graph only */}
              <div className="analysis-right">
                {activeFile && fileResults[activeFile] && (
                  <GraphView
                    genderData={
                      fileResults[activeFile]?.gender_percentages || {}
                    }
                    genderCounts={
                      fileResults[activeFile]?.gender_breakdown || {}
                    }
                  />
                )}
              </div>
            </div>

            {/* Full-width AI explanation box */}
            {activeFile && (
              <div className="full-width-explanation">
                <ExplanationBox explanation={explanations[activeFile] || ""} />
              </div>
            )}
          </section>
        )}

        <section className="section-wrapper">
          <UploadOverview onUploadComplete={handleUploadComplete} />
        </section>
      </main>
    </div>
  );
}

export default App;
