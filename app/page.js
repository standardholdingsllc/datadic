'use client';

import { useState, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [file, setFile] = useState(null);
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
    if (!file) return;

    setStatus({ type: 'loading', message: 'Converting file...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Conversion failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.(xlsx|xls|csv)$/i, '_converted.csv');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({ type: 'success', message: 'File converted and downloaded successfully!' });
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

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Griffin Data Converter</h1>
        <p className="subtitle">Transform worker data files to the required format</p>

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

        <button
          className="convert-btn"
          onClick={handleConvert}
          disabled={!file || status.type === 'loading'}
        >
          {status.type === 'loading' ? 'Converting...' : 'Convert & Download CSV'}
        </button>

        {status.message && (
          <div className={`status ${status.type}`}>
            {status.message}
          </div>
        )}

        <div className="format-info">
          <h3>Supported Input Format</h3>
          <p>
            Upload files with columns: Client ID, Client Name, Worker ID, First Name, 
            Last Name, Last Name 2, Email, Phone, Passport, DOB, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
