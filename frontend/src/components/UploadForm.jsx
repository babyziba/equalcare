import React, { useRef, useState } from "react";
import "../uploadForm.css";
import axios from "axios";
import DataSummary from "./DataSummary";

function UploadForm({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
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
  const handleUpload = async () => {
    if (files.length === 0 || selectedCategory === "") {
      alert("Please select a category and upload a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("category", selectedCategory); // Optional for backend tracking

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
      onUploadComplete && onUploadComplete(selectedCategory, response.data);
      console.log("Upload successful:", response.data);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };
  // END OF BACKEND CONNECTION SECTION

  return (
    <>
      {/* Category Dropdown (outside upload box) */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="categorySelect">
          <strong>Select a medical condition:</strong>
        </label>
        <select
          id="categorySelect"
          className="categorySelect"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">-- Please choose an option --</option>
          <option value="Heart Attack">Heart Attack</option>
          <option value="Stroke">Stroke</option>
          <option value="Auto-Immune disease">Auto-Immune disease</option>
          <option value="Depression">Depression</option>
          <option value="Alzheimer’s">Alzheimer’s</option>
          <option value="Adverse drug reactions">Adverse drug reactions</option>
        </select>
      </div>

      {/* Upload Area */}
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
                    x
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
      </div>
    </>
  );
}

export default UploadForm;
