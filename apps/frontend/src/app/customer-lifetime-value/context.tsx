"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';
import { Message } from "components";

interface CustomerLtvFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  regions: string[];
  customerTypes: string[];
  minValue?: number;
  maxValue?: number;
}

interface CustomerLtvContextType {
  // Filters
  filters: CustomerLtvFilters;
  setFilters: (filters: CustomerLtvFilters) => void;

  // Selection
  selectedSegment: string | null;
  setSelectedSegment: (segment: string | null) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any | null) => void;

  // Panels
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;

  // Data
  selectionManager: SelectionManager;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  insights: string[];
  setInsights: (insights: string[]) => void;

  // Chat
  chatMessages: Message[];
  setChatMessages: (messages: Message[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatIsLoading: boolean;
  setChatIsLoading: (loading: boolean) => void;
  chatSessionId: string;
  chatUserId: string;
}

const CustomerLtvContext = createContext<CustomerLtvContextType | undefined>(undefined);

export function CustomerLtvProvider({ children }: { children: React.ReactNode }) {
  // Default filters - always used for SSR to prevent hydration mismatch
  const defaultFilters: CustomerLtvFilters = useMemo(() => ({
    dateRange: {
      startDate: '2017-01-01',
      endDate: '2021-12-31'
    },
    regions: [],
    customerTypes: [],
  }), []);

  const [filters, setFiltersState] = useState<CustomerLtvFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ltv_filters');
      if (stored) {
        const parsed = JSON.parse(stored);

        // Migration: Convert old date_from/date_to to new dateRange format
        if (parsed.date_from && parsed.date_to) {
          setFiltersState({
            dateRange: {
              startDate: parsed.date_from,
              endDate: parsed.date_to
            },
            regions: parsed.regions || [],
            customerTypes: parsed.customerTypes || [],
            minValue: parsed.minValue,
            maxValue: parsed.maxValue
          });
        } else {
          setFiltersState(parsed);
        }
      }
    } catch (error) {
      console.error('[LtvContext] Failed to load saved filters:', error);
    }
  }, []); // Run once on mount

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ltv_filters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const setFilters = (newFilters: CustomerLtvFilters) => {
    setFiltersState(newFilters);
  };

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  // Chat state management
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    id: "1",
    role: "assistant",
    content: "Hello! I'm here to help you analyze customer lifetime value. What would you like to know?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  return (
    <CustomerLtvContext.Provider
      value={{
        filters,
        setFilters,
        selectedSegment,
        setSelectedSegment,
        selectedTimeRange,
        setSelectedTimeRange,
        selectedCustomer,
        setSelectedCustomer,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        selectionManager,
        customers,
        setCustomers,
        insights,
        setInsights,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        chatIsLoading,
        setChatIsLoading,
        chatSessionId,
        chatUserId
      }}
    >
      {children}
    </CustomerLtvContext.Provider>
  );
}

export function useCustomerLtvContext() {
  const context = useContext(CustomerLtvContext);
  if (!context) {
    throw new Error('useCustomerLtvContext must be used within CustomerLtvProvider');
  }
  return context;
}