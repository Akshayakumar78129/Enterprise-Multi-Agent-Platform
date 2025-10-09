"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface StockFilters {
  timePeriod: string;
  warehouseId: string | null;
  categories: string[];
  stockStatus: string[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId];
  minQuantity: number;
  suppliers: string[];
}

type StockContextValue = {
  filters: StockFilters;
  setFilters: React.Dispatch<React.SetStateAction<StockFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  stockData: any[];
  setStockData: React.Dispatch<React.SetStateAction<any[]>>;
};

const StockContext = React.createContext<StockContextValue | undefined>(undefined);

export function useStockContext(): StockContextValue {
  const ctx = React.useContext(StockContext);
  if (!ctx) throw new Error("useStockContext must be used within StockProvider");
  return ctx;
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your stock levels data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);


  // Data sharing for BI panel
  const [stockData, setStockData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<StockFilters>(() => {
    // Default to yearly analysis for 2021
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      warehouseId: null,
      categories: [],
      stockStatus: ["low_stock", "out_of_stock", "overstock"],
      minQuantity: 0,
      suppliers: [],
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("stockFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
      return defaultFilters;
    } catch {
      return defaultFilters;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("stockFilters", JSON.stringify(filters));
    } catch {}
  }, [filters,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  // Subscribe to selection manager
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectedPoints,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      stockData,
      setStockData,
    ,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId}),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, stockData]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}