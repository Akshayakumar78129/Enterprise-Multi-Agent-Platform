"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

class SelectionManager {
  private listeners: ((points: any[]) => void)[] = [];
  private selectedPoints: any[] = [];

  subscribe(listener: (points: any[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  addPoint(point: any, useNativeEvent: boolean = false) {
    const newPoints = [...this.selectedPoints, point];
    this.setSelection(newPoints);
  }

  setSelection(points: any[]) {
    this.selectedPoints = points;
    this.listeners.forEach((listener) => listener(points));
  }

  clearAll() {
    this.setSelection([]);
  }

  getSelection() {
    return this.selectedPoints;
  }
}

interface PurchaseFrequencyContextType {
  filters: any;
  setFilters: (filters: any) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isBIModalOpen: boolean;
  setIsBIModalOpen: (open: boolean) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  chatMessages: any[];
  setChatMessages: (messages: any[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatIsLoading: boolean;
  setChatIsLoading: (loading: boolean) => void;
  chatSessionId: string;
  chatUserId: string;
  purchaseFrequencyData: any;
  setPurchaseFrequencyData: (data: any) => void;
  insights: any[];
  setInsights: (insights: any[]) => void;
  kpiMetrics: any;
  setKpiMetrics: (metrics: any) => void;
}

const PurchaseFrequencyContext = createContext<PurchaseFrequencyContextType | undefined>(undefined);

export function PurchaseFrequencyProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<any>({
    dateRange: {
      startDate: '2017-01-01',
      endDate: '2021-12-31',
    },
    customerSegments: [],
    productCategories: [],
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you analyze your purchase frequency data today?"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [purchaseFrequencyData, setPurchaseFrequencyData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<any>({});

  const selectionManager = useMemo(() => {
    const manager = new SelectionManager();
    manager.subscribe((points) => setSelectedPoints(points));
    return manager;
  }, []);

  const chatSessionId = useMemo(() => `purchase-freq-${Date.now()}`, []);
  const chatUserId = useMemo(() => `user-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <PurchaseFrequencyContext.Provider
      value={{
        filters,
        setFilters,
        isChatOpen,
        setIsChatOpen,
        isBIModalOpen,
        setIsBIModalOpen,
        selectedPoints,
        selectionManager,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        chatIsLoading,
        setChatIsLoading,
        chatSessionId,
        chatUserId,
        purchaseFrequencyData,
        setPurchaseFrequencyData,
        insights,
        setInsights,
        kpiMetrics,
        setKpiMetrics,
      }}
    >
      {children}
    </PurchaseFrequencyContext.Provider>
  );
}

export function usePurchaseFrequencyContext() {
  const context = useContext(PurchaseFrequencyContext);
  if (context === undefined) {
    throw new Error('usePurchaseFrequencyContext must be used within a PurchaseFrequencyProvider');
  }
  return context;
}
