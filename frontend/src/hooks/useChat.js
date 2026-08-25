import { useState } from 'react';
import { useDoc } from '../context/DocContext';
import { summarizeDoc, streamChat } from '../services/api';

export const useChat = () => {
  const { selectedDocIds } = useDoc();
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const sendMessage = async (question) => {
    if (selectedDocIds.size === 0 || !question.trim()) return;

    // Clear suggestions when sending new message
    setSuggestions([]);

    // Add user message
    const userMsg = { role: 'user', content: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Setup assistant message skeleton
    const assistantMsgIndex = updatedMessages.length;
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', sources: [], isStreaming: true }
    ]);
    setIsStreaming(true);

    try {
      // Build history for the backend (excluding the latest question)
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const docIdsArray = Array.from(selectedDocIds);

      await streamChat(
        docIdsArray,
        question,
        history,
        (token) => {
          // On token
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].content += token;
            }
            return copy;
          });
        },
        (sources) => {
          // On sources
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].sources = sources;
            }
            return copy;
          });
        },
        (suggs) => {
          // On suggestions
          console.log('[CHAT] Received suggestions:', suggs);
          setSuggestions(suggs || []);
        },
        () => {
          // On done - also stop streaming here so suggestions render immediately
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].isStreaming = false;
            }
            return copy;
          });
          setIsStreaming(false);
        },
        (errMsg) => {
          // On error
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].content = `Error: ${errMsg}`;
              copy[assistantMsgIndex].isStreaming = false;
            }
            return copy;
          });
        }
      );
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const copy = [...prev];
        if (copy[assistantMsgIndex]) {
          copy[assistantMsgIndex].content = `Error: Failed to fetch response. Make sure the backend server is running and GROQ_API_KEY is configured.`;
          copy[assistantMsgIndex].isStreaming = false;
        }
        return copy;
      });
    } finally {
      // Ensure streaming is stopped even if onDone wasn't called
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (question) => {
    // Directly submit the suggested question
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const startSummarization = async (docId) => {
    if (!docId) return;

    // Clear suggestions when starting summarization
    setSuggestions([]);

    // Add user message
    const userMsg = { role: 'user', content: 'Summarize this document' };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Setup assistant message skeleton
    const assistantMsgIndex = updatedMessages.length;
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', sources: [], isStreaming: true }
    ]);
    setIsStreaming(true);

    try {
      await summarizeDoc(
        docId,
        (token) => {
          // On each token
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].content += token;
            }
            return copy;
          });
        },
        () => {
          // On done
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].isStreaming = false;
            }
            return copy;
          });
        },
        (errMsg) => {
          // On error
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMsgIndex]) {
              copy[assistantMsgIndex].content = `Error: ${errMsg}`;
              copy[assistantMsgIndex].isStreaming = false;
            }
            return copy;
          });
        }
      );
    } catch (error) {
      console.error('Summarization error:', error);
      setMessages(prev => {
        const copy = [...prev];
        if (copy[assistantMsgIndex]) {
          copy[assistantMsgIndex].content = `Error: Failed to summarize. Make sure the backend is running.`;
          copy[assistantMsgIndex].isStreaming = false;
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    messages,
    isStreaming,
    sendMessage,
    clearChat,
    startSummarization,
    suggestions,
    handleSuggestionClick
  };
};
