import React, { useEffect, useState } from "react";
import "../CSS/UploadOverview.css";

const UploadOverview = ({ onUploadComplete }) => {
  const [uploads, setUploads] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/upload-history")
      .then((res) => res.json())
      .then((data) => setUploads(data))
      .catch((err) => console.error("Failed to fetch upload history", err));
  }, []);

  const handleReanalyze = (filename) => {
    fetch(`http://localhost:8000/analyze-file/${filename}?category=`)
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
            <strong>Upload History</strong> ({uploads.length})
            <span className="arrow">{expanded ? "▲" : "▼"}</span>
          </div>
          {expanded && (
            <ul className="dropdown-list">
              {uploads.map((upload, i) => (
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
        </div>
      </div>
    </div>
  );
};

export default UploadOverview;
