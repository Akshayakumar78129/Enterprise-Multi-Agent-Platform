import React from 'react';
import { NextPurchaseProvider } from './context';

export default function NextPurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextPurchaseProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Next Purchase Prediction</h1>
          <p className="text-muted-foreground mt-2">
            Predict when and what customers will purchase next
          </p>
        </div>
        {children}
      </div>
    </NextPurchaseProvider>
  );
}