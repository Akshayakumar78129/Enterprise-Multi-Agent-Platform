"use client";

import React from "react";
import { Card, Skeleton, Badge, getShiftClickManager } from "components/index";
import { Search, User } from "lucide-react";
import { useBehaviorContext } from "../context";

interface CustomerTableProps {
  data: any[];
  loading: boolean;
  onCustomerSelect?: (customer: any) => void;
}

export function CustomerTable({ data, loading, onCustomerSelect }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const { selectionManager } = useBehaviorContext();
  const shiftClickManager = getShiftClickManager();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <Card title="Top Customers" description="Customers with highest behavioral value">
        <Skeleton className="h-96" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Top Customers" description="Customers with highest behavioral value">
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          No customer data available
        </div>
      </Card>
    );
  }

  const filteredData = data
    .filter(customer =>
      (customer.customer_name || customer.customerName || customer.name)?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0;

      let aValue, bValue;
      switch (sortColumn) {
        case 'name':
          aValue = a.customer_name || a.customerName || a.name || '';
          bValue = b.customer_name || b.customerName || b.name || '';
          break;
        case 'segment':
          aValue = a.customer_type || a.customerType || a.segment || '';
          bValue = b.customer_type || b.customerType || b.segment || '';
          break;
        case 'totalSpend':
          aValue = a.total_spend || a.totalSpend || 0;
          bValue = b.total_spend || b.totalSpend || 0;
          break;
        case 'avgOrder':
          aValue = a.avg_order_value || a.avgOrderValue || 0;
          bValue = b.avg_order_value || b.avgOrderValue || 0;
          break;
        case 'frequency':
          aValue = a.avg_days_between_purchases || a.avgDaysBetweenPurchases || 999;
          bValue = b.avg_days_between_purchases || b.avgDaysBetweenPurchases || 999;
          break;
        case 'lastPurchase':
          aValue = a.last_purchase_date || a.lastPurchaseDate || '';
          bValue = b.last_purchase_date || b.lastPurchaseDate || '';
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getRiskBadge = (score: number) => {
    if (score > 0.7) return { color: "bg-green-500/20 text-green-400", text: "Highly Engaged" };
    if (score > 0.4) return { color: "bg-yellow-500/20 text-yellow-400", text: "Moderate" };
    return { color: "bg-red-500/20 text-red-400", text: "At Risk" };
  };

  return (
    <Card
      title="Customer Behavior Analysis"
      description="Detailed customer behavior metrics and patterns"
    >
      <div className="space-y-4">
        {/* Search Filter */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="text-left p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('name')}
                >
                  Customer {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-left p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('segment')}
                >
                  Segment {sortColumn === 'segment' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('totalSpend')}
                >
                  Total Spend {sortColumn === 'totalSpend' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('avgOrder')}
                >
                  Avg Order {sortColumn === 'avgOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('frequency')}
                >
                  Frequency {sortColumn === 'frequency' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('lastPurchase')}
                >
                  Last Purchase {sortColumn === 'lastPurchase' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 20).map((customer, idx) => {
                const riskBadge = getRiskBadge(customer.engagement_score || 0);
                return (
                  <tr
                    key={`customer-${idx}-${customer.customer_id || customer.customerId || customer.id}`}
                    className="border-b border-border/50 hover:bg-background/50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (e.shiftKey) {
                        // Shift+click: Add to global shift+click selection
                        const customerName = customer.customer_name || customer.customerName || customer.name || `Customer ${customer.customer_id || customer.customerId || customer.id}`;
                        shiftClickManager.addPoint({
                          label: `Customer: ${customerName}`,
                          value: `Total Spend: $${(customer.total_spend || customer.totalSpend || 0).toFixed(2)}, ${riskBadge.text}`,
                          source: 'Behavior Table'
                        }, e.nativeEvent);
                      } else if (onCustomerSelect) {
                        onCustomerSelect(customer);
                      }
                    }}
                  >
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {customer.customer_name || customer.customerName || customer.name || "Unknown Customer"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {customer.customer_type || customer.customerType || customer.segment || "Unknown"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium text-green-400">
                        ${(customer.total_spend || customer.totalSpend || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.purchase_count || customer.transactionCount || 0} orders
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      ${(customer.avg_order_value || customer.avgOrderValue || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-sm">
                        {customer.avg_days_between_purchases || customer.avgDaysBetweenPurchases
                          ? (customer.avg_days_between_purchases || customer.avgDaysBetweenPurchases).toFixed(1) + ' days'
                          : customer.purchase_frequency || customer.purchaseFrequency
                            ? `${(customer.purchase_frequency || customer.purchaseFrequency).toFixed(1)}/mo`
                            : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.recencyDays ? `${customer.recencyDays} days ago` : ''}
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {customer.last_purchase_date || customer.lastPurchaseDate ||
                       (customer.recencyDays ? `${customer.recencyDays}d ago` : "N/A")}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${riskBadge.color}`}>
                        {riskBadge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length > 20 && (
          <div className="text-center text-sm text-muted-foreground pt-4">
            Showing 20 of {filteredData.length} customers
          </div>
        )}
      </div>
    </Card>
  );
}