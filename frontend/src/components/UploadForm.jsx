import React, { useRef, useState } from "react";
import "../CSS/uploadForm.css";
import axios from "axios";
import DataSummary from "./DataSummary";

function UploadForm({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setuploadedFile] = useState(false);
  const [attemptedUpload, setattemptedUpload] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleFiles = async (selectedFiles) => {
    setErrorMessage("");
    try {
      const fileArray = Array.from(selectedFiles);
      const invalidFile = fileArray.find((file) => file.type !== "text/csv");
      if (invalidFile) {
        setErrorMessage("Only CSV files are allowed.");
        return;
      }
      setFiles(fileArray);
    } catch (error) {
      setErrorMessage(
        error.message === "Only CSV files are allowed."
          ? error.message
          : "Failed to connect to the backend or upload file."
      );
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setuploadedFile(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please upload a file.");
      setattemptedUpload(true);
      return Promise.reject("No file selected");
    }

    const formData = new FormData();
    formData.append("file", files[0]);

    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysisResult(response.data);
      onUploadComplete && onUploadComplete(files[0].name, response.data);
      console.log("Upload successful:", response.data);
      setFiles([]);
      setuploadedFile(true);
      setErrorMessage("");
      fileInputRef.current.value = null;
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Upload Area */}
      <div
        className={`uploadForm ${isDragging ? "dragging" : ""}`}
        role="button"
        tabIndex="0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleChange}
        />

        {isLoading ? (
          <div className="loadingSpinner" />
        ) : (
          <>
            {files.length === 0 ? (
              <>
                <p>Drag & drop files here or</p>
                <button className="upload-trigger-btn" onClick={handleClick}>
                  Browse Files
                </button>
              </>
            ) : (
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
                        x
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  className="uploadBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setuploadedFile(true);
                    handleUpload().catch((err) => {
                      console.log(err);
                    });
                  }}
                >
                  Upload file
                </button>
              </>
            )}
          </>
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </>
  );
}

export default UploadForm;
