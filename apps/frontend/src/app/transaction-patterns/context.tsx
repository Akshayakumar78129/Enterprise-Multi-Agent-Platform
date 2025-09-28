"use client";

import React, { createContext, useContext, useState } from 'react';

interface TransactionPatternsContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  patternData: any[];
  setPatternData: (data: any[]) => void;
}

const TransactionPatternsContext = createContext<TransactionPatternsContextType | undefined>(undefined);

export function TransactionPatternsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [patternData, setPatternData] = useState<any[]>([]);

  return (
    <TransactionPatternsContext.Provider
      value={{
        filters,
        setFilters,
        patternData,
        setPatternData,
      }}
    >
      {children}
    </TransactionPatternsContext.Provider>
  );
}

export function useTransactionPatternsContext() {
  const context = useContext(TransactionPatternsContext);
  if (context === undefined) {
    throw new Error('useTransactionPatternsContext must be used within a TransactionPatternsProvider');
  }
  return context;
}