import React, { useRef, useState } from "react";
import "../uploadForm.css";

function UploadForm() {
  //useState to hold the list of updated files
  const [files, setFiles] = useState([]);

  //useRef to trigger the hidden file input
  const fileInputRef = useRef(null);

  // Function to add selected files to the state
  const handleFiles = (selectedFiles) => {
    //Spread current files while adding new files
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  };

  // Handle files dropped into the drop box area
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files); // Add dropped files
      e.dataTransfer.clearData(); // Clear dragged data
    }
  };

  //Trigger the hidden file input when user clicks the drop area
  const handleClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection via input
  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  //Remove file from state by index
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="uploadForm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
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
        <ul className="fileList">
          {files.map((file, idx) => (
            <li key={idx}>
              {file.name}
              <button
                className="removeBtn"
                onClick={(e) => {
                  e.stopPropagation(0);
                  removeFile(idx);
                }}
              >
                x{" "}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UploadForm;
