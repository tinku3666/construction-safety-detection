import React, { useState } from "react";
import axios from "axios";
import { FiUploadCloud } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import "./App.css";

function App() {
  const [logs, setLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false); // New state to track webcam status

  const log = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      log(`📂 Selected file: ${file.name}`);
      setErrorMessage("");
      setImagePreview(URL.createObjectURL(file));
      setSelectedFile(file);
    } else {
      setLogs([]);
      setErrorMessage("❌ No file selected!");
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("❌ Please select an image first.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    log("⏳ Uploading image...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      if (response.data.logs && Array.isArray(response.data.logs)) {
        response.data.logs.forEach((line) => log(line));
      } else {
        log("✅ Upload successful.");
      }

      if (response.data.error) {
        setErrorMessage(response.data.error);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      log(`❌ Error uploading image: ${errMsg}`);
      setErrorMessage("❌ Failed to process the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      setUserEmail(email);
      log(`✅ Logged in as ${email}`);

      axios
        .post("http://localhost:5000/set-receiver-email", { email })
        .then((res) => log(`📩 Receiver email set to ${email}`))
        .catch((err) => log(`❌ Error setting email: ${err.message}`));
    } catch (error) {
      log(`❌ JWT Decode Error: ${error.message}`);
    }
  };

  const handleLoginError = () => {
    log("❌ Google login failed");
  };

  const handleRunWebcam = async () => {
    log("📹 Starting webcam...");
    try {
      const res = await axios.post("http://localhost:5000/start-webcam");
      if (res.data.logs) {
        res.data.logs.forEach((line) => log(line));
      } else {
        log("✅ Webcam detection started.");
      }
      setWebcamActive(true); // Set webcam to active when starting
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log(`❌ Error starting webcam: ${msg}`);
      setErrorMessage("❌ Failed to start webcam.");
    }
  };

  const handleStopWebcam = async () => {
    log("🛑 Stopping webcam...");
    try {
      const res = await axios.post("http://localhost:5000/stop-webcam");
      if (res.data.logs) {
        res.data.logs.forEach((line) => log(line));
      } else {
        log("✅ Webcam stopped.");
      }
      setWebcamActive(false); // Set webcam to inactive when stopping
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log(`❌ Error stopping webcam: ${msg}`);
      setErrorMessage("❌ Failed to stop webcam.");
    }
  };

  return (
    <div
      className="container"
      style={{
        backgroundColor: "black",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        color: "white",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div className="overlay" style={{ width: "100%", maxWidth: "800px" }}>
        {!userEmail ? (
          <>
            <h1 className="title">Welcome to Construction Safety Detector</h1>
            <p>Please sign in to continue</p>
            <div className="login-container" style={{ marginTop: "20px" }}>
              <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} useOneTap />
            </div>
          </>
        ) : (
          <>
            <h1 className="title">Construction Site Safety Detector</h1>
            <p className="subtitle">Upload an image to detect Personal Protective Equipment (PPE)</p>
            <label className="upload-label">
              <FiUploadCloud size={32} />
              <span>Click to Upload Image</span>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>

            {imagePreview && (
              <div className="image-preview">
                <h2>Selected Image</h2>
                <img
                  src={imagePreview}
                  alt="Selected"
                  style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "10px" }}
                />
              </div>
            )}

            <div
              className="button-group"
              style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}
            >
              <button
                onClick={handleImageUpload}
                className="upload-btn"
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                {loading ? <AiOutlineLoading3Quarters className="spinner" /> : "Upload & Detect"}
              </button>

              <button
                onClick={handleRunWebcam}
                className="webcam-btn"
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Run Webcam Detection
              </button>

              <button
                onClick={handleStopWebcam}
                className="webcam-btn"
                style={{
                  padding: "12px 20px",
                  backgroundColor: "crimson",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Stop Webcam Detection
              </button>
            </div>

            {/* New webcam feed container - shows when webcam is active */}
            {webcamActive && (
              <div className="webcam-feed-container" style={{ marginTop: "30px" }}>
                <h2>Live Webcam Detection</h2>
                <div style={{ border: "2px solid #444", borderRadius: "10px", overflow: "hidden" }}>
                  <img
                    src="http://localhost:5000/video_feed"
                    alt="YOLO Webcam Feed"
                    style={{
                      width: "100%",
                      maxWidth: "640px",
                      display: "block",
                      margin: "0 auto"
                    }}
                  />
                </div>
              </div>
            )}

            {loading && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${uploadProgress}%`,
                    height: "10px",
                    backgroundColor: "limegreen",
                    borderRadius: "10px",
                    marginTop: "10px",
                    transition: "width 0.4s ease",
                  }}
                ></div>
              </div>
            )}

            <div className="log-container" style={{ marginTop: "30px" }}>
              <h2>Process Logs</h2>
              <pre className="log-box">{logs.length ? logs.join("\n") : "No logs yet..."}</pre>
              {errorMessage && <p className="error">❌ {errorMessage}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
