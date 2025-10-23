"use client";

import React, { useState, useMemo } from 'react';
import { ChartCard } from 'components/index';
import { Input } from 'components/forms/Input';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface AgingTableRow {
  customerId: string;
  customerName: string;
  totalOutstanding: number;
  avgDaysOverdue: number;
  invoiceCount: number;
  region: string;
  customerType: string;
}

interface AgingTableProps {
  data: AgingTableRow[];
  loading?: boolean;
}

type SortField = 'customerName' | 'totalOutstanding' | 'avgDaysOverdue' | 'invoiceCount';
type SortDirection = 'asc' | 'desc' | null;

export function AgingTable({ data, loading }: AgingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...(data || [])];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(row =>
        row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.customerType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-accent" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 text-accent" />;
    }
    return <ArrowUpDown className="w-4 h-4 opacity-40" />;
  };

  if (loading) {
    return (
      <ChartCard loading={loading}>
        <div className="h-96 flex items-center justify-center text-muted">
          Loading...
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-foreground-muted">
            {filteredAndSortedData.length} customers • ${(filteredAndSortedData.reduce((sum, row) => sum + row.totalOutstanding, 0) / 1000000).toFixed(2)}M total AR
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="text-left py-3 px-4 text-foreground-muted font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center gap-2">
                    Customer
                    {getSortIcon('customerName')}
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-foreground-muted font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('totalOutstanding')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Outstanding AR
                    {getSortIcon('totalOutstanding')}
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-foreground-muted font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('avgDaysOverdue')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Avg Days Overdue
                    {getSortIcon('avgDaysOverdue')}
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-foreground-muted font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('invoiceCount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Invoices
                    {getSortIcon('invoiceCount')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-foreground-muted font-medium">
                  Region
                </th>
                <th className="text-left py-3 px-4 text-foreground-muted font-medium">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.customerId}
                  className="border-b border-border hover:bg-surface/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="text-foreground font-medium">{row.customerName}</div>
                    <div className="text-xs text-muted">{row.customerId}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-foreground font-semibold">
                      ${row.totalOutstanding.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      row.avgDaysOverdue > 90
                        ? 'bg-red-500/20 text-red-600'
                        : row.avgDaysOverdue > 60
                        ? 'bg-orange-500/20 text-orange-600'
                        : row.avgDaysOverdue > 30
                        ? 'bg-yellow-500/20 text-yellow-600'
                        : 'bg-green-500/20 text-green-600'
                    }`}>
                      {row.avgDaysOverdue.toFixed(0)} days
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {row.invoiceCount}
                  </td>
                  <td className="py-3 px-4 text-foreground-muted">
                    {row.region || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-foreground-muted">
                    {row.customerType || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-sm text-foreground-muted">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-surface text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface/70 transition-colors border border-border"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-3 py-1 text-muted">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-accent text-white font-semibold'
                            : 'bg-surface text-foreground hover:bg-surface/70 border border-border'
                        } transition-colors`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-surface text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface/70 transition-colors border border-border"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </ChartCard>
  );
}
