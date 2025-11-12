'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShiftClickSelectionManager, getShiftClickManager, ShiftClickPoint, Message } from 'components/index';

export interface SlowMovingStockFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  category: string[];
  turnoverThreshold: number;
}

interface SlowMovingStockContextType {
  filters: SlowMovingStockFilters;
  setFilters: React.Dispatch<React.SetStateAction<SlowMovingStockFilters>>;
  selectionManager: ShiftClickSelectionManager;
  selectedPoints: ShiftClickPoint[];
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  slowMovingStockData: any;
  setSlowMovingStockData: React.Dispatch<React.SetStateAction<any>>;
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

const SlowMovingStockContext = createContext<SlowMovingStockContextType | undefined>(undefined);

export function SlowMovingStockProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = useState<ShiftClickPoint[]>([]);
  const [selectionManager] = useState(() => getShiftClickManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [slowMovingStockData, setSlowMovingStockData] = useState<any>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze slow moving stock today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Default filters - Data is from 2017-2021, so use full range by default
  const defaultFilters: SlowMovingStockFilters = React.useMemo(() => ({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    category: [],
    turnoverThreshold: 30.0  // Default: items with < 30 turns per year
  }), []);

  const [filters, setFilters] = useState<SlowMovingStockFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('slowMovingStockFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate threshold - must be at least 5 to see meaningful data
        if (parsed.turnoverThreshold < 5) {
          parsed.turnoverThreshold = 30.0;
        }
        setFilters(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    console.log('[SlowMovingStockContext] Filters changed:', filters);
    try {
      localStorage.setItem('slowMovingStockFilters', JSON.stringify(filters));
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
      slowMovingStockData,
      setSlowMovingStockData,
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
      slowMovingStockData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return (
    <SlowMovingStockContext.Provider value={value}>
      {children}
    </SlowMovingStockContext.Provider>
  );
}

export function useSlowMovingStockContext() {
  const context = useContext(SlowMovingStockContext);
  return context;
}
