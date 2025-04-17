import React, { useEffect, useState } from "react";
import "../CSS/UploadHistory.css";

const UploadHistory = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/upload-history")
      .then((res) => res.json())
      .then((data) => {
        setUploads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch upload history:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="upload-history">
      <h2>Upload History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : uploads.length === 0 ? (
        <p>No uploads found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Category</th>
              <th>Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload, index) => (
              <tr key={index}>
                <td>{upload.filename}</td>
                <td>{upload.category}</td>
                <td>{upload.uploaded_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UploadHistory;
