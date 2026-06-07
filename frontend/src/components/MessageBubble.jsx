import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SourceChunks from './SourceChunks';

const markdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold mt-3 mb-2" style={{
      background: 'var(--gradient-main)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold mt-3 mb-2" style={{
      background: 'var(--gradient-main)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }} {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold mt-2 mb-1.5" style={{
      background: 'var(--gradient-main)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }} {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-2" style={{ color: 'var(--text-primary)' }} {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" style={{ color: 'var(--text-primary)' }} {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
};

export const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl p-4 transition-all duration-200 ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
        style={isUser ? {
          background: 'var(--user-bubble)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)'
        } : {
          background: 'var(--assistant-bubble)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="text-sm leading-relaxed font-normal">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <div className="prose max-w-none">
                <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
                {message.isStreaming && !message.content && (
                  <div className="flex space-x-1 items-center py-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-purple)', animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-purple)', animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-purple)', animationDelay: '300ms' }} />
                  </div>
                )}
                {message.isStreaming && message.content && (
                  <span className="inline-block w-1.5 h-3.5 ml-1" style={{ background: 'var(--accent-purple)', animation: 'blink 1s infinite' }} />
                )}
              </div>
              {message.content && !message.isStreaming && (
                <button
                  onClick={handleCopy}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-card)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--bg-card)'}
                  title="Copy response"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" style={{ color: '#10b981' }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceChunks sources={message.sources} />
        )}
      </div>
    </div>
  );
};
export default MessageBubble;
