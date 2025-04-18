import React, { useState } from "react";
import "../CSS/UploadOverview.css";

const UploadOverview = ({ uploadHistory = [], onUploadComplete, clearHistory }) => {
  const [expanded, setExpanded] = useState(true);

  const handleReanalyze = (filename) => {
    fetch(
      `http://localhost:8000/analyze-file/${filename}?category=${encodeURIComponent(
        filename
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        onUploadComplete && onUploadComplete(filename, data);
      })
      .catch((err) => console.error("Error re-analyzing file:", err));
  };

  return (
    <div>
      <div className="category-dropdowns">
        <div className="dropdown-card">
          <div className="dropdown-header" onClick={() => setExpanded(!expanded)}>
            <strong>Upload History</strong> ({uploadHistory.length})
            <span className="arrow">{expanded ? "▲" : "▼"}</span>
          </div>

          {expanded && (
            <>
              {uploadHistory.length === 0 ? (
                <p className="empty-history">No uploads yet.</p>
              ) : (
                <ul className="dropdown-list">
                  {uploadHistory.map((upload, i) => (
                    <li
                      key={i}
                      className="clickable-file"
                      onClick={() => handleReanalyze(upload.filename)}
                    >
                      <span className="upload-filename">{upload.filename}</span> —{" "}
                      <span className="upload-date">{upload.uploaded_at}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button className="clear-history-button" onClick={clearHistory}>
                Clear Upload History
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadOverview;
