"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';
import { SelectedPoint, Message } from 'components';

export interface RevenueForecastFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  companyCode: string;
  segments: string[];
  products: string[];
  regions: string[];
  customerTypes: string[];
  forecastHorizon: number;
  confidenceLevel: number;
  scenario: string;
}

interface RevenueForecastContextType {
  filters: RevenueForecastFilters;
  setFilters: React.Dispatch<React.SetStateAction<RevenueForecastFilters>>;
  selectionManager: SelectionManager;
  selectedPoints: SelectedPoint[];
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  revenueForecastData: any;
  setRevenueForecastData: React.Dispatch<React.SetStateAction<any>>;
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

const RevenueForecastContext = createContext<RevenueForecastContextType | undefined>(undefined);

export function RevenueForecastProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [revenueForecastData, setRevenueForecastData] = useState<any>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your revenue forecast today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Always start with default filters to avoid hydration mismatch
  const [filters, setFilters] = useState<RevenueForecastFilters>({
    dateRange: {
      startDate: "2017-01-01",
      endDate: "2021-12-31"
    },
    companyCode: "all",
    segments: [],
    products: [],
    regions: [],
    customerTypes: [],
    forecastHorizon: 12,
    confidenceLevel: 80.0,
    scenario: "base"
  });

  // Subscribe to selection changes
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return unsubscribe;
  }, [selectionManager]);

  const value = useMemo(() => ({
    filters,
    setFilters,
    selectionManager,
    selectedPoints,
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    revenueForecastData,
    setRevenueForecastData,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId
  }), [
    filters,
    selectionManager,
    selectedPoints,
    isChatOpen,
    isBIModalOpen,
    revenueForecastData,
    chatMessages,
    chatInput,
    chatIsLoading,
    chatSessionId,
    chatUserId
  ]);

  return (
    <RevenueForecastContext.Provider value={value}>
      {children}
    </RevenueForecastContext.Provider>
  );
}

export function useRevenueForecastContext() {
  const context = useContext(RevenueForecastContext);
  if (!context) {
    throw new Error('useRevenueForecastContext must be used within RevenueForecastProvider');
  }
  return context;
}
