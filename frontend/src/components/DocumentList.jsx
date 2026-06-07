import React, { useState } from 'react';
import { useDoc } from '../context/DocContext';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const DocumentList = ({ isStreaming, onStartSummarization }) => {
  const { 
    documents, 
    selectedDocIds, 
    toggleDocSelection, 
    selectAllDocs, 
    clearSelection, 
    deleteDocument, 
    isLoadingDocs 
  } = useDoc();
  
  const [summarizingDocId, setSummarizingDocId] = useState(null);
  const [hoveringDeleteId, setHoveringDeleteId] = useState(null);

  if (isLoadingDocs && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--accent-purple)' }}></div>
        <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 px-4 border border-dashed rounded-xl" style={{
        borderColor: 'var(--border-glow)',
        background: 'rgba(124, 58, 237, 0.03)'
      }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No documents uploaded yet</p>
      </div>
    );
  }

  const handleSummarize = async (e, docId) => {
    e.stopPropagation();
    setSummarizingDocId(docId);
    try {
      await onStartSummarization(docId);
    } finally {
      setSummarizingDocId(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Select All / Clear Row */}
      <div className="flex items-center justify-between mb-3 px-1 select-none">
        <span className="text-xs font-semibold" style={{ color: 'var(--accent-cyan)' }}>
          {selectedDocIds.size} selected
        </span>
        <div className="flex items-center space-x-3">
          {selectedDocIds.size < documents.length && (
            <button
              onClick={selectAllDocs}
              className="text-[11px] font-medium transition-colors duration-150 hover:text-[var(--accent-cyan)]"
              style={{
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
          )}
          {selectedDocIds.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-[11px] font-medium transition-colors duration-150 hover:text-[var(--accent-cyan)]"
              style={{
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Document cards list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {documents.map((doc) => {
          const isSelected = selectedDocIds.has(doc.doc_id);
          return (
            <div key={doc.doc_id} className="space-y-2">
              <div
                onClick={() => toggleDocSelection(doc.doc_id)}
                className="group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200"
                style={{
                  background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isSelected ? 'rgba(124, 58, 237, 0.5)' : 'rgba(255, 255, 255, 0.06)',
                  boxShadow: isSelected ? '0 0 0 1px rgba(124, 58, 237, 0.2)' : 'none'
                }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Custom Checkbox */}
                  <div
                    className="flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      background: isSelected ? 'linear-gradient(135deg,#7C3AED,#2563EB)' : 'transparent',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      lineHeight: '1',
                      userSelect: 'none'
                    }}
                  >
                    {isSelected && '✓'}
                  </div>

                  {/* File Icon */}
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{
                      background: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--accent-purple)'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={doc.filename}>
                      {doc.filename}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>{formatBytes(doc.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.upload_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const confirmed = window.confirm(`Delete "${doc.filename}"? This cannot be undone.`);
                    if (confirmed) {
                      deleteDocument(doc.doc_id);
                    }
                  }}
                  onMouseEnter={() => setHoveringDeleteId(doc.doc_id)}
                  onMouseLeave={() => setHoveringDeleteId(null)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 shrink-0"
                  style={{
                    color: hoveringDeleteId === doc.doc_id ? '#f87171' : 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Delete Document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Summarize button - only when exactly 1 document is selected and this is it */}
              {selectedDocIds.size === 1 && isSelected && (
                <button
                  onClick={(e) => handleSummarize(e, doc.doc_id)}
                  disabled={isStreaming || summarizingDocId === doc.doc_id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: isStreaming || summarizingDocId === doc.doc_id ? 'rgba(107, 114, 128, 0.4)' : 'var(--gradient-summarize)',
                    boxShadow: isStreaming || summarizingDocId === doc.doc_id ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.25)',
                    transform: isStreaming || summarizingDocId === doc.doc_id ? 'translateY(0)' : 'translateY(0)',
                    cursor: isStreaming || summarizingDocId === doc.doc_id ? 'not-allowed' : 'pointer',
                    opacity: isStreaming || summarizingDocId === doc.doc_id ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => !isStreaming && summarizingDocId !== doc.doc_id && (e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.35)', e.target.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => !isStreaming && summarizingDocId !== doc.doc_id && (e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.25)', e.target.style.transform = 'translateY(0)')}
                  title="Generate Summary"
                >
                  {summarizingDocId === doc.doc_id ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Summarizing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Generate Summary</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentList;
