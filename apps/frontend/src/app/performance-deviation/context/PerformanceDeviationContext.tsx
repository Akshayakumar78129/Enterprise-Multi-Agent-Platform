"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { SelectionManager } from '../services/SelectionManager';
import { Message } from 'components';

// Define filter types
interface PerformanceFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  businessFunctions: string[];
  significanceThreshold: number;
  productCategories: string[];
}

// Define context type
interface PerformanceDeviationContextType {
  // Filters
  filters: PerformanceFilters;
  setFilters: (filters: PerformanceFilters) => void;

  // Chat and BI panel state
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isBIModalOpen: boolean;
  setIsBIModalOpen: (open: boolean) => void;

  // Selection management
  selectedPoints: any[];
  selectionManager: SelectionManager;

  // KPI selection
  selectedKPI: string;
  setSelectedKPI: (kpi: string) => void;

  // Data state
  performanceData: any[];
  setPerformanceData: (data: any[]) => void;

  // Time range for display
  timeRange: string;

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

// Create context
const PerformanceDeviationContext = createContext<PerformanceDeviationContextType | undefined>(undefined);

// Provider component
export function PerformanceDeviationProvider({ children }: { children: React.ReactNode }) {
  // Filter state
  const [filters, setFilters] = useState<PerformanceFilters>({
    dateRange: {
      startDate: "2017-01-01",
      endDate: "2021-12-31"
    },
    businessFunctions: ['sales', 'customer', 'finance'],
    significanceThreshold: 0.05,
    productCategories: []
  });

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string>("daily_revenue");

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your performance deviation data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Data state
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);

  // Selection manager
  const selectionManager = useMemo(() => {
    const manager = new SelectionManager();

    // Subscribe to selection changes
    manager.subscribe((points) => {
      setSelectedPoints(points);

      // Auto-open chat when points are selected
      if (points.length > 0 && !isChatOpen) {
        setIsChatOpen(true);
      }
    });

    return manager;
  }, [isChatOpen]);

  // Compute time range for display
  const timeRange = useMemo(() => {
    const start = new Date(filters.dateRange.startDate);
    const end = new Date(filters.dateRange.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 31) return "Last 30 Days";
    if (diffDays <= 90) return "Last 90 Days";
    if (diffDays <= 180) return "Last 180 Days";
    if (diffDays <= 365) return "Last Year";
    return `${filters.dateRange.startDate} to ${filters.dateRange.endDate}`;
  }, [filters.dateRange]);

  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    selectedKPI,
    setSelectedKPI,
    performanceData,
    setPerformanceData,
    timeRange,
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
    isChatOpen,
    isBIModalOpen,
    selectedPoints,
    selectionManager,
    selectedKPI,
    performanceData,
    timeRange,
    chatMessages,
    chatInput,
    chatIsLoading,
    chatSessionId,
    chatUserId
  ]);

  return (
    <PerformanceDeviationContext.Provider value={contextValue}>
      {children}
    </PerformanceDeviationContext.Provider>
  );
}

// Hook to use context
export function usePerformanceDeviationContext() {
  const context = useContext(PerformanceDeviationContext);

  if (context === undefined) {
    throw new Error('usePerformanceDeviationContext must be used within a PerformanceDeviationProvider');
  }

  return context;
}