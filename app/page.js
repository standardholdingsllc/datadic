'use client';

import { useState, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [pastedData, setPastedData] = useState('');
  const [inputMode, setInputMode] = useState('paste'); // 'paste' or 'file'
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setStatus({ type: 'error', message: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)' });
      return;
    }
    
    setFile(selectedFile);
    setStatus({ type: '', message: '' });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConvert = async () => {
    if (inputMode === 'file' && !file) return;
    if (inputMode === 'paste' && !pastedData.trim()) return;

    setStatus({ type: 'loading', message: 'Converting...' });

    try {
      let response;
      
      if (inputMode === 'paste') {
        response = await fetch('/api/convert-paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: pastedData }),
        });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = inputMode === 'paste' 
        ? `ncga_converted_${timestamp}.csv`
        : file.name.replace(/\.(xlsx|xls|csv)$/i, '_converted.csv');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({ type: 'success', message: 'Data converted and downloaded successfully!' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus({ type: '', message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearPastedData = () => {
    setPastedData('');
    setStatus({ type: '', message: '' });
  };

  const canConvert = inputMode === 'paste' 
    ? pastedData.trim().length > 0 
    : file !== null;

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">NCGA Data Converter</h1>
        <p className="subtitle">Transform worker data to the required format</p>

        <div className="mode-toggle">
          <button 
            className={`mode-btn ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            Paste Data
          </button>
          <button 
            className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => setInputMode('file')}
          >
            Upload File
          </button>
        </div>

        {inputMode === 'paste' ? (
          <div className="paste-section">
            <div className="paste-header">
              <label className="paste-label">Paste tab-separated data below:</label>
              {pastedData && (
                <button className="clear-btn" onClick={clearPastedData}>Clear</button>
              )}
            </div>
            <textarea
              className="paste-textarea"
              placeholder="Paste your data here (with or without headers)...&#10;&#10;Example:&#10;10019	CARROLL E.	3/20/26	MTY	12/10/26	718179	Abel	Castillo	Rodriguez	MICH	443 684 8962	443 301 9115	email@example.com	N06597234	5/8/76	Crossed 3/25	Yes	133"
              value={pastedData}
              onChange={(e) => {
                setPastedData(e.target.value);
                setStatus({ type: '', message: '' });
              }}
              rows={10}
            />
            <p className="paste-hint">
              Columns: Client ID, Client Name, Process Date, Consulate, End Date, Worker ID, 
              First Name, Last Name, Last Name 2, State, Phone, Phone2, Email, Passport, DOB, 
              Status In, Needs Y-E, Recr. ID
            </p>
          </div>
        ) : (
          <>
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                Drag & drop your file here, or <strong>browse</strong>
              </p>
              <p className="upload-text" style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#888' }}>
                Supports CSV, XLSX, XLS
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            {file && (
              <div className="file-info">
                <span className="file-name">📄 {file.name}</span>
                <button className="clear-btn" onClick={clearFile}>✕</button>
              </div>
            )}
          </>
        )}

        <button
          className="convert-btn"
          onClick={handleConvert}
          disabled={!canConvert || status.type === 'loading'}
        >
          {status.type === 'loading' ? 'Converting...' : 'Convert & Download CSV'}
        </button>

        {status.message && (
          <div className={`status ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
