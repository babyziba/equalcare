import React, { useRef, useState } from "react";
import "../uploadForm.css";
import axios from "axios";
import DataSummary from "./DataSummary";

function UploadForm() {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null); 
  const fileInputRef = useRef(null);

  //  Add selected files to state
  const handleFiles = (selectedFiles) => {
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  };

  //  Trigger hidden file input on click
  const handleClick = () => {
    fileInputRef.current.click();
  };

  //  Handle files selected from input
  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  //  Handle file drop into upload box
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  //  Remove a selected file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // BACKEND CONNECTION SECTION – ONLY TOUCH IF WORKING WITH THE API
  // Sends the first uploaded file to the FastAPI backend at /upload
  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setAnalysisResult(response.data);
      console.log("Upload successful:", response.data);
    } catch (error) {
      console.error(" Upload failed:", error);
    }
  };
  // END OF BACKEND CONNECTION SECTION 

  return (
    <div
      className="uploadForm"
      role="button"
      tabIndex="0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <p>
        Drag & drop files here or{" "}
        <span className="uploadBtn">Click to Upload</span>{" "}
      </p>

      {files.length > 0 && (
        <>
          <ul className="fileList">
            {files.map((file, idx) => (
              <li key={idx}>
                {file.name}
                <button
                  className="removeBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                >
                  x{" "}
                </button>
              </li>
            ))}
          </ul>

          <button
            className="uploadBtn"
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
          >
            Upload file
          </button>
        </>
      )}

      {/* Show analysis results below the upload button */}
      <DataSummary result={analysisResult} />
    </div>
  );
}

export default UploadForm;
