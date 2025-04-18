import React, { useState, useEffect } from "react";
import UploadForm from "./components/UploadForm";
import DataSummary from "./components/DataSummary";
import GraphView from "./components/GraphView";
import UploadOverview from "./components/UploadOverview";
import ExplanationBox from "./components/ExplanationBox";
import logo from "./CSS/equal_care.png";
import AiLoader from "./components/AiLoader";

import "./App.css";

function App() {
  const [fileResults, setFileResults] = useState({});
  const [explanations, setExplanations] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchUploadHistory = () => {
    fetch("http://localhost:8000/upload-history")
      .then((res) => res.json())
      .then((data) => setUploadHistory(data))
      .catch((err) => console.error("Failed to fetch upload history", err));
  };

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const handleUploadComplete = (filename, result) => {
    if (!filename) return;

    setFileResults((prev) => ({
      ...prev,
      [filename]: result,
    }));
    setActiveFile(filename);
    fetchUploadHistory();

    if (result.bias_level && result.bias_level !== "Unknown") {
      const query = `Dataset: ${filename}, Bias: ${result.bias_level}, Male: ${
        result.gender_breakdown.male || 0
      }, Female: ${result.gender_breakdown.female || 0}`;

      setAiLoading(true);

      fetch("http://localhost:8000/rag-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("RAG response:", data);

          const isStructured =
            typeof data.issue === "string" &&
            typeof data.impact === "string" &&
            typeof data.solution === "string";

          if (isStructured) {
            setExplanations((prev) => ({
              ...prev,
              [filename]: {
                issue: data.issue.trim(),
                impact: data.impact.trim(),
                solution: data.solution.trim(),
              },
            }));
          } else {
            const raw = data.ai_response || "";
            const sectionRegex =
              /(?:^|\n)(Issue|Impact|Solution)\s*[:\-\u2013]?\s*((?:.|\n)*?)(?=\n(?:Issue|Impact|Solution)\s*[:\-\u2013]?|\n*$)/gi;

            let fallbackParsed = { issue: "", impact: "", solution: "" };
            let match;

            while ((match = sectionRegex.exec(raw)) !== null) {
              const label = match[1].toLowerCase();
              const content = match[2].trim();
              fallbackParsed[label] = content;
            }

            setExplanations((prev) => ({
              ...prev,
              [filename]: {
                issue:
                  fallbackParsed.issue ||
                  "No issue explanation found in AI response.",
                impact:
                  fallbackParsed.impact ||
                  "No impact explanation found in AI response.",
                solution:
                  fallbackParsed.solution ||
                  "No solution explanation found in AI response.",
              },
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to fetch RAG insight:", err);
        })
        .finally(() => {
          setAiLoading(false);
        });
    }
  };

  const handleClear = () => {
    setFileResults({});
    setExplanations({});
    setActiveFile(null);
  };

  const clearUploadHistory = () => {
    fetch("http://localhost:8000/upload-history", { method: "DELETE" })
      .then(() => {
        setUploadHistory([]);
        setFileResults({});
        setExplanations({});
        setActiveFile(null);
      })
      .catch((err) => console.error("Failed to clear upload history", err));
  };

  return (
    <div className="App">
      <div className="hero-fullwrap">
        <header className="hero-section">
          <img src={logo} alt="EqualCare logo" className="hero-logo" />
          <p className="hero-badge">
            ⚖️ Gender Equity in Research Starts with Data
          </p>
        </header>
      </div>

      <div className="purpose-section">
        <div className="purpose-container">
          <h2>Our Mission: Gender Balance in Healthcare Research</h2>
          <p className="purpose-text">
            EqualCare is a bias detection tool for healthcare researchers and
            developers. Upload your clinical trial datasets and we'll analyze
            gender representation, highlight imbalance, and explain how it may
            impact real-world outcomes.
          </p>
          <div className="impact-points">
            <div className="impact-item">
              <span className="impact-icon">🔬</span>
              <h3>Better Research</h3>
              <p>
                Inclusive datasets produce research that reflects the realities
                of diverse populations.
              </p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">💊</span>
              <h3>Informed Care</h3>
              <p>
                Understanding how different genders respond to treatment leads
                to safer, more effective therapies.
              </p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">⚕️</span>
              <h3>Health Equity</h3>
              <p>
                Balanced data is the foundation of fair, effective, and
                equitable healthcare for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="main-content">
        <div className="process-steps">
          <div className="step-bubble">📤 Upload a dataset</div>
          <div className="step-bubble">📊 View gender breakdown</div>
          <div className="step-bubble">🧠 Get AI-powered insight</div>
        </div>

        <section className="upload-section">
          <UploadForm onUploadComplete={handleUploadComplete} />
        </section>

        {Object.keys(fileResults).length > 0 && (
          <section className="analysis-section">
            <div className="analysis-wrapper">
              <div className="scrollable-summary-list">
                <div className="summary-card-scroll-area">
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
                </div>
                <div className="sticky-button-container">
                  <button className="clear-button" onClick={handleClear}>
                    Clear All
                  </button>
                </div>
              </div>

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

            {activeFile && (
              <div className="full-width-explanation">
                {aiLoading ? (
                  <AiLoader />
                ) : (
                  explanations[activeFile] && (
                    <div className="rag-card-group">
                      <div className="rag-card">
                        <h4>📌 Issue</h4>
                        <p>{explanations[activeFile].issue}</p>
                      </div>
                      <div className="rag-card">
                        <h4>📉 Impact</h4>
                        <p>{explanations[activeFile].impact}</p>
                      </div>
                      <div className="rag-card">
                        <h4>🛠️ Solution</h4>
                        <p>{explanations[activeFile].solution}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        <section className="section-wrapper">
          <UploadOverview
            uploadHistory={uploadHistory}
            clearHistory={clearUploadHistory}
            onUploadComplete={handleUploadComplete}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
