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
    setLoading(true);
    setErrorMessage("");
    try {
      const fileArray = Array.from(selectedFiles);

      const invalidFile = fileArray.find((file) => file.type !== "text/csv");
      if (invalidFile) {
        setErrorMessage("Only CSV files are allowed.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));
      setFiles((prev) => [...prev, ...fileArray]);
    } catch (error) {
      setErrorMessage(
        error.message === "Only CSV files are allowed."
          ? error.message
          : "Failed to connect to the backend or upload file."
      );
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Upload failed:", error);
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
            {files.length === 0 || (uploadedFile && !attemptedUpload) ? (
              <>
                <p>Drag & drop files here or</p>
                <button className="upload-trigger-btn" onClick={handleClick}>
                  Browse Files
                </button>
              </>
            ) : null}

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
                    handleUpload()
                      .then(() => {
                        setFiles([]);
                        setuploadedFile(true);
                        setErrorMessage("");
                        fileInputRef.current.value = null;
                      })
                      .catch((err) => {
                        setErrorMessage("Please upload a file.");
                        console.log(err);
                      })
                      .finally(() => {
                        setLoading(false);
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
    </>
  );
}

export default UploadForm;
