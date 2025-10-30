"use client";

import React, { createContext, useContext, useState } from 'react';
import { Message, SelectedPoint, SelectionManager, getShiftClickManager } from 'components';

interface EngagementFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  engagementLevels: string[];
  loyaltyStatus: string[];
  minTransactions?: number;
  minLTVAmount?: number;
  rfmScoreMin?: number;
  rfmScoreMax?: number;
}

interface EngagementClassifierContextType {
  filters: EngagementFilters;
  setFilters: (filters: EngagementFilters) => void;
  engagementData: any[];
  setEngagementData: (data: any[]) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isBIModalOpen: boolean;
  setIsBIModalOpen: (open: boolean) => void;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  timeRange: string;
  // Chat state
  chatMessages: Message[];
  setChatMessages: (messages: Message[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatIsLoading: boolean;
  setChatIsLoading: (loading: boolean) => void;
  chatSessionId: string;
  chatUserId: string;
}

const EngagementClassifierContext = createContext<EngagementClassifierContextType | undefined>(undefined);

export function EngagementClassifierProvider({ children }: { children: React.ReactNode }) {
  // Initialize filters with localStorage persistence and migration logic
  const [filters, setFiltersState] = useState<EngagementFilters>(() => {
    const defaultFilters = {
      dateRange: {
        startDate: '2017-01-01',
        endDate: '2021-12-31'
      },
      engagementLevels: [],
      loyaltyStatus: [],
    };

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('engagement_classifier_filters');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          // Migration: Convert old startDate/endDate to new dateRange format
          if (parsed.startDate && parsed.endDate) {
            return {
              ...defaultFilters,
              ...parsed,
              dateRange: {
                startDate: parsed.startDate,
                endDate: parsed.endDate
              },
              startDate: undefined,
              endDate: undefined
            };
          }

          return { ...defaultFilters, ...parsed };
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }

    return defaultFilters;
  });

  // Persist filters to localStorage on change
  const setFilters = (newFilters: EngagementFilters) => {
    setFiltersState(newFilters);
    if (typeof window !== 'undefined') {
      localStorage.setItem('engagement_classifier_filters', JSON.stringify(newFilters));
    }
  };

  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your engagement classifier data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [selectionManager] = useState(() => getShiftClickManager());

  const timeRange = `${filters.dateRange.startDate} to ${filters.dateRange.endDate}`;

  // Subscribe to selection manager to sync selectedPoints state
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

  return (
    <EngagementClassifierContext.Provider
      value={{
        filters,
        setFilters,
        engagementData,
        setEngagementData,
        isChatOpen,
        setIsChatOpen,
        isBIModalOpen,
        setIsBIModalOpen,
        selectedPoints,
        selectionManager,
        timeRange,
        // Chat state
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        chatIsLoading,
        setChatIsLoading,
        chatSessionId,
        chatUserId,
      }}
    >
      {children}
    </EngagementClassifierContext.Provider>
  );
}

export function useEngagementClassifierContext() {
  const context = useContext(EngagementClassifierContext);
  if (context === undefined) {
    // Return a safe default when used outside the provider (e.g., in Enterprise-IQ spawned components)
    console.warn('useEngagementClassifierContext used outside EngagementClassifierProvider - using defaults');
    return {
      filters: { dateRange: { startDate: '', endDate: '' }, engagementLevels: [], loyaltyStatus: [], minTransactions: 0, minLTVAmount: 0, rfmScoreMin: 0, rfmScoreMax: 10 },
      setFilters: () => {},
      selectedPoints: [],
      selectionManager: { addPoint: () => {}, removePoint: () => {}, clearSelection: () => {}, getSelection: () => [], hasSelection: () => false, getSelectionForPrompt: () => '' },
      engagementData: [],
      setEngagementData: () => {}
    };
  }
  return context;
}