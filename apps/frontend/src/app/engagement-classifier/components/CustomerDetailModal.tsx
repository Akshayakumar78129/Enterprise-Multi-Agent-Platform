"use client";

import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Mail, Phone, TrendingUp } from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: any[];
  engagementLevel?: string | null;
  title?: string;
}

export function CustomerDetailModal({
  isOpen,
  onClose,
  customers = [],
  engagementLevel = null,
  title = "Customer Details"
}: CustomerDetailModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('LTD Sales Amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const customersPerPage = 10;

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      filtered = customers.filter(customer =>
        (customer["Customer Name"] || customer.customer_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (customer["Customer Number"] || customer.customer_number || '')
          .toString()
          .includes(searchTerm)
      );
    }

    // Sort customers
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || a[sortBy.toLowerCase().replace(/ /g, '_')] || 0;
      const bVal = b[sortBy] || b[sortBy.toLowerCase().replace(/ /g, '_')] || 0;

      // Handle string sorting
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle numeric sorting
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const paginatedCustomers = filteredAndSortedCustomers.slice(startIndex, startIndex + customersPerPage);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (filteredAndSortedCustomers.length === 0) return null;

    const totalCustomers = filteredAndSortedCustomers.length;
    const totalLTV = filteredAndSortedCustomers.reduce((sum, c) =>
      sum + (c["LTD Sales Amount"] || c.ltd_sales_amount || 0), 0
    );
    const avgLTV = totalLTV / totalCustomers;
    const avgTransactions = filteredAndSortedCustomers.reduce((sum, c) =>
      sum + (c["Number Sales Txns"] || c.number_sales_txns || 0), 0
    ) / totalCustomers;
    const avgDaysSinceActivity = filteredAndSortedCustomers.reduce((sum, c) =>
      sum + (c["Days Since Last Activity"] || c.days_since_activity || 0), 0
    ) / totalCustomers;
    const avgRFMScore = filteredAndSortedCustomers.reduce((sum, c) =>
      sum + (c["RFM Score"] || c.rfm_score || 0), 0
    ) / totalCustomers;

    return {
      totalCustomers,
      totalLTV,
      avgLTV,
      avgTransactions,
      avgDaysSinceActivity,
      avgRFMScore
    };
  }, [filteredAndSortedCustomers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High': return '#10b981'; // Emerald
      case 'Medium': return '#f59e0b'; // Amber
      case 'Low': return '#ef4444'; // Red
      default: return '#64748b'; // Slate
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleCustomerAction = (customer: any, action: string) => {
    console.log(`${action} action for customer:`, customer["Customer Name"] || customer.customer_name);
    alert(`${action} action initiated for ${customer["Customer Name"] || customer.customer_name}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              {title}
              {engagementLevel && (
                <span
                  className="px-3 py-1 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: getEngagementColor(engagementLevel) }}
                >
                  {engagementLevel} Engagement
                </span>
              )}
            </h2>
            {summaryStats && (
              <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
                <span>{summaryStats.totalCustomers} customers</span>
                <span>Avg LTV: {formatCurrency(summaryStats.avgLTV)}</span>
                <span>Avg RFM: {summaryStats.avgRFMScore.toFixed(1)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-border">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="LTD Sales Amount">Sort by LTV</option>
              <option value="Days Since Last Activity">Sort by Recency</option>
              <option value="Number Sales Txns">Sort by Frequency</option>
              <option value="RFM Score">Sort by RFM Score</option>
              <option value="Customer Name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-accent/10 border border-border rounded-lg text-foreground hover:bg-accent/20 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-accent/5 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('Customer Name')}>
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('Loyalty Status')}>
                  Loyalty Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('LTD Sales Amount')}>
                  LTV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('Number Sales Txns')}>
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('Days Since Last Activity')}>
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/10" onClick={() => handleSort('RFM Score')}>
                  RFM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCustomers.map((customer, index) => (
                <tr key={index} className="hover:bg-accent/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {customer["Customer Name"] || customer.customer_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{customer["Customer Number"] || customer.customer_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {customer["Loyalty Status"] || customer.loyalty_status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    {formatCurrency(customer["LTD Sales Amount"] || customer.ltd_sales_amount || 0)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {customer["Number Sales Txns"] || customer.number_sales_txns || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {customer["Days Since Last Activity"] || customer.days_since_activity || 0} days
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {customer["RFM Score"] || customer.rfm_score || 0}/10
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCustomerAction(customer, 'Email')}
                        className="p-1.5 hover:bg-accent/10 rounded transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        onClick={() => handleCustomerAction(customer, 'Call')}
                        className="p-1.5 hover:bg-accent/10 rounded transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        onClick={() => handleCustomerAction(customer, 'View Details')}
                        className="p-1.5 hover:bg-accent/10 rounded transition-colors"
                        title="View Details"
                      >
                        <TrendingUp className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* No Results */}
          {filteredAndSortedCustomers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No customers found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + customersPerPage, filteredAndSortedCustomers.length)} of {filteredAndSortedCustomers.length} customers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-border rounded-lg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent/10 text-foreground'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-border rounded-lg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
