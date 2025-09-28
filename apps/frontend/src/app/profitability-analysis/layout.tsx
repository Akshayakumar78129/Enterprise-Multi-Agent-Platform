import React from 'react';
import { ProfitabilityanalysisProvider } from './context';

export default function ProfitabilityanalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfitabilityanalysisProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Profitability Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Margin analysis by product and customer
          </p>
        </div>
        {children}
      </div>
    </ProfitabilityanalysisProvider>
  );
}