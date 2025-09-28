import React from 'react';
import { RevenueanalysisProvider } from './context';

export default function RevenueanalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RevenueanalysisProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Revenue Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Analyze revenue streams and profitability
          </p>
        </div>
        {children}
      </div>
    </RevenueanalysisProvider>
  );
}