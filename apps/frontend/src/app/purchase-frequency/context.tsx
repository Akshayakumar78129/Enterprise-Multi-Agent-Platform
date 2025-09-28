"use client";

import React, { createContext, useContext, useState } from 'react';

interface PurchaseFrequencyContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  frequencyCustomers: any[];
  setFrequencyCustomers: (customers: any[]) => void;
}

const PurchaseFrequencyContext = createContext<PurchaseFrequencyContextType | undefined>(undefined);

export function PurchaseFrequencyProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [frequencyCustomers, setFrequencyCustomers] = useState<any[]>([]);

  return (
    <PurchaseFrequencyContext.Provider
      value={{
        filters,
        setFilters,
        frequencyCustomers,
        setFrequencyCustomers,
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