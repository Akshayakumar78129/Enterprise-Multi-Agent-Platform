import React from 'react';
import { SalesforecastProvider } from './context';

export default function SalesforecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesforecastProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Sales Forecast</h1>
          <p className="text-muted-foreground mt-2">
            Predict future sales trends and patterns
          </p>
        </div>
        {children}
      </div>
    </SalesforecastProvider>
  );
}