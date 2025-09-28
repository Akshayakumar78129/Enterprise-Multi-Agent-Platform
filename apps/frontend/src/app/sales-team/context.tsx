'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SalesteamContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const SalesteamContext = createContext<SalesteamContextType | undefined>(undefined);

export function SalesteamProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <SalesteamContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </SalesteamContext.Provider>
  );
}

export function useSalesteamContext() {
  const context = useContext(SalesteamContext);
  if (context === undefined) {
    throw new Error('useSalesteamContext must be used within SalesteamProvider');
  }
  return context;
}