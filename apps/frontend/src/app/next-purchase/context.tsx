"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

class SelectionManager {
  private listeners: ((points: any[]) => void)[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId] = [];
  private selectedPoints: any[] = [];

  subscribe(listener: (points: any[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  setSelection(points: any[]) {
    this.selectedPoints = points;
    this.listeners.forEach((listener) => listener(points));
  }

  clearAll() {
    this.setSelection([,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);
  }

  getSelection() {
    return this.selectedPoints;
  }
}

interface NextPurchaseContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  predictionData: any[];
  setPredictionData: (data: any[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
  selectionManager: SelectionManager;
}

const NextPurchaseContext = createContext<NextPurchaseContextType | undefined>(undefined);

export function NextPurchaseProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  const selectionManager = useMemo(() => new SelectionManager(), []);

  return (
    <NextPurchaseContext.Provider
      value={{
        filters,
        setFilters,
        predictionData,
        setPredictionData,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        selectionManager,
      }}
    >
      {children}
    </NextPurchaseContext.Provider>
  );
}

export function useNextPurchaseContext() {
  const context = useContext(NextPurchaseContext);
  if (context === undefined) {
    throw new Error('useNextPurchaseContext must be used within a NextPurchaseProvider');
  }
  return context;
}