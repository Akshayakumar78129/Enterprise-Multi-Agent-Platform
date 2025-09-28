"use client";

import React, { createContext, useContext, useState } from 'react';

interface NextPurchaseContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  predictionData: any[];
  setPredictionData: (data: any[]) => void;
}

const NextPurchaseContext = createContext<NextPurchaseContextType | undefined>(undefined);

export function NextPurchaseProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [predictionData, setPredictionData] = useState<any[]>([]);

  return (
    <NextPurchaseContext.Provider
      value={{
        filters,
        setFilters,
        predictionData,
        setPredictionData,
      }}
    >
      {children}
    </NextPurchaseContext.Provider>
  );
}

export function useNextPurchaseContext() {
  const context = useContext(NextPurchaseContext);
  if (context === undefined) {
    throw new Error('useNextPurchaseContext must be used within a NextPurchaseProvider');
  }
  return context;
}