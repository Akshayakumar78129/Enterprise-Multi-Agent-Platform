"use client";

import React, { useState, useMemo } from "react";

export interface Customer {
  id: string;
  name: string;
  customerId: number;
  clv: number;
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  riskPercentage: number;
}

export interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomers: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  segment: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "risk" | "name" | "clv";
  onSortChange: (sort: "risk" | "name" | "clv") => void;
  className?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomers,
  onSelectionChange,
  segment,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  className = "",
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "risk":
          return b.riskPercentage - a.riskPercentage;
        case "name":
          return a.name.localeCompare(b.name);
        case "clv":
          return b.clv - a.clv;
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, sortBy]);

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredAndSortedCustomers.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  const handleCustomerSelect = (customerId: string) => {
    const newSelection = selectedCustomers.includes(customerId)
      ? selectedCustomers.filter(id => id !== customerId)
      : [...selectedCustomers, customerId];
    
    onSelectionChange(newSelection);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Very High": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-black";
      case "Low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className={`bg-surface rounded-xl p-6 border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Select Individual Customers from {segment}
        </h3>
        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
          {segment}
        </span>
      </div>

      {/* Search and Controls */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder={`Search within ${customers.length} customers from ${segment} segment(s)...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "risk" | "name" | "clv")}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="risk">Sort by Risk</option>
          <option value="name">Sort by Name</option>
          <option value="clv">Sort by CLV</option>
        </select>
        <button
          onClick={handleSelectAll}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {selectAll ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Customer List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredAndSortedCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted">
            No customers found matching your search criteria.
          </div>
        ) : (
          filteredAndSortedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCustomers.includes(customer.id)}
                onChange={() => handleCustomerSelect(customer.id)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              
              <div className="flex-1">
                <div className="font-medium text-foreground">{customer.name}</div>
                <div className="text-sm text-muted">
                  ID: {customer.customerId} | CLV: ${customer.clv.toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(customer.riskLevel)}`}>
                  {customer.riskLevel}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {customer.riskPercentage}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selection Summary */}
      {selectedCustomers.length > 0 && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-sm text-primary font-medium">
            {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </div>
  );
};
