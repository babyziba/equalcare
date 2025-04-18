import React, { useState, useEffect } from "react";
import UploadForm from "./components/UploadForm";
import DataSummary from "./components/DataSummary";
import GraphView from "./components/GraphView";
import UploadOverview from "./components/UploadOverview";
import ExplanationBox from "./components/ExplanationBox";
import logo from "./CSS/equal_care.png";

import "./App.css";

function App() {
  const [fileResults, setFileResults] = useState({});
  const [explanations, setExplanations] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);

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
      {/* Hero Section */}
      <div className="hero-fullwrap">
        <header className="hero-section">
          <img src={logo} alt="EqualCare logo" className="hero-logo" />
          <p className="hero-badge">
            ⚖️ Gender Equity in Research Starts with Data
          </p>
        </header>
      </div>
      
      {/* Purpose & Impact Section */}
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
              <p>Inclusive datasets produce research that reflects the realities of diverse populations.</p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">💊</span>
              <h3>Informed Care</h3>
              <p>Understanding how different genders respond to treatment leads to safer, more effective therapies.</p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">⚕️</span>
              <h3>Health Equity</h3>
              <p>Balanced data is the foundation of fair, effective, and equitable healthcare for everyone.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="main-content">
        {/* Process Steps */}
        <div className="process-steps">
          <div className="step-bubble">📤 Upload a dataset</div>
          <div className="step-bubble">📊 View gender breakdown</div>
          <div className="step-bubble">🧠 Get AI-powered insight</div>
        </div>
        
        {/* Upload Section */}
        <section className="upload-section">
          <UploadForm onUploadComplete={handleUploadComplete} />
        </section>

        {/* Analysis Section - Only render if we have file results */}
        {Object.keys(fileResults).length > 0 && (
          <section className="analysis-section">
            {/* Analysis Wrapper with flex layout */}
            <div className="analysis-wrapper">
              {/* Left side - Summary List */}
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

              {/* Right side - Graph View */}
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

            {/* AI Explanation (below analysis) */}
            {activeFile && (
              <div className="full-width-explanation">
                <ExplanationBox explanation={explanations[activeFile] || ""} />
              </div>
            )}
          </section>
        )}

        {/* Upload History Section */}
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