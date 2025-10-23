"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';
import { SelectedPoint, Message } from 'components';

export interface ARAgingFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerType: string;
  region: string;
  segment: string;
}

interface ARAgingContextType {
  filters: ARAgingFilters;
  setFilters: React.Dispatch<React.SetStateAction<ARAgingFilters>>;
  selectionManager: SelectionManager;
  selectedPoints: SelectedPoint[];
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  arAgingData: any;
  setArAgingData: React.Dispatch<React.SetStateAction<any>>;
  // Chat state
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  chatIsLoading: boolean;
  setChatIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionId: string;
  chatUserId: string;
}

const ARAgingContext = createContext<ARAgingContextType | undefined>(undefined);

export function ARAgingProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [arAgingData, setArAgingData] = useState<any>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your accounts receivable aging data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Always start with default filters to avoid hydration mismatch
  const [filters, setFilters] = useState<ARAgingFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    customerType: 'all',
    region: 'all',
    segment: 'all'
  });

  // Load filters from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arAgingFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('arAgingFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // Subscribe to selection manager
  useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectionManager,
      selectedPoints,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      arAgingData,
      setArAgingData,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId,
    }),
    [
      filters,
      selectionManager,
      selectedPoints,
      isChatOpen,
      isBIModalOpen,
      arAgingData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return (
    <ARAgingContext.Provider value={value}>
      {children}
    </ARAgingContext.Provider>
  );
}

export function useARAgingContext() {
  const context = useContext(ARAgingContext);
  // Allow usage outside provider (e.g., in Enterprise-IQ canvas)
  // Components should handle undefined context gracefully
  return context;
}
