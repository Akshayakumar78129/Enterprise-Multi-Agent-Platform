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

interface RetentionPlannerContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  retentionData: any[];
  setRetentionData: (data: any[]) => void;
  insights: any[];
  setInsights: (insights: any[]) => void;
  kpiMetrics: Record<string, any>;
  setKpiMetrics: (metrics: Record<string, any>) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
  selectionManager: SelectionManager;
  chatMessages: any[];
  setChatMessages: (messages: any[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatIsLoading: boolean;
  setChatIsLoading: (loading: boolean) => void;
  chatSessionId: string;
  chatUserId: string;
}

const RetentionPlannerContext = createContext<RetentionPlannerContextType | undefined>(undefined);

export function RetentionPlannerProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<Record<string, any>>({});
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const chatSessionId = useMemo(() => `retention-${Date.now()}`, []);
  const chatUserId = 'user-1';

  const selectionManager = useMemo(() => new SelectionManager(), []);

  return (
    <RetentionPlannerContext.Provider
      value={{
        filters,
        setFilters,
        retentionData,
        setRetentionData,
        insights,
        setInsights,
        kpiMetrics,
        setKpiMetrics,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        selectionManager,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        chatIsLoading,
        setChatIsLoading,
        chatSessionId,
        chatUserId,
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