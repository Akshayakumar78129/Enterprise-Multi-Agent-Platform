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

interface RetentionPlannerContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  retentionData: any[];
  setRetentionData: (data: any[,
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

const RetentionPlannerContext = createContext<RetentionPlannerContextType | undefined>(undefined);

export function RetentionPlannerProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  const selectionManager = useMemo(() => new SelectionManager(), []);

  return (
    <RetentionPlannerContext.Provider
      value={{
        filters,
        setFilters,
        retentionData,
        setRetentionData,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        selectionManager,
      }}
    >
      {children}
    </RetentionPlannerContext.Provider>
  );
}

export function useRetentionPlannerContext() {
  const context = useContext(RetentionPlannerContext);
  if (context === undefined) {
    throw new Error('useRetentionPlannerContext must be used within a RetentionPlannerProvider');
  }
  return context;
}