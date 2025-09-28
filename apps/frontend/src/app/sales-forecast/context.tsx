'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SalesforecastContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const SalesforecastContext = createContext<SalesforecastContextType | undefined>(undefined);

export function SalesforecastProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <SalesforecastContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </SalesforecastContext.Provider>
  );
}

export function useSalesforecastContext() {
  const context = useContext(SalesforecastContext);
  if (context === undefined) {
    throw new Error('useSalesforecastContext must be used within SalesforecastProvider');
  }
  return context;
}