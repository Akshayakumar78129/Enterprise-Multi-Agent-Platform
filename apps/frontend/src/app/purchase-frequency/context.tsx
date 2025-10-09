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

interface PurchaseFrequencyContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  frequencyCustomers: any[];
  setFrequencyCustomers: (customers: any[,
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

const PurchaseFrequencyContext = createContext<PurchaseFrequencyContextType | undefined>(undefined);

export function PurchaseFrequencyProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [frequencyCustomers, setFrequencyCustomers] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  const selectionManager = useMemo(() => new SelectionManager(), []);

  return (
    <PurchaseFrequencyContext.Provider
      value={{
        filters,
        setFilters,
        frequencyCustomers,
        setFrequencyCustomers,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        selectionManager,
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