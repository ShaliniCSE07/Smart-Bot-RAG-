import React, { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import { useDoc } from '../context/DocContext';

export const ChatWindow = ({ messages, isStreaming, onSendMessage, onClearChat, activeDoc, suggestions = [], onSuggestionClick }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { selectedDocIds, documents } = useDoc();

  const selectedCount = selectedDocIds.size;
  const selectedDocs = documents.filter(d => selectedDocIds.has(d.doc_id));
  const tooltipText = selectedDocs.map(d => d.filename).join('\n');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || selectedCount === 0) return;
    onSendMessage(input);
    setInput('');
  };

  const handleSuggestionSelect = (question) => {
    setInput('');
    if (onSuggestionClick) {
      onSuggestionClick(question);
    }
  };

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  // Track whether user has scrolled up
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    setShowScrollBtn(!atBottom);
  }, []);

  // Auto-scroll only when near the bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Force scroll to bottom when user sends a NEW message (role === 'user')
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBtn(false);
    }
  }, [messages.length]);

  // Header display logic
  let connectionInfo;
  if (selectedCount === 0) {
    connectionInfo = (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        No documents selected
      </p>
    );
  } else if (selectedCount === 1) {
    connectionInfo = (
      <p className="text-xs truncate max-w-md" style={{ color: 'var(--text-muted)' }}>
        Connected to: <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>{selectedDocs[0].filename}</span>
      </p>
    );
  } else {
    connectionInfo = (
      <div className="flex items-center mt-0.5">
        <span className="text-xs mr-1.5" style={{ color: 'var(--text-muted)' }}>Connected to:</span>
        <span 
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-help transition-all duration-150"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: 'var(--accent-cyan)'
          }}
          title={tooltipText}
        >
          {selectedCount} documents
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Chat header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Q&A Chat</h2>
          {connectionInfo}
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-cyan)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            Clear Conversation
          </button>
        )}
      </div>

      {/* Message List and Suggestions Container */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Message List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="p-4 rounded-2xl border max-w-md" style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)'
              }}>
                <svg
                  className="w-12 h-12 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--accent-purple)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedCount > 0 ? 'Ask your first question!' : 'No document selected'}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {selectedCount > 0
                    ? `Type a question below to analyze the selected document(s). The bot will answer strictly based on the content of these files.`
                    : 'Please upload a PDF, DOCX, TXT, or XLSX file or select one or more from the list in the sidebar to start asking questions.'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setShowScrollBtn(false);
            }}
            className="absolute flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all duration-200"
            style={{
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(124,58,237,0.85)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              border: '1px solid rgba(168,85,247,0.5)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              zIndex: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            Latest message
          </button>
        )}

        {/* Suggestions - show only when not streaming and suggestions exist */}
        {!isStreaming && suggestions.length > 0 && (
          <SuggestionChips suggestions={suggestions} onSelect={handleSuggestionSelect} />
        )}
      </div>

      {/* Input panel */}
      <div className="border-t p-4" style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <form onSubmit={handleSubmit} className="flex space-x-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedCount > 0
                ? (selectedCount === 1 ? `Ask something about ${selectedDocs[0].filename}...` : `Ask something about the selected ${selectedCount} documents...`)
                : 'Select at least one document to start chatting...'
            }
            disabled={selectedCount === 0 || isStreaming}
            className="flex-1 rounded-xl px-4 py-3 text-sm transition-all duration-200"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-purple)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
          />
          <button
            type="submit"
            disabled={selectedCount === 0 || isStreaming || !input.trim()}
            className="text-white rounded-xl px-5 py-3 text-sm font-semibold shrink-0 flex items-center justify-center space-x-2 transition-all duration-150"
            style={{
              background: selectedCount === 0 || isStreaming || !input.trim() ? 'rgba(107, 114, 128, 0.4)' : 'var(--gradient-btn)',
              boxShadow: selectedCount === 0 || isStreaming || !input.trim() ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.3)',
              cursor: selectedCount === 0 || isStreaming || !input.trim() ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => selectedCount === 0 || isStreaming || !input.trim() ? null : (e.target.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)')}
            onMouseLeave={(e) => selectedCount === 0 || isStreaming || !input.trim() ? null : (e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)')}
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            ) : (
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ChatWindow;
