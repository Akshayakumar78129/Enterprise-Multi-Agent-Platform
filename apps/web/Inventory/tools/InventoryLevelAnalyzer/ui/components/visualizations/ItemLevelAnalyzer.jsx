import React, { useState, useMemo } from "react";

const ItemLevelAnalyzer = ({ 
  data = [], 
  isLoading = false, 
  onItemSelect = null,
  onSort = null,
  onFilter = null 
}) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ column: 'status', direction: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    warehouse: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critical': return '#e930ff';
      case 'Low': return '#d45d79';
      case 'Adequate': return '#5fd4d6';
      case 'Excess': return '#00e0ff';
      default: return '#f7f9fb';
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case 'Critical': return '#e930ff20';
      case 'Low': return '#d45d7920';
      case 'Adequate': return '#5fd4d620';
      case 'Excess': return '#00e0ff20';
      default: return 'transparent';
    }
  };

  const handleSort = (column) => {
    const direction = sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column, direction });
    if (onSort) {
      onSort(column, direction);
    }
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    if (onItemSelect) {
      const selectedData = data.filter(item => newSelected.has(item.itemId));
      onItemSelect(selectedData);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
      if (onItemSelect) onItemSelect([]);
    } else {
      const allIds = new Set(filteredData.map(item => item.itemId));
      setSelectedItems(allIds);
      if (onItemSelect) onItemSelect(filteredData);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !filters.search || 
        item.itemName.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.itemId.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesWarehouse = !filters.warehouse || item.warehouse === filters.warehouse;
      const matchesStatus = !filters.status || item.status === filters.status;
      
      return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const uniqueCategories = [...new Set(data.map(item => item.category))];
  const uniqueWarehouses = [...new Set(data.map(item => item.warehouse))];
  const statuses = ['Critical', 'Low', 'Adequate', 'Excess'];

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: "760px",
          height: "500px",
          backgroundColor: "#232a36",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #00e0ff30",
            borderTop: "3px solid #00e0ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "760px",
        height: "500px",
        backgroundColor: "#232a36",
        borderRadius: "16px",
        padding: "24px",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ 
          margin: "0 0 4px 0", 
          fontSize: "18px", 
          fontWeight: "600", 
          color: "#f7f9fb" 
        }}>
          Item Level Analyzer
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: "14px", 
          color: "#f7f9fb80" 
        }}>
          Detailed inventory analysis by item
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#1e2738",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <input
          type="text"
          placeholder="Search items..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{
            flex: "1",
            minWidth: "150px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #3a4459",
            backgroundColor: "#232a36",
            color: "#f7f9fb",
            fontSize: "12px",
            outline: "none"
          }}
        />
        
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #3a4459",
            backgroundColor: "#232a36",
            color: "#f7f9fb",
            fontSize: "12px",
            outline: "none"
          }}
        >
          <option value="">All Categories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filters.warehouse}
          onChange={(e) => handleFilterChange('warehouse', e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #3a4459",
            backgroundColor: "#232a36",
            color: "#f7f9fb",
            fontSize: "12px",
            outline: "none"
          }}
        >
          <option value="">All Warehouses</option>
          {uniqueWarehouses.map(wh => (
            <option key={wh} value={wh}>{wh}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #3a4459",
            backgroundColor: "#232a36",
            color: "#f7f9fb",
            fontSize: "12px",
            outline: "none"
          }}
        >
          <option value="">All Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {selectedItems.size > 0 && (
          <div style={{ 
            padding: "8px 12px", 
            backgroundColor: "#00e0ff20", 
            borderRadius: "6px",
            fontSize: "12px",
            color: "#00e0ff"
          }}>
            {selectedItems.size} selected
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Table Header */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#1e2738",
            borderRadius: "8px 8px 0 0",
            padding: "12px 8px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#f7f9fb",
            borderBottom: "1px solid #3a4459"
          }}
        >
          <div style={{ width: "40px", textAlign: "center" }}>
            <input
              type="checkbox"
              checked={selectedItems.size === filteredData.length && filteredData.length > 0}
              onChange={handleSelectAll}
              style={{ cursor: "pointer" }}
            />
          </div>
          {[
            { key: 'itemId', label: 'Item ID', width: '80px' },
            { key: 'itemName', label: 'Item Name', width: '140px' },
            { key: 'category', label: 'Category', width: '80px' },
            { key: 'warehouse', label: 'Warehouse', width: '100px' },
            { key: 'currentStock', label: 'Stock', width: '60px' },
            { key: 'stockLevelPct', label: 'Level %', width: '60px' },
            { key: 'daysOfSupply', label: 'Days', width: '50px' },
            { key: 'inventoryValue', label: 'Value', width: '70px' },
            { key: 'status', label: 'Status', width: '70px' }
          ].map(({ key, label, width }) => (
            <div
              key={key}
              style={{
                width,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "0 4px"
              }}
              onClick={() => handleSort(key)}
            >
              {label}
              {sortConfig.column === key && (
                <span style={{ fontSize: "10px" }}>
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {paginatedData.map((item, index) => (
            <div
              key={item.itemId}
              style={{
                display: "flex",
                padding: "8px",
                backgroundColor: selectedItems.has(item.itemId) 
                  ? "#00e0ff15" 
                  : index % 2 === 0 ? "#1e2738" : "#232a36",
                borderBottom: "1px solid #3a4459",
                fontSize: "11px",
                color: "#f7f9fb",
                alignItems: "center",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!selectedItems.has(item.itemId)) {
                  e.currentTarget.style.backgroundColor = "#2a3441";
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedItems.has(item.itemId)) {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#1e2738" : "#232a36";
                }
              }}
            >
              <div style={{ width: "40px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.itemId)}
                  onChange={() => handleItemSelect(item.itemId)}
                  style={{ cursor: "pointer" }}
                />
              </div>
              <div style={{ width: "80px", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.itemId}
              </div>
              <div style={{ width: "140px", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.itemName}
              </div>
              <div style={{ width: "80px", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.category}
              </div>
              <div style={{ width: "100px", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.warehouse}
              </div>
              <div style={{ width: "60px", padding: "0 4px", textAlign: "right" }}>
                {formatNumber(item.currentStock)}
              </div>
              <div style={{ width: "60px", padding: "0 4px", textAlign: "right" }}>
                {(item.stockLevelPct * 100).toFixed(0)}%
              </div>
              <div style={{ width: "50px", padding: "0 4px", textAlign: "right" }}>
                {item.daysOfSupply.toFixed(0)}
              </div>
              <div style={{ width: "70px", padding: "0 4px", textAlign: "right" }}>
                {formatCurrency(item.inventoryValue)}
              </div>
              <div style={{ width: "70px", padding: "0 4px" }}>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "500",
                    backgroundColor: getStatusBackground(item.status),
                    color: getStatusColor(item.status),
                    display: "inline-block"
                  }}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            fontSize: "12px",
            color: "#f7f9fb80"
          }}
        >
          <div>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} items
          </div>
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #3a4459",
                backgroundColor: currentPage === 1 ? "#1e2738" : "#232a36",
                color: currentPage === 1 ? "#f7f9fb40" : "#f7f9fb",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "11px"
              }}
            >
              Previous
            </button>
            
            <span style={{ padding: "4px 8px", color: "#f7f9fb" }}>
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #3a4459",
                backgroundColor: currentPage === totalPages ? "#1e2738" : "#232a36",
                color: currentPage === totalPages ? "#f7f9fb40" : "#f7f9fb",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "11px"
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ItemLevelAnalyzer; 