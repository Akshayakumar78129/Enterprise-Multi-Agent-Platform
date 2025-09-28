'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SupplierperformanceContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const SupplierperformanceContext = createContext<SupplierperformanceContextType | undefined>(undefined);

export function SupplierperformanceProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <SupplierperformanceContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </SupplierperformanceContext.Provider>
  );
}

export function useSupplierperformanceContext() {
  const context = useContext(SupplierperformanceContext);
  if (context === undefined) {
    throw new Error('useSupplierperformanceContext must be used within SupplierperformanceProvider');
  }
  return context;
}