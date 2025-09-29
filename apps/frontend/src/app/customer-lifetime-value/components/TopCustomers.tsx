"use client";

import React from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopCustomersProps {
  data: any[];
  loading?: boolean;
  onCustomerSelect?: (customer: any) => void;
}

export function TopCustomers({ data = [], loading = false, onCustomerSelect }: TopCustomersProps) {
  const shiftClickManager = getShiftClickManager();
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          No customer data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">LTV</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Transactions</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Order</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Segment</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((customer, index) => (
              <tr
                key={customer.id || customer.customer_id || index}
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={(e) => {
                  if (e.shiftKey) {
                    // Shift+click: Add to global shift+click selection
                    const customerName = customer.name || customer.customer_name || `Customer ${customer.customer_id}`;
                    const ltv = customer.ltv || customer.lifetime_value || 0;
                    shiftClickManager.addPoint({
                      label: `Customer: ${customerName}`,
                      value: `LTV: $${ltv.toLocaleString()}, Segment: ${customer.segment || 'Standard'}`,
                      source: 'Top Customers'
                    }, e.nativeEvent);
                  } else if (onCustomerSelect) {
                    onCustomerSelect(customer);
                  }
                }}
              >
                <td className="py-3 px-4 text-sm font-medium">
                  {customer.name || customer.customer_name || `Customer ${customer.customer_id}`}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {customer.id || customer.customer_id}
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium text-primary">
                  ${(customer.ltv || customer.lifetime_value || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  {customer.transactions || customer.transaction_count || 0}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  ${(customer.avgOrder || customer.avg_order_value || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                    {customer.segment || customer.customerType || 'Standard'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(customer.trend || 0) > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">+{customer.trend || 0}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-500">{customer.trend || 0}%</span>
                      </>
                    )}
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