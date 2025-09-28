"use client";

import React, { createContext, useContext, useState } from 'react';

interface SalesPerformanceContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  salesData: any[];
  setSalesData: (data: any[]) => void;
}

const SalesPerformanceContext = createContext<SalesPerformanceContextType | undefined>(undefined);

export function SalesPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [salesData, setSalesData] = useState<any[]>([]);

  return (
    <SalesPerformanceContext.Provider
      value={{
        filters,
        setFilters,
        salesData,
        setSalesData,
      }}
    >
      {children}
    </SalesPerformanceContext.Provider>
  );
}

export function useSalesPerformanceContext() {
  const context = useContext(SalesPerformanceContext);
  if (context === undefined) {
    throw new Error('useSalesPerformanceContext must be used within a SalesPerformanceProvider');
  }
  return context;
}