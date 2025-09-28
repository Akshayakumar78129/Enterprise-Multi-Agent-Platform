import React from 'react';
import { DemandforecastProvider } from './context';

export default function DemandforecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemandforecastProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Demand Forecast</h1>
          <p className="text-muted-foreground mt-2">
            Predict future demand using ML
          </p>
        </div>
        {children}
      </div>
    </DemandforecastProvider>
  );
}