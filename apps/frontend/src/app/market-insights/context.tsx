'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MarketinsightsContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const MarketinsightsContext = createContext<MarketinsightsContextType | undefined>(undefined);

export function MarketinsightsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <MarketinsightsContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </MarketinsightsContext.Provider>
  );
}

export function useMarketinsightsContext() {
  const context = useContext(MarketinsightsContext);
  if (context === undefined) {
    throw new Error('useMarketinsightsContext must be used within MarketinsightsProvider');
  }
  return context;
}