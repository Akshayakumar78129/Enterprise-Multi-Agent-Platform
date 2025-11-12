"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "../../customer/churn-prediction/services/SelectionManager";
import { SalesPerformanceData } from "./services/salesPerformanceService";

export interface SalesPerformanceFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  regions: string[];
  categories: string[];
}

type SalesPerformanceContextValue = {
  filters: SalesPerformanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<SalesPerformanceFilters>>;
  selectedDimension: string;
  setSelectedDimension: React.Dispatch<React.SetStateAction<string>>;
  selectedMetric: string;
  setSelectedMetric: React.Dispatch<React.SetStateAction<string>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel and context
  salesData: SalesPerformanceData | null;
  setSalesData: React.Dispatch<React.SetStateAction<SalesPerformanceData | null>>;
  // Chat state
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  chatIsLoading: boolean;
  setChatIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionId: string;
  chatUserId: string;
};

const SalesPerformanceContext = React.createContext<SalesPerformanceContextValue | undefined>(undefined);

export function useSalesPerformanceContext(): SalesPerformanceContextValue {
  const ctx = React.useContext(SalesPerformanceContext);
  if (!ctx) throw new Error("useSalesPerformanceContext must be used within SalesPerformanceProvider");
  return ctx;
}

export function SalesPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [salesData, setSalesData] = React.useState<SalesPerformanceData | null>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your sales performance data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Dimension and metric selection - always start with default to avoid hydration mismatch
  const [selectedDimension, setSelectedDimension] = React.useState<string>("category");
  const [selectedMetric, setSelectedMetric] = React.useState<string>("revenue");

  // Load from localStorage after hydration
  React.useEffect(() => {
    const savedDimension = localStorage.getItem("salesDimension");
    const savedMetric = localStorage.getItem("salesMetric");
    if (savedDimension) setSelectedDimension(savedDimension);
    if (savedMetric) setSelectedMetric(savedMetric);
  }, []);

  // Always start with default filters to avoid hydration mismatch
  const [filters, setFilters] = React.useState<SalesPerformanceFilters>({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    regions: [],
    categories: [],
  });

  // Load filters from localStorage after hydration
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("salesPerformanceFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("salesPerformanceFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  React.useEffect(() => {
    try {
      localStorage.setItem("salesDimension", selectedDimension);
    } catch {}
  }, [selectedDimension]);

  React.useEffect(() => {
    try {
      localStorage.setItem("salesMetric", selectedMetric);
    } catch {}
  }, [selectedMetric]);

  // Subscribe to selection manager
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

  // Memoize setFilters to prevent unnecessary recreations
  const memoizedSetFilters = React.useCallback(
    (newFilters: React.SetStateAction<SalesPerformanceFilters>) => {
      setFilters(newFilters);
    },
    []
  );

  // Memoize setters
  const memoizedSetSelectedDimension = React.useCallback(
    (newDimension: React.SetStateAction<string>) => {
      setSelectedDimension(newDimension);
    },
    []
  );

  const memoizedSetSelectedMetric = React.useCallback(
    (newMetric: React.SetStateAction<string>) => {
      setSelectedMetric(newMetric);
    },
    []
  );

  const value = React.useMemo(
    () => ({
      filters,
      setFilters: memoizedSetFilters,
      selectedDimension,
      setSelectedDimension: memoizedSetSelectedDimension,
      selectedMetric,
      setSelectedMetric: memoizedSetSelectedMetric,
      selectedPoints,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      salesData,
      setSalesData,
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
      memoizedSetFilters,
      selectedDimension,
      memoizedSetSelectedDimension,
      selectedMetric,
      memoizedSetSelectedMetric,
      selectedPoints,
      selectionManager,
      isChatOpen,
      isBIModalOpen,
      salesData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return <SalesPerformanceContext.Provider value={value}>{children}</SalesPerformanceContext.Provider>;
}