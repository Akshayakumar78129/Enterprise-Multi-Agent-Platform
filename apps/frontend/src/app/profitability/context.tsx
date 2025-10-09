"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface ProfitabilityFilters {
  timePeriod: string;
  profitType: string;
  segments: string[];
  products: string[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId];
  minMargin: number;
  costCategories: string[];
}

type ProfitabilityContextValue = {
  filters: ProfitabilityFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProfitabilityFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profitabilityData: any[];
  setProfitabilityData: React.Dispatch<React.SetStateAction<any[]>>;
};

const ProfitabilityContext = React.createContext<ProfitabilityContextValue | undefined>(undefined);

export function useProfitabilityContext(): ProfitabilityContextValue {
  const ctx = React.useContext(ProfitabilityContext);
  if (!ctx) throw new Error("useProfitabilityContext must be used within ProfitabilityProvider");
  return ctx;
}

export function ProfitabilityProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your profitability data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  const [profitabilityData, setProfitabilityData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<ProfitabilityFilters>(() => {
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      profitType: "gross",
      segments: [],
      products: [],
      minMargin: 0,
      costCategories: [],
    };

    if (typeof window === "undefined") return defaultFilters;

    try {
      const saved = localStorage.getItem("profitabilityFilters");
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
      localStorage.setItem("profitabilityFilters", JSON.stringify(filters));
    } catch {}
  }, [filters,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return () => unsubscribe();
  }, [selectionManager,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  const value = React.useMemo(
    () => ({
      filters, setFilters, selectedPoints, selectionManager,
      isChatOpen, setIsChatOpen, isBIModalOpen, setIsBIModalOpen,
      profitabilityData, setProfitabilityData,
    ,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId}),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, profitabilityData]
  );

  return <ProfitabilityContext.Provider value={value}>{children}</ProfitabilityContext.Provider>;
}