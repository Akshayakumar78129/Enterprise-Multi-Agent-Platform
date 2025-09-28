'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StockoptimizationContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const StockoptimizationContext = createContext<StockoptimizationContextType | undefined>(undefined);

export function StockoptimizationProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <StockoptimizationContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </StockoptimizationContext.Provider>
  );
}

export function useStockoptimizationContext() {
  const context = useContext(StockoptimizationContext);
  if (context === undefined) {
    throw new Error('useStockoptimizationContext must be used within StockoptimizationProvider');
  }
  return context;
}