'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatTurnoverRatio, formatNumber } from '../../utils/formatters';
import DataTooltip from '../common/DataTooltip';
import { contextManager } from '../../utils/contextManager';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  daysSinceLastSale: number;
  turnoverRate: number;
  daysOfSupply: number;
  status: 'Very Fast' | 'Fast' | 'Moderate' | 'Slow' | 'Critical' | 'Aged' | 'Good' | '';
  // flags
  isCritical?: boolean;
  isAged?: boolean;
  isSlow?: boolean;
  isGood?: boolean;
  isModerate?: boolean;
  isFast?: boolean;
  isVeryFast?: boolean;
}

interface ItemLevelAnalyzerProps {
  onItemSelect?: (item: InventoryItem) => void;
  onActionTaken?: (itemId: string, action: string) => void;
  data?: any[];
  activeCategory?: string;
  activeWarehouse?: string;
}

const ItemLevelAnalyzer: React.FC<ItemLevelAnalyzerProps> = ({
  onItemSelect,
  onActionTaken,
  data,
  activeCategory,
  activeWarehouse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(activeCategory || 'All');
  const [selectedWarehouse, setSelectedWarehouse] = useState(activeWarehouse || 'All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortColumn, setSortColumn] = useState('totalValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // Internal fallback rows when parent didn't provide `data` yet (shows on refresh)
  const [internalRows, setInternalRows] = useState<any[] | null>(null);
  const [isFetchingFallback, setIsFetchingFallback] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Batch selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    data: null as any,
    position: { x: 0, y: 0 }
  });

  // Transform data to match spec requirements
  const inventoryItems: InventoryItem[] = useMemo(() => {
    const source = Array.isArray(data) && data.length > 0 ? data : (Array.isArray(internalRows) && internalRows.length > 0 ? internalRows : []);
    if (!Array.isArray(source) || source.length === 0) return [];

    return source.map((item, index) => {
      const daysValue = item.Days_Since_Last_Movement || 0;
      const turnoverValue = item.Estimated_Turnover_Ratio || 0;
      const inventoryValue = item.Current_Inventory_Value || ((item.Current_Stock || 0) * (item.Unit_Cost || 0));
      
      // Compute daysOfSupply from turnover so server/client agree
      const daysOfSupplyComputed = turnoverValue > 0 ? Math.round(365 / turnoverValue) : 9999;

  // Compute primary (exclusive) status using the same turnover bands as the
  // TurnoverAnalysisMatrix so item-level statuses match the matrix.
  // Matrix bands:
  //   >6.0 => 'Very Fast'
  //   >=3.0 => 'Fast'
  //   >=1.0 => 'Moderate'
  //   >=0.5 => 'Slow'
  //   <0.5 => 'Critical'
  let primaryStatusRaw = '';
  if (turnoverValue > 6.0) primaryStatusRaw = 'Very Fast';
  else if (turnoverValue >= 3.0) primaryStatusRaw = 'Fast';
  else if (turnoverValue >= 1.0) primaryStatusRaw = 'Moderate';
  else if (turnoverValue >= 0.5) primaryStatusRaw = 'Slow';
  else primaryStatusRaw = 'Critical';

  // Independent aged flag
  const isAged = daysOfSupplyComputed >= 180;

  // Exclusive turnover-based flags
  const isCritical = primaryStatusRaw === 'Critical';
  const isSlow = primaryStatusRaw === 'Slow';
  const isModerate = primaryStatusRaw === 'Moderate';
  const isFast = primaryStatusRaw === 'Fast';
  const isVeryFast = primaryStatusRaw === 'Very Fast';
  const isGood = isModerate || isFast || isVeryFast;

      return {
        id: `item-${index}-${item.Item_Key || item.Item_Number || index}`,
        sku: item.Item_Number || 'N/A',
        name: item.Item_Name || 'Unknown Item',
        category: item.Item_Category || 'Unknown',
        warehouse: item.Warehouse_Name || item.Warehouse_ID || 'Unknown',
        quantity: item.Current_Stock || 0,
        unitCost: item.Unit_Cost || 0,
        totalValue: inventoryValue,
        daysSinceLastSale: daysValue,
        turnoverRate: turnoverValue,
        daysOfSupply: daysOfSupplyComputed,
  status: primaryStatusRaw as any,
  // flags
  isCritical,
  isAged,
  isSlow,
  isGood,
  isModerate,
  isFast,
  isVeryFast
      } as any;
    });
  }, [data, internalRows]);

  // Fetch fallback item rows on mount if parent didn't provide `data` yet
  useEffect(() => {
    let cancelled = false;
    const shouldFetch = (!Array.isArray(data) || data.length === 0) && (!Array.isArray(internalRows) || internalRows.length === 0) && !isFetchingFallback;
    if (!shouldFetch) return;
    setIsFetchingFallback(true);
    (async () => {
      try {
        const res = await fetch('/api/slow-moving-analyzer/data');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        const rows = (json?.data?.itemLevelData && json.data.itemLevelData.length) ? json.data.itemLevelData : (json?.data?.slowMovingItems && json.data.slowMovingItems.length ? json.data.slowMovingItems : (json?.data?.merged && json.data.merged.length ? json.data.merged : []));
        if (!cancelled) setInternalRows(rows || []);
      } catch (e) {
        console.warn('ItemLevelAnalyzer: fallback fetch failed', e && e.message);
      } finally {
        if (!cancelled) setIsFetchingFallback(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data, internalRows, isFetchingFallback]);

  // Get unique filter options from data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(item => item.category))).sort();
    return ['All', ...cats];
  }, [inventoryItems]);

  const warehouses = useMemo(() => {
    const whs = Array.from(new Set(inventoryItems.map(item => item.warehouse))).sort();
    return ['All', ...whs];
  }, [inventoryItems]);

  const statuses = useMemo(() => {
    // Show the matrix scale (ordering chosen to match the legend/UI)
    return ['All', 'Critical', 'Slow', 'Moderate', 'Fast', 'Very Fast', 'Aged'];
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...inventoryItems]; // Create a copy to avoid mutation
    
    // Apply search filter
    if (searchTerm && searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) || 
        item.sku.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply warehouse filter
    if (selectedWarehouse && selectedWarehouse !== 'All') {
      filtered = filtered.filter(item => item.warehouse === selectedWarehouse);
    }

    // Apply status filter: if the user chose 'Aged' we filter by the aged flag.
    // Otherwise we filter by the exclusive matrix label stored in `status`.
    if (selectedStatus && selectedStatus !== 'All') {
      if (selectedStatus === 'Aged') {
        filtered = filtered.filter(item => Boolean((item as any).isAged));
      } else {
        filtered = filtered.filter(item => String(item.status) === selectedStatus);
      }
    }

    // Sort data
    filtered.sort((a, b) => {
      const aVal = a[sortColumn as keyof InventoryItem];
      const bVal = b[sortColumn as keyof InventoryItem];
      
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [inventoryItems, searchTerm, selectedCategory, selectedWarehouse, selectedStatus, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedWarehouse, selectedStatus]);

  // Generate contextual tooltip data for items
  const getItemTooltipData = (item: InventoryItem) => {
    let status: 'critical' | 'warning' | 'good' = 'good';
    let insight = '';

    // Prefer turnover-based (matrix) status for primary insight. If item is aged
    // but not turnover-critical, surface aging as the recommended action.
    if (item.status === 'Critical') {
      status = 'critical';
      insight = 'Urgent action needed - Consider liquidation or deep discounts';
    } else if (item.status === 'Slow') {
      status = 'warning';
      insight = 'Slow-moving - Monitor and optimize replenishment';
    } else if ((item as any).isAged) {
      status = 'warning';
      insight = 'Aging inventory - Implement promotion strategies';
    } else {
      status = 'good';
      insight = 'Healthy inventory - Maintain current strategy';
    }

    return {
      title: `${item.name} (${item.sku})`,
      items: [
        { label: 'Category', value: item.category, type: 'primary' as const },
        { label: 'Warehouse', value: item.warehouse, type: 'secondary' as const },
        { label: 'Quantity', value: formatNumber(item.quantity), type: 'metric' as const },
        { label: 'Unit Cost', value: formatCurrency(item.unitCost), type: 'secondary' as const },
        { label: 'Total Value', value: formatCurrency(item.totalValue), type: 'metric' as const },
        { label: 'Days Since Sale', value: `${item.daysSinceLastSale}d`, type: 'secondary' as const },
        { label: 'Turnover Ratio', value: formatTurnoverRatio(item.turnoverRate), type: 'metric' as const },
        { label: 'Days Supply', value: `${item.daysOfSupply}d`, type: 'secondary' as const }
      ],
      insight,
      status
    };
  };

  // Handle item row hover
  const handleItemRowEnter = (event: React.MouseEvent, item: InventoryItem) => {
    const tooltipData = getItemTooltipData(item);
    setTooltip({
      visible: true,
      data: tooltipData,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  // Handle item row click for context collection
  const handleItemRowClick = (event: React.MouseEvent, item: InventoryItem) => {
    if (event.shiftKey) {
      console.log('🎯 Left Shift + Click detected on item row:', item.name);
      
      const tooltipData = getItemTooltipData(item);
      contextManager.addContext({
        title: `${item.name} (${item.sku})`,
        type: 'data-point',
        content: tooltipData,
        source: 'Item-Level Analyzer'
      });
      
      // Hide tooltip and provide visual feedback
      setTooltip(prev => ({ ...prev, visible: false }));
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.98)';
      target.style.backgroundColor = '#00e0ff20';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
        target.style.backgroundColor = '';
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        position: { x: event.clientX, y: event.clientY }
      }));
    }
  };

  // Reset selection when filters change
  useEffect(() => {
    setSelectedItems(new Set());
    setIsSelectAllChecked(false);
  }, [searchTerm, selectedCategory, selectedWarehouse, selectedStatus]);

  // Sync external filters from parent dashboard (if provided)
  useEffect(() => {
    if (typeof activeCategory === 'string') setSelectedCategory(activeCategory || 'All');
  }, [activeCategory]);

  useEffect(() => {
    if (typeof activeWarehouse === 'string') setSelectedWarehouse(activeWarehouse || 'All');
  }, [activeWarehouse]);

  // Batch selection functions
  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      setSelectedItems(new Set());
      setIsSelectAllChecked(false);
    } else {
      const allIds = new Set(paginatedData.map(item => item.id));
      setSelectedItems(allIds);
      setIsSelectAllChecked(true);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setIsSelectAllChecked(newSelected.size === paginatedData.length && paginatedData.length > 0);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Status colors mapped to the matrix bands
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Very Fast': return '#00e0ff';
      case 'Fast': return '#5fd4d6';
      case 'Moderate': return '#ffc145';
      case 'Slow': return '#d45d79';
      case 'Critical': return '#e930ff';
      case 'Aged': return '#ffc145';
      default: return '#6b7280';
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Warehouse', 'Current Stock', 'Turnover Ratio', 'Days of Supply', 'Inventory Value', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => {
  const statusParts = [(item as any).status];
  if ((item as any).isAged && String((item as any).status) !== 'Aged') statusParts.push('Aged');
  const statusCol = `"${statusParts.filter(Boolean).join(',')}`.replace(/,$/, '') + '"';
        return [
          `"${item.sku}"`,
          `"${item.name}"`,
          `"${item.category}"`,
          `"${item.warehouse}"`,
          item.quantity,
          formatNumber(item.turnoverRate),
          item.daysOfSupply,
          formatNumber(item.totalValue),
          statusCol
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item-level-analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSelectedCSV = () => {
    if (selectedItems.size === 0) return;
    
    const headers = ['SKU', 'Item Name', 'Category', 'Warehouse', 'Current Stock', 'Turnover Ratio', 'Days of Supply', 'Inventory Value', 'Status'];
    
    // Get selected items from filteredData
    const selectedData = filteredData.filter(item => selectedItems.has(item.id));
    
    const csvContent = [
      headers.join(','),
      ...selectedData.map(item => {
  const statusParts = [(item as any).status];
  if ((item as any).isAged && String((item as any).status) !== 'Aged') statusParts.push('Aged');
  const statusCol = `"${statusParts.filter(Boolean).join(',')}`.replace(/,$/, '') + '"';
        return [
          `"${item.sku}"`,
          `"${item.name}"`,
          `"${item.category}"`,
          `"${item.warehouse}"`,
          item.quantity,
          formatNumber(item.turnoverRate),
          item.daysOfSupply,
          formatNumber(item.totalValue),
          statusCol
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-items-analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="relative z-10"
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: '760px',
        height: '500px',
        backgroundColor: '#232a36',
        borderRadius: '16px',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#00e0ff' }}>Item-Level Analysis</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#f7f9fb80' }}>Detailed inventory analysis by item</p>
        </div>
      </div>

      {/* Simple Controls */}
      <div style={{
        marginBottom: '12px',
        padding: '12px',
        backgroundColor: '#232a36',
        borderRadius: '12px',
        border: '1px solid #3a4459',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 600 }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#1e2738',
                color: '#f7f9fb',
                fontSize: '12px',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 600 }}>Warehouse:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#1e2738',
                color: '#f7f9fb',
                fontSize: '12px',
                outline: 'none',
                minWidth: '120px'
              }}
            >
              {warehouses.map(wh => (
                <option key={wh} value={wh}>{wh}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 600 }}>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#1e2738',
                color: '#f7f9fb',
                fontSize: '12px',
                outline: 'none',
                minWidth: '100px'
              }}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and Export Section */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search SKU, name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#1e2738',
              color: '#f7f9fb',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#1e2738',
              color: '#f7f9fb',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Export All
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1e2738', borderRadius: '12px', border: '1px solid #3a4459' }}>
        {/* Summary Bar */}
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#232a36', 
          borderBottom: '1px solid #3a4459',
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          color: '#f7f9fb',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <span style={{ color: getStatusColor('Critical'), fontWeight: 700 }}>
                {filteredData.filter(item => String(item.status) === 'Critical').length}
              </span> Critical
            </div>
            <div>
              <span style={{ color: getStatusColor('Slow'), fontWeight: 700 }}>
                {filteredData.filter(item => String(item.status) === 'Slow').length}
              </span> Slow
            </div>
            <div>
              <span style={{ color: getStatusColor('Moderate'), fontWeight: 700 }}>
                {filteredData.filter(item => String(item.status) === 'Moderate').length}
              </span> Moderate
            </div>
            <div>
              <span style={{ color: getStatusColor('Fast'), fontWeight: 700 }}>
                {filteredData.filter(item => String(item.status) === 'Fast').length}
              </span> Fast
            </div>
            <div>
              <span style={{ color: getStatusColor('Very Fast'), fontWeight: 700 }}>
                {filteredData.filter(item => String(item.status) === 'Very Fast').length}
              </span> Very Fast
            </div>
            {/* Aged moved to the right side (next to Total) and will use muted color */}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ color: '#f7f9fb80' }}>
              {`Aged : ${filteredData.filter(item => (item as any).isAged).length} items`}
            </div>
            <div style={{ color: '#f7f9fb80' }}>
              Total: {inventoryItems.length} items
            </div>
          </div>
        </div>

        {/* Batch Action Controls */}
        {selectedItems.size > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: '#232a36',
            borderRadius: '8px',
            border: '1px solid #3a4459',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 600 }}>
                {selectedItems.size} item{selectedItems.size === 1 ? '' : 's'} selected
              </span>
              <button
                onClick={() => {
                  setSelectedItems(new Set());
                  setIsSelectAllChecked(false);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#1e2738',
                  color: '#f7f9fb',
                  fontSize: '11px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Clear Selection
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => exportSelectedCSV()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #00e0ff',
                  backgroundColor: '#00e0ff',
                  color: '#0a1224',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Export Selected
              </button>
            </div>
          </div>
        )}

        {/* Table Header */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#1e2738',
            padding: '10px 8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#f7f9fb',
            borderBottom: '1px solid #3a4459',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}
        >
          {/* Checkbox column header */}
          <div style={{
            width: '40px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <input
              type="checkbox"
              checked={isSelectAllChecked}
              onChange={handleSelectAll}
              style={{
                cursor: 'pointer',
                accentColor: '#00e0ff'
              }}
            />
          </div>
          
          {[
            { key: 'sku', label: 'SKU', flex: 1 },
            { key: 'name', label: 'Item Name', flex: 2 },
            { key: 'category', label: 'Category', flex: 1 },
            { key: 'warehouse', label: 'Warehouse', flex: 1 },
            { key: 'quantity', label: 'Current Stock', flex: 1 },
            { key: 'turnoverRate', label: 'Turnover Ratio', flex: 1 },
            { key: 'daysOfSupply', label: 'Days of Supply', flex: 1 },
            { key: 'totalValue', label: 'Inventory Value', flex: 1 }
          ].concat(selectedStatus !== 'All' ? [{ key: 'status', label: 'Status', flex: 1 }] : []).map((col) => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{
                flex: col.flex,
                padding: '0 8px',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>{col.label}</span>
              {sortColumn === col.key && (
                <span style={{ color: '#00e0ff', fontSize: '10px' }}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div 
          key={`table-${selectedCategory}-${selectedWarehouse}-${searchTerm}`}
          style={{ flex: 1, overflow: 'auto' }}
        >
          {paginatedData.length > 0 ? paginatedData.map((item, index) => (
            <div
              key={`row-${index}-${item.id}`}
              style={{
                display: 'flex',
                padding: '10px 8px',
                backgroundColor: index % 2 === 0 ? '#1e2738' : '#232a36',
                borderBottom: '1px solid #3a4459',
                fontSize: '12px',
                color: '#f7f9fb',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                handleItemRowEnter(e, item);
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2a3441';
              }}
              onMouseLeave={(e) => {
                handleMouseLeave();
                (e.currentTarget as HTMLDivElement).style.backgroundColor = index % 2 === 0 ? '#1e2738' : '#232a36';
              }}
              onMouseMove={handleMouseMove}
              onClick={(e) => handleItemRowClick(e, item)}
              title={`Left Shift + Click to add "${item.name}" to AI context`}
            >
              {/* Checkbox column */}
              <div style={{
                width: '40px',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => handleItemSelect(item.id)}
                  style={{
                    cursor: 'pointer',
                    accentColor: '#00e0ff'
                  }}
                />
              </div>
              
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{item.sku}</div>
              <div style={{ 
                flex: 2, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
              </div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{item.category}</div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{item.warehouse}</div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{formatNumber(item.quantity)}</div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{formatTurnoverRatio(item.turnoverRate)}</div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{item.daysOfSupply}</div>
              <div style={{ 
                flex: 1, 
                padding: '0 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>{formatCurrency(item.totalValue)}</div>
              {selectedStatus !== 'All' && (
                <div style={{ 
                  flex: 1, 
                  padding: '0 8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0a1224',
                    backgroundColor: getStatusColor(item.status)
                  }}>
                    {item.status}
                  </span>
                </div>
              )}
            </div>
          )) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#f7f9fb80' }}>
              No items match the current filters.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #3a4459',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#f7f9fb'
          }}>
            {/* Items per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#1e2738',
                  color: '#f7f9fb',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} items
              </span>
            </div>

            {/* Page navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: currentPage === 1 ? '#1e2738' : '#232a36',
                  color: currentPage === 1 ? '#666' : '#f7f9fb',
                  fontSize: '12px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
              >
                First
              </button>
              
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: currentPage === 1 ? '#1e2738' : '#232a36',
                  color: currentPage === 1 ? '#666' : '#f7f9fb',
                  fontSize: '12px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
              >
                Previous
              </button>

              {/* Page numbers */}
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
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #3a4459',
                      backgroundColor: currentPage === pageNum ? '#00e0ff' : '#232a36',
                      color: currentPage === pageNum ? '#0a1224' : '#f7f9fb',
                      fontSize: '12px',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: currentPage === pageNum ? 600 : 400
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: currentPage === totalPages ? '#1e2738' : '#232a36',
                  color: currentPage === totalPages ? '#666' : '#f7f9fb',
                  fontSize: '12px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
              >
                Next
              </button>

              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: currentPage === totalPages ? '#1e2738' : '#232a36',
                  color: currentPage === totalPages ? '#666' : '#f7f9fb',
                  fontSize: '12px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <DataTooltip
          visible={tooltip.visible}
          data={tooltip.data}
          position={tooltip.position}
        />
      )}
    </div>
  );
};

export default ItemLevelAnalyzer;