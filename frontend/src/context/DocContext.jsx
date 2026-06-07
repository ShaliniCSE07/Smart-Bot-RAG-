import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const DocContext = createContext();

export const DocProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Derive activeDocId: if exactly one doc is selected, that is activeDocId
  const activeDocId = selectedDocIds.size === 1 ? Array.from(selectedDocIds)[0] : null;

  // For backward compatibility (e.g. from FileUploader or legacy code)
  const setActiveDocId = (docId) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (docId) {
        next.add(docId);
      }
      return next;
    });
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await api.listDocs();
      const newDocs = response.data;
      
      setSelectedDocIds(prev => {
        const next = new Set(prev);
        // Find existing doc IDs before state updates
        const existingIds = new Set(documents.map(d => d.doc_id));
        const newlyAdded = newDocs.filter(d => !existingIds.has(d.doc_id));
        
        // If it's the first time and selectedDocIds is empty, select the first doc if any exist
        if (prev.size === 0 && newDocs.length > 0) {
          next.add(newDocs[0].doc_id);
        } else {
          // If other docs exist, add newly added docs to current selection
          newlyAdded.forEach(d => next.add(d.doc_id));
        }

        // Clean up any selected IDs that are no longer in newDocs (e.g., if deleted elsewhere)
        const newDocIds = new Set(newDocs.map(d => d.doc_id));
        for (const id of next) {
          if (!newDocIds.has(id)) {
            next.delete(id);
          }
        }
        
        return next;
      });

      setDocuments(newDocs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await api.deleteDoc(docId);
      setDocuments(prev => prev.filter(doc => doc.doc_id !== docId));
      setSelectedDocIds(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      return true;
    } catch (error) {
      console.error("Failed to delete document:", error);
      return false;
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const selectAllDocs = () => {
    setSelectedDocIds(new Set(documents.map(d => d.doc_id)));
  };

  const clearSelection = () => setSelectedDocIds(new Set());

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <DocContext.Provider value={{
      documents,
      setDocuments,
      activeDocId,
      setActiveDocId,
      selectedDocIds,
      toggleDocSelection,
      selectAllDocs,
      clearSelection,
      isLoadingDocs,
      fetchDocuments,
      deleteDocument
    }}>
      {children}
    </DocContext.Provider>
  );
};

export const useDoc = () => useContext(DocContext);
