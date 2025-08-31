import React from 'react';
import SalesTrendDashboard from '../ui/views/SalesTrendDashboard';
import { ThemeProvider } from '../ui/contexts/ThemeContext';

export default function SalesTrendAnalyzerPage() {
  return (
    <ThemeProvider>
      <SalesTrendDashboard />
    </ThemeProvider>
  );
} 