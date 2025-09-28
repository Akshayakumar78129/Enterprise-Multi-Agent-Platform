import React from 'react';
import { FinancialoverviewProvider } from './context';

export default function FinancialoverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinancialoverviewProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Financial Overview</h1>
          <p className="text-muted-foreground mt-2">
            P&L, balance sheet, and cash flow overview
          </p>
        </div>
        {children}
      </div>
    </FinancialoverviewProvider>
  );
}