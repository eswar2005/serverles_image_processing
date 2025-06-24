
// import React, { useState } from 'react';
// import './App.css';

// function App() {
//   const [file, setFile] = useState(null);
//   const [processedUrl, setProcessedUrl] = useState('');
//   const [processType, setProcessType] = useState('grayscale');

//   const API_BASE = 'https://derol3buhl.execute-api.us-east-1.amazonaws.com/dev';

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setProcessedUrl(''); // clear previous result
//   };

//   const handleProcessTypeChange = (e) => {
//     setProcessType(e.target.value);
//   };

//   // Utility to check if file exists on S3
//   const checkIfFileExists = async (url) => {
//     try {
//       const res = await fetch(url, { method: 'HEAD' });
//       return res.ok;
//     } catch (err) {
//       return false;
//     }
//   };

//   // Wait for file to be ready on S3
//   const waitForFile = async (url, retries = 5, delay = 2000) => {
//     for (let i = 0; i < retries; i++) {
//       const exists = await checkIfFileExists(url);
//       if (exists) return true;
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//     return false;
//   };

//   const uploadFile = async () => {
//     if (!file) return alert('Please select a file.');

//     try {
//       // Step 1: Get presigned URL
//       const res = await fetch(`${API_BASE}/GeneratePresignedUrl`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           filename: file.name,
//           contentType: file.type,
//         }),
//       });

//       const result = await res.json();
//       const url = result.uploadURL;
//       const key = file.name;

//       // Step 2: Upload file to S3
//       await fetch(url, {
//         method: 'PUT',
//         headers: { 'Content-Type': file.type },
//         body: file,
//       });

//       alert('Upload complete. Now triggering processing...');

//       // Step 3: Start Step Function with processing type
//       await fetch(`${API_BASE}/start-step-function`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           bucket: 'image-processing-bucket-eswar',
//           key: key,
//           processType: processType,
//         }),
//       });

//       alert('Processing started. Waiting for processed image...');

//       const processedKey = `processed/${processType}_${file.name}`;
//       const processedUrl = `https://image-processing-bucket-eswar.s3.amazonaws.com/${processedKey}`;

//       const isReady = await waitForFile(processedUrl);
//       if (isReady) {
//         setProcessedUrl(processedUrl);
//         alert('Processed image is ready!');
//       } else {
//         alert('Still processing... please try again in a few seconds.');
//       }
//     } catch (err) {
//       console.error('Error during upload or processing:', err);
//       alert('An error occurred. Please check the console.');
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>📤 Upload and Process Image</h2>

//       <input type="file" onChange={handleFileChange} />
//       <br /><br />

//       <label>Select Processing Type:</label>
//       <select value={processType} onChange={handleProcessTypeChange}>
//         <option value="grayscale">Grayscale</option>
//         <option value="resize">Resize</option>
//         <option value="rotate">Rotate</option>
//         <option value="invert">Invert Colors</option>
//         <option value="thumbnail">Thumbnail</option>
//       </select>
//       <br /><br />

//       <button onClick={uploadFile}>Upload & Start Processing</button>
//       <br /><br />

//       {processedUrl && (
//         <a href={processedUrl} download target="_blank" rel="noopener noreferrer">
//           ⬇ Download Processed Image
//         </a>
//       )}
//     </div>
//   );
// }

// export default App;

import React, { useState } from 'react';
import { Upload, Image, Download, Sparkles, Zap, RotateCw, Palette, Crop } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [processedUrl, setProcessedUrl] = useState('');
  const [processType, setProcessType] = useState('grayscale');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const API_BASE = 'https://derol3buhl.execute-api.us-east-1.amazonaws.com/dev';

  const processOptions = [
    { value: 'grayscale', label: 'Grayscale', icon: Palette, color: 'grayscale', description: 'Convert to black & white' },
    { value: 'resize', label: 'Resize', icon: Crop, color: 'resize', description: 'Smart resize optimization' },
    { value: 'rotate', label: 'Rotate', icon: RotateCw, color: 'rotate', description: 'Auto-rotate correction' },
    { value: 'invert', label: 'Invert Colors', icon: Sparkles, color: 'invert', description: 'Invert all colors' },
    { value: 'thumbnail', label: 'Thumbnail', icon: Image, color: 'thumbnail', description: 'Create compact thumbnail' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setProcessedUrl(''); // Clear previous result
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcessTypeChange = (type) => {
    setProcessType(type);
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
    if (!file) {
      alert('Please select an image file first! 📸');
      return;
    }

    setIsUploading(true);

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

      // Step 3: Start Step Function with processing type
      await fetch(`${API_BASE}/start-step-function`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bucket: 'image-processing-bucket-eswar',
          key: key,
          processType: processType
        }),
      });
      
      // Step 4: Wait for processed file to be ready
      const processedKey = `processed/${processType}_${file.name}`;
      const processedUrl = `https://image-processing-bucket-eswar.s3.amazonaws.com/${processedKey}`;
      
      const isReady = await waitForFile(processedUrl);
      if (isReady) {
        setProcessedUrl(processedUrl);
      } else {
        alert('Processing is taking longer than expected. Please try downloading in a few seconds.');
        // Still set the URL so user can try later
        setProcessedUrl(processedUrl);
      }
      
    } catch (err) {
      console.error('Error during upload or processing:', err);
      alert('Oops! Something went wrong. Please try again. 🔧');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedOption = processOptions.find(opt => opt.value === processType);

  return (
    <div className="app-container">
      <div className="app-content">
        {/* Header */}
        <div className="app-header">
          <div className="icon-container">
            <Zap size={32} className="header-icon" />
          </div>
          <h1 className="app-title">AI Image Processor</h1>
          <p className="app-subtitle">Transform your images with advanced processing algorithms</p>
        </div>

        <div className="main-grid">
          {/* Upload Section */}
          <div className="glass-card">
            <h2 className="card-title">
              <Upload size={20} />
              Upload Image
            </h2>
            
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-label">
                <Upload size={32} className="upload-icon" />
                <span className="upload-text">
                  {file ? file.name : 'Click to select an image'}
                </span>
              </label>

              {preview && (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <div className="ready-badge">Ready ✓</div>
                </div>
              )}
            </div>
          </div>

          {/* Processing Options */}
          <div className="glass-card">
            <h2 className="card-title">
              <Sparkles size={20} />
              Choose Processing Type
            </h2>
            
            <div className="options-container">
              {processOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = processType === option.value;
                
                return (
                  <div
                    key={option.value}
                    onClick={() => handleProcessTypeChange(option.value)}
                    className={`option-card ${isSelected ? 'option-selected' : ''}`}
                  >
                    <div className="option-content">
                      <div className={`option-icon ${option.color}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="option-text">
                        <h3 className="option-title">{option.label}</h3>
                        <p className="option-description">{option.description}</p>
                      </div>
                      {isSelected && <div className="selected-dot"></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="button-container">
          <button
            onClick={uploadFile}
            disabled={!file || isUploading}
            className={`main-button ${(!file || isUploading) ? 'disabled' : ''}`}
          >
            {isUploading ? (
              <>
                <div className="spinner"></div>
                Processing Magic...
              </>
            ) : (
              <>
                <Zap size={20} />
                Process Image
              </>
            )}
          </button>
        </div>

        {/* Selected Processing Info */}
        {selectedOption && (
          <div className="selected-info">
            <div className="selected-badge">
              <selectedOption.icon size={16} />
              <span>Selected: <strong>{selectedOption.label}</strong></span>
            </div>
          </div>
        )}

        {/* Download Section */}
        {processedUrl && (
          <div className="download-section">
            <div className="download-card">
              <div className="download-icon">
                <Download size={24} />
              </div>
              <h3 className="download-title">Processing Complete! 🎉</h3>
              <p className="download-subtitle">Your processed image is ready for download</p>
              <a
                href={processedUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="download-button"
              >
                <Download size={20} />
                Download Processed Image
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="app-footer">
          <p className="footer-text">
            Powered by AWS Cloud Infrastructure & Modern AI Processing
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;