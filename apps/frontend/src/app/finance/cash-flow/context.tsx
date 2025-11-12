"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface CashFlowFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  cashFlowType?: string;
  departments?: string[];
  regions?: string[];
  minAmount?: number | null;
}

type CashFlowContextValue = {
  filters: CashFlowFilters;
  setFilters: React.Dispatch<React.SetStateAction<CashFlowFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cashFlowData: any[];
  setCashFlowData: React.Dispatch<React.SetStateAction<any[]>>;
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

const CashFlowContext = React.createContext<CashFlowContextValue | undefined>(undefined);

export function useCashFlowContext(): CashFlowContextValue {
  const ctx = React.useContext(CashFlowContext);
  if (!ctx) throw new Error("useCashFlowContext must be used within CashFlowProvider");
  return ctx;
}

export function CashFlowProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  const [cashFlowData, setCashFlowData] = React.useState<any[]>([]);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your cash flow data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  const defaultFilters: CashFlowFilters = {
    dateRange: {
      startDate: "2017-01-01",
      endDate: "2021-12-31",
    },
    cashFlowType: "all",
    departments: [],
    regions: [],
    minAmount: null,
  };

  const [filters, setFilters] = React.useState<CashFlowFilters>(defaultFilters);

  // Load from localStorage only on client after mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("cashFlowFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters({ ...defaultFilters, ...parsed });
      }
    } catch {
      // Ignore errors
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("cashFlowFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return () => unsubscribe();
  }, [selectionManager]);

  const value = React.useMemo(
    () => ({
      filters, setFilters, selectedPoints, selectionManager,
      isChatOpen, setIsChatOpen, isBIModalOpen, setIsBIModalOpen,
      cashFlowData, setCashFlowData,
      chatMessages, setChatMessages, chatInput, setChatInput,
      chatIsLoading, setChatIsLoading, chatSessionId, chatUserId,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, cashFlowData,
     chatMessages, chatInput, chatIsLoading, chatSessionId, chatUserId]
  );

  return <CashFlowContext.Provider value={value}>{children}</CashFlowContext.Provider>;
}