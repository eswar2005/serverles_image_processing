
import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [processedUrl, setProcessedUrl] = useState('');
  const [processType, setProcessType] = useState('grayscale');

  const API_BASE = 'https://derol3buhl.execute-api.us-east-1.amazonaws.com/dev';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProcessedUrl(''); // clear previous result
  };

  const handleProcessTypeChange = (e) => {
    setProcessType(e.target.value);
  };

  // Utility to check if file exists on S3
  const checkIfFileExists = async (url) => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  // Wait for file to be ready on S3
  const waitForFile = async (url, retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      const exists = await checkIfFileExists(url);
      if (exists) return true;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  };

  const uploadFile = async () => {
    if (!file) return alert('Please select a file.');

    try {
      // Step 1: Get presigned URL
      const res = await fetch(`${API_BASE}/GeneratePresignedUrl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const result = await res.json();
      const url = result.uploadURL;
      const key = file.name;

      // Step 2: Upload file to S3
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      alert('Upload complete. Now triggering processing...');

      // Step 3: Start Step Function with processing type
      await fetch(`${API_BASE}/start-step-function`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'image-processing-bucket-eswar',
          key: key,
          processType: processType,
        }),
      });

      alert('Processing started. Waiting for processed image...');

      const processedKey = `processed/${processType}_${file.name}`;
      const processedUrl = `https://image-processing-bucket-eswar.s3.amazonaws.com/${processedKey}`;

      const isReady = await waitForFile(processedUrl);
      if (isReady) {
        setProcessedUrl(processedUrl);
        alert('Processed image is ready!');
      } else {
        alert('Still processing... please try again in a few seconds.');
      }
    } catch (err) {
      console.error('Error during upload or processing:', err);
      alert('An error occurred. Please check the console.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📤 Upload and Process Image</h2>

      <input type="file" onChange={handleFileChange} />
      <br /><br />

      <label>Select Processing Type:</label>
      <select value={processType} onChange={handleProcessTypeChange}>
        <option value="grayscale">Grayscale</option>
        <option value="resize">Resize</option>
        <option value="rotate">Rotate</option>
        <option value="invert">Invert Colors</option>
        <option value="thumbnail">Thumbnail</option>
      </select>
      <br /><br />

      <button onClick={uploadFile}>Upload & Start Processing</button>
      <br /><br />

      {processedUrl && (
        <a href={processedUrl} download target="_blank" rel="noopener noreferrer">
          ⬇ Download Processed Image
        </a>
      )}
    </div>
  );
}

export default App;
