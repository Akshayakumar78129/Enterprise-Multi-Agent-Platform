"use client";

import React, { createContext, useContext, useState } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';

interface CustomerLtvContextType {
  selectedSegment: string | null;
  setSelectedSegment: (segment: string | null) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  selectedCustomer: any | null;
  setSelectedCustomer: (customer: any | null) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
  selectionManager: SelectionManager;
  customers: any[];
  setCustomers: (customers: any[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]) => void;
}

const CustomerLtvContext = createContext<CustomerLtvContextType | undefined>(undefined);

export function CustomerLtvProvider({ children }: { children: React.ReactNode }) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectionManager] = useState(() => getSelectionManager());

  return (
    <CustomerLtvContext.Provider
      value={{
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
        setCustomers
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