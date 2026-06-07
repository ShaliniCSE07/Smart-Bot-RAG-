import React, { useState } from 'react';

export const SourceChunks = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3" style={{
      borderColor: 'var(--border-subtle)'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 text-xs font-semibold focus:outline-none transition-colors duration-150"
        style={{
          color: 'var(--accent-cyan)'
        }}
      >
        <svg
          className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {isOpen ? 'Hide' : 'View'} sources ({sources.length} matches)
        </span>
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2 max-h-60 overflow-y-auto pr-1">
          {sources.map((source, idx) => (
            <div key={idx} className="p-3 border rounded-lg text-xs font-normal leading-relaxed" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'var(--border-subtle)',
              borderLeft: '2px solid var(--accent-purple)',
              color: 'var(--text-secondary)'
            }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold px-1.5 py-0.5 rounded" style={{
                  color: 'var(--accent-cyan)',
                  background: 'rgba(6, 182, 212, 0.1)'
                }}>
                  Source {source.index || idx + 1}
                </span>
                {source.filename && (
                  <span className="text-[10px] truncate max-w-[200px] font-semibold" style={{ color: 'var(--text-muted)' }} title={source.filename}>
                    {source.filename}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap">{source.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SourceChunks;
