"use client";

import React, { createContext, useContext, useState } from 'react';
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

interface TransactionPatternsContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  patternData: any;
  setPatternData: (data: any) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isBIModalOpen: boolean;
  setIsBIModalOpen: (open: boolean) => void;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
}

const TransactionPatternsContext = createContext<TransactionPatternsContextType | undefined>(undefined);

export function TransactionPatternsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId] = useState<Record<string, any>>({
    dateRange: {
      startDate: "2017-01-01",
      endDate: "2021-12-31",
    },
    paymentMethods: [],
    segments: [],
    productCategories: []
  });
  const [patternData, setPatternData] = useState<any>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your transaction patterns data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  // Subscribe to selection manager updates
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return unsubscribe;
  }, [selectionManager,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  return (
    <TransactionPatternsContext.Provider
      value={{
        filters,
        setFilters,
        patternData,
        setPatternData,
        isChatOpen,
        setIsChatOpen,
        isBIModalOpen,
        setIsBIModalOpen,
        selectedPoints,
        selectionManager
      }}
    >
      {children}
    </TransactionPatternsContext.Provider>
  );
}

export function useTransactionPatternsContext() {
  const context = useContext(TransactionPatternsContext);
  if (context === undefined) {
    throw new Error('useTransactionPatternsContext must be used within a TransactionPatternsProvider');
  }
  return context;
}