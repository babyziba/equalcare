import React, { useRef, useState } from "react";
import "../CSS/uploadForm.css";
import axios from "axios";
import DataSummary from "./DataSummary";

function UploadForm({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploadedFile, setuploadedFile] = useState(false);
  const [attemptedUpload, setattemptedUpload] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  //  Add selected files to state
  const handleFiles = async (selectedFiles) => {
    setLoading(true);
    setErrorMessage(""); // Clears previous error messages
    try {
      const fileArray = Array.from(selectedFiles);

      //Validating file type
      const invalidFile = fileArray.find((file) => file.type !== "text/csv");
      if (invalidFile) {
        setErrorMessage("Only CSV files are allowed.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2500)); //Simulating a 2.5s delay for animation

      //Simulating upload or process files here
      setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
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

  //  Trigger hidden file input on click
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Resets File Input
      fileInputRef.current.click(); // Allows user to select a file
    }
  };

  //  Handle files selected from input
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

  //  Handle file drop into upload box
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  //  Remove a selected file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setuploadedFile(false);
  };

  // BACKEND CONNECTION SECTION – ONLY TOUCH IF WORKING WITH THE API
  const handleUpload = async () => {
    if (files.length === 0 || selectedCategory === "") {
      alert("Please select a category and upload a file.");
      setattemptedUpload(true);
      return Promise.reject("Missing Category");
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
          <strong>Select a medical condition: </strong>
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
        <span className="errorMessage"> {errorMessage}</span>
      </div>

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
                        //Resets some of the components
                        setFiles([]);
                        setSelectedCategory("");
                        setuploadedFile(true);
                        setErrorMessage("");
                        fileInputRef.current.value = null;
                      })
                      .catch((err) => {
                        setErrorMessage("Please select a category.");
                        console.log(err); //Err checking
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
