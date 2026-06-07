import axios from 'axios';

// Relative URLs — all requests go through the Vite dev-server proxy to FastAPI.
export const API_BASE_URL = '';

const client = axios.create({ baseURL: API_BASE_URL });

export const api = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/upload', formData, { onUploadProgress });
  },
  listDocs:  ()      => client.get('/documents'),
  deleteDoc: (docId) => client.delete(`/documents/${docId}`),
};

/**
 * Stream a document summary via SSE from POST /api/summarize.
 * Matches the exact SSE format used by /chat.
 *
 * @param {string}   docId    - document ID to summarise
 * @param {Function} onToken  - called with each streamed token string
 * @param {Function} onDone   - called when stream finishes cleanly
 * @param {Function} onError  - called with an error message string
 */
export async function summarizeDoc(docId, onToken, onDone, onError) {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      onError(err.detail || `Server error ${response.status}`);
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop(); // keep incomplete trailing event

      for (const event of events) {
        const trimmed = event.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6).trim(); // strip "data: "
        if (data === '[DONE]') { onDone(); return; }

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'token') onToken(parsed.token);
          if (parsed.type === 'error') onError(parsed.content);
        } catch { /* ignore malformed frames */ }
      }
    }
    onDone();
  } catch (err) {
    onError(err.message || 'Network error');
  }
}

/**
 * Stream a chat response via SSE from POST /chat.
 *
 * @param {Array<string>} docIds      - array of document IDs to query
 * @param {string}        question    - user query
 * @param {Array<object>} history     - chat history array
 * @param {Function}      onToken     - called with each streamed token string
 * @param {Function}      onSources   - called with list of retrieved source chunks
 * @param {Function}      onSuggestions - called with list of follow-up suggestion strings
 * @param {Function}      onDone      - called when streaming is done
 * @param {Function}      onError     - called with an error message string
 */
export async function streamChat(
  docIds,
  question,
  history,
  onToken,
  onSources,
  onSuggestions,
  onDone,
  onError
) {
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doc_ids: docIds,
        question: question,
        history: history,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      onError(err.detail || `Server error ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');

      // Keep the last (possibly incomplete) part for the next iteration
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const dataStr = trimmed.slice(5).trim(); // Skip 'data:'
        if (dataStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'sources') {
            onSources(parsed.sources);
          } else if (parsed.type === 'token') {
            onToken(parsed.token);
          } else if (parsed.type === 'suggestions') {
            onSuggestions(parsed.suggestions || []);
          } else if (parsed.type === 'error') {
            onError(parsed.content);
          }
        } catch (e) {
          console.error("Error parsing stream chunk:", e, dataStr);
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err.message || 'Network error');
  }
}
