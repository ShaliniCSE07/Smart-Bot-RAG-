import React from 'react';
import { DocProvider, useDoc } from '../context/DocContext';
import { useChat } from '../hooks/useChat';
import FileUploader from '../components/FileUploader';
import DocumentList from '../components/DocumentList';
import ChatWindow from '../components/ChatWindow';

const AppContent = () => {
  const { documents, activeDocId } = useDoc();
  const { messages, isStreaming, sendMessage, clearChat, startSummarization, suggestions, handleSuggestionClick } = useChat();

  const activeDoc = documents.find(d => d.doc_id === activeDocId);

  return (
    <div className="flex h-screen font-sans overflow-hidden antialiased" style={{
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)'
    }}>
      {/* Sidebar */}
      <aside className="w-[300px] flex flex-col h-full shrink-0" style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)'
      }}>
        {/* Header */}
        <div className="p-6 border-b flex items-center space-x-3" style={{
          borderColor: 'var(--border-subtle)'
        }}>
          <img 
            src="/favicon.svg?v=2" 
            className="w-9 h-9 object-contain" 
            alt="SmartRAG Bot Logo" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))' }} 
          />
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{
              background: 'var(--gradient-main)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              SmartRAG
            </h1>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Chat with your files</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="p-6 border-b" style={{
          borderColor: 'var(--border-subtle)'
        }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{
            color: 'var(--text-muted)',
            letterSpacing: '0.12em'
          }}>Upload Source</h2>
          <FileUploader />
        </div>

        {/* Document List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{
            color: 'var(--text-muted)',
            letterSpacing: '0.12em'
          }}>Your Documents</h2>
          <DocumentList isStreaming={isStreaming} onStartSummarization={startSummarization} />
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t text-center" style={{
          borderColor: 'var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Powered by Groq Llama-3.3 & FAISS</p>
        </div>
      </aside>

      {/* Main chat viewport */}
      <main className="flex-1 h-full relative">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
          onClearChat={clearChat}
          activeDoc={activeDoc}
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DocProvider>
      <AppContent />
    </DocProvider>
  );
}
