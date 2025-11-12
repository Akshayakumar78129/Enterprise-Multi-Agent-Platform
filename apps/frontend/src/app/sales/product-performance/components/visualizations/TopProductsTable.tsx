"use client";

import React, { useState, useMemo } from 'react';
import { Card } from 'components/index';
import { ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { useProductPerformanceContext } from '../../context';

interface Product {
  productName: string;
  category: string;
  revenue: number;
  unitsSold: number;
  avgPrice: number;
  margin?: number;
  marginPercent?: number;
}

interface TopProductsTableProps {
  data: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
}

type SortField = 'productName' | 'revenue' | 'unitsSold' | 'avgPrice' | 'marginPercent';
type SortDirection = 'asc' | 'desc';

export function TopProductsTable({ data = [], loading = false, onProductClick }: TopProductsTableProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredData = useMemo(() => {
    let filtered = data;

    if (searchQuery) {
      filtered = data.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection, searchQuery]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading products...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
          <Package className="w-12 h-12 mb-2 opacity-50" />
          <p>No product data available</p>
        </div>
      </Card>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 text-primary" /> :
      <ArrowDown className="w-4 h-4 text-primary" />;
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search products or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground"
          />
          <div className="text-sm text-muted-foreground ml-4">
            {sortedAndFilteredData.length} of {data.length} products
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('productName')}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Product
                  <SortIcon field="productName" />
                </div>
              </th>
              <th className="text-left py-3 px-4">
                <div className="text-sm font-medium text-muted-foreground">Category</div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                  Revenue
                  <SortIcon field="revenue" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('unitsSold')}
              >
                <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                  Units Sold
                  <SortIcon field="unitsSold" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('avgPrice')}
              >
                <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                  Avg Price
                  <SortIcon field="avgPrice" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('marginPercent')}
              >
                <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                  Margin %
                  <SortIcon field="marginPercent" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredData.slice(0, 20).map((product, index) => (
              <tr
                key={index}
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={(e) => {
                  if (e.shiftKey && selectionManager) {
                    // Shift+click: Add to chatbot context
                    selectionManager.addPoint({
                      label: `Product: ${product.productName}`,
                      value: `Revenue: $${product.revenue.toLocaleString()}, Units: ${product.unitsSold.toLocaleString()}, Margin: ${(product.marginPercent || 0).toFixed(1)}%`,
                      source: 'Top Products Table'
                    }, true);
                  } else {
                    onProductClick?.(product);
                  }
                }}
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-foreground">{product.productName}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-muted-foreground">{product.category}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-medium text-foreground">
                    ${product.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-foreground">{product.unitsSold.toLocaleString()}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-foreground">
                    ${product.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className={`font-medium ${
                    (product.marginPercent || 0) > 30 ? 'text-green-500' :
                    (product.marginPercent || 0) > 15 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {product.marginPercent?.toFixed(1) || '0.0'}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
