"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';
import { SelectedPoint, Message } from 'components';

export interface ProductPerformanceFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  products: string[];
  priceBands: string[];
  minMargin?: number;
  maxMargin?: number;
}

interface ProductPerformanceContextType {
  filters: ProductPerformanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProductPerformanceFilters>>;
  selectionManager: SelectionManager;
  selectedPoints: SelectedPoint[];
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  productData: any;
  setProductData: React.Dispatch<React.SetStateAction<any>>;
  // Chat state
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  chatIsLoading: boolean;
  setChatIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionId: string;
  chatUserId: string;
}

const ProductPerformanceContext = createContext<ProductPerformanceContextType | undefined>(undefined);

export function ProductPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [productData, setProductData] = useState<any>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your product performance data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Always start with default filters to avoid hydration mismatch
  const [filters, setFilters] = useState<ProductPerformanceFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    categories: [],
    products: [],
    priceBands: []
  });

  // Load filters from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('productPerformanceFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('productPerformanceFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // Subscribe to selection manager
  useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectionManager,
      selectedPoints,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      productData,
      setProductData,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId,
    }),
    [
      filters,
      selectionManager,
      selectedPoints,
      isChatOpen,
      isBIModalOpen,
      productData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return (
    <ProductPerformanceContext.Provider value={value}>
      {children}
    </ProductPerformanceContext.Provider>
  );
}

export function useProductPerformanceContext() {
  const context = useContext(ProductPerformanceContext);
  // Allow usage outside provider (e.g., in Enterprise-IQ canvas)
  // Components should handle undefined context gracefully
  return context;
}

export function useProductPerformanceContextRequired() {
  const context = useContext(ProductPerformanceContext);
  if (context === undefined) {
    throw new Error('useProductPerformanceContext must be used within a ProductPerformanceProvider');
  }
  return context;
}