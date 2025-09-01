'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ContextItem {
  id: string;
  type: 'kpi' | 'chart_data' | 'table_row' | 'bubble' | 'metric' | 'insight';
  title: string;
  data: any;
  source: string; // Which component/visualization it came from
  timestamp: number;
  displayValue?: string; // Human readable value for display
}

interface DataContextState {
  contextItems: ContextItem[];
  addContext: (item: Omit<ContextItem, 'id' | 'timestamp'>) => void;
  removeContext: (id: string) => void;
  clearContext: () => void;
  getFormattedContext: () => string;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataContextProvider');
  }
  return context;
};

interface DataContextProviderProps {
  children: ReactNode;
  onFirstContextAdded?: () => void; // Callback to auto-open chat panel
}

export const DataContextProvider: React.FC<DataContextProviderProps> = ({ 
  children, 
  onFirstContextAdded 
}) => {
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);

  const addContext = (item: Omit<ContextItem, 'id' | 'timestamp'>) => {
    const newItem: ContextItem = {
      ...item,
      id: `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setContextItems(prev => {
      const updated = [...prev, newItem];
      
      // Auto-open chat panel on first context
      if (prev.length === 0 && onFirstContextAdded) {
        setTimeout(() => onFirstContextAdded(), 100);
      }
      
      return updated;
    });
  };

  const removeContext = (id: string) => {
    setContextItems(prev => prev.filter(item => item.id !== id));
  };

  const clearContext = () => {
    setContextItems([]);
  };

  const getFormattedContext = () => {
    if (contextItems.length === 0) return '';

    const contextBySource = contextItems.reduce((acc, item) => {
      if (!acc[item.source]) {
        acc[item.source] = [];
      }
      acc[item.source].push(item);
      return acc;
    }, {} as Record<string, ContextItem[]>);

    const formatted = Object.entries(contextBySource).map(([source, items]) => {
      const itemDescriptions = items.map(item => {
        const displayValue = item.displayValue || (typeof item.data === 'object' ? JSON.stringify(item.data) : String(item.data));
        return `• **${item.title}**: ${displayValue}`;
      }).join('\n');

      return `**${source}:**\n${itemDescriptions}`;
    }).join('\n\n');

    return `## 📊 Selected Context Data\n\n${formatted}`;
  };

  return (
    <DataContext.Provider value={{
      contextItems,
      addContext,
      removeContext,
      clearContext,
      getFormattedContext
    }}>
      {children}
    </DataContext.Provider>
  );
};
