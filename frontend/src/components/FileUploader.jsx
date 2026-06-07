import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api';
import { useDoc } from '../context/DocContext';

export const FileUploader = () => {
  const { fetchDocuments, setActiveDocId } = useDoc();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsUploading(true);
    setErrorMsg('');
    setUploadProgress(0);

    try {
      const response = await api.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      // Update state
      await fetchDocuments();
      if (response.data && response.data.doc_id) {
        setActiveDocId(response.data.doc_id);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to upload document. Make sure files are not empty and have valid contents.';
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  }, [fetchDocuments, setActiveDocId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
        style={{
          background: isDragActive ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-card)',
          border: `1.5px dashed ${isDragActive ? 'var(--accent-cyan)' : 'var(--border-glow)'}`,
          boxShadow: isDragActive ? '0 0 20px rgba(6, 182, 212, 0.1)' : 'none'
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg
            className="w-9 h-9 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: isDragActive ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {isDragActive ? 'Drop your file here' : 'Drag & drop your document'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Supports PDF, DOCX, TXT, XLSX
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>Uploading document...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-card)' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${uploadProgress}%`,
                background: 'var(--gradient-btn)'
              }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-3 border border-rose-500/40 text-rose-400 text-xs rounded-lg font-medium" style={{
          background: 'rgba(244, 63, 94, 0.1)'
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};
export default FileUploader;
