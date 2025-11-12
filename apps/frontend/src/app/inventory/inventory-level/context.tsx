'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShiftClickSelectionManager, getShiftClickManager, ShiftClickPoint, Message } from 'components/index';

export interface InventorylevelFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  warehouse: string[];
  category: string[];
  status: string[];
}

interface InventorylevelContextType {
  filters: InventorylevelFilters;
  setFilters: React.Dispatch<React.SetStateAction<InventorylevelFilters>>;
  selectionManager: ShiftClickSelectionManager;
  selectedPoints: ShiftClickPoint[];
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inventoryLevelData: any;
  setInventoryLevelData: React.Dispatch<React.SetStateAction<any>>;
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

const InventorylevelContext = createContext<InventorylevelContextType | undefined>(undefined);

export function InventorylevelProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = useState<ShiftClickPoint[]>([]);
  const [selectionManager] = useState(() => getShiftClickManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [inventoryLevelData, setInventoryLevelData] = useState<any>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your inventory levels today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Default filters - always used for SSR to prevent hydration mismatch
  // Data is from 2017-2021, so use full range by default
  const defaultFilters: InventorylevelFilters = React.useMemo(() => ({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    warehouse: [],
    category: [],
    status: []
  }), []);

  const [filters, setFilters] = useState<InventorylevelFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inventoryLevelFilters');
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
    console.log('[InventorylevelContext] Filters changed:', filters);
    try {
      localStorage.setItem('inventoryLevelFilters', JSON.stringify(filters));
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
      inventoryLevelData,
      setInventoryLevelData,
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
      inventoryLevelData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return (
    <InventorylevelContext.Provider value={value}>
      {children}
    </InventorylevelContext.Provider>
  );
}

export function useInventorylevelContext() {
  const context = useContext(InventorylevelContext);
  // Allow usage outside provider (e.g., in Enterprise-IQ canvas)
  return context;
}
