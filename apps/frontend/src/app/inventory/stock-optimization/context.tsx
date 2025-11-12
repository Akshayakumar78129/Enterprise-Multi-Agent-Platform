'use client';

import React from 'react';
import { SelectedPoint, Message } from 'components';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';

export interface StockOptimizationFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  warehouseIds: string[];
  optimizationLevel: 'conservative' | 'balanced' | 'aggressive';
}

type StockOptimizationContextValue = {
  filters: StockOptimizationFilters;
  setFilters: React.Dispatch<React.SetStateAction<StockOptimizationFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  recommendations: any[];
  setRecommendations: React.Dispatch<React.SetStateAction<any[]>>;
  insights: string[];
  setInsights: React.Dispatch<React.SetStateAction<string[]>>;
  kpiMetrics: any;
  setKpiMetrics: React.Dispatch<React.SetStateAction<any>>;
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

const StockOptimizationContext = React.createContext<StockOptimizationContextValue | undefined>(undefined);

export function useStockoptimizationContext(): StockOptimizationContextValue {
  const ctx = React.useContext(StockOptimizationContext);
  if (!ctx) throw new Error('useStockoptimizationContext must be used within StockOptimizationProvider');
  return ctx;
}

export function StockoptimizationProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I\'m your AI assistant. How can I help you analyze stock optimization today?'
  }]);
  const [chatInput, setChatInput] = React.useState('');
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Data sharing for BI panel
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [kpiMetrics, setKpiMetrics] = React.useState<any>({});

  // Default filters - always used for SSR to prevent hydration mismatch
  const defaultFilters: StockOptimizationFilters = React.useMemo(() => ({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    categories: [],
    warehouseIds: [],
    optimizationLevel: 'balanced'
  }), []);

  const [filters, setFilters] = React.useState<StockOptimizationFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('stockOptimizationFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (e) {
      console.error('Failed to load saved filters:', e);
    }
  }, []);

  // Save filters to localStorage when they change (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stockOptimizationFilters', JSON.stringify(filters));
    }
  }, [filters]);

  // Sync selections with manager
  React.useEffect(() => {
    const handleSelectionChange = (points: SelectedPoint[]) => {
      setSelectedPoints(points);
    };

    selectionManager.addListener(handleSelectionChange);
    return () => selectionManager.removeListener(handleSelectionChange);
  }, [selectionManager]);

  const value: StockOptimizationContextValue = {
    filters,
    setFilters,
    selectedPoints,
    selectionManager,
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    recommendations,
    setRecommendations,
    insights,
    setInsights,
    kpiMetrics,
    setKpiMetrics,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId
  };

  return (
    <StockOptimizationContext.Provider value={value}>
      {children}
    </StockOptimizationContext.Provider>
  );
}