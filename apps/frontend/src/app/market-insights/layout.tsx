import React from 'react';
import { MarketinsightsProvider } from './context';

export default function MarketinsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketinsightsProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Market Insights</h1>
          <p className="text-muted-foreground mt-2">
            Analyze market trends and competitive positioning
          </p>
        </div>
        {children}
      </div>
    </MarketinsightsProvider>
  );
}