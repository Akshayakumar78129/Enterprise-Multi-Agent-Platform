import React, { useState, useMemo } from "react";
import { ExcessiveCostGridProps, ExcessiveItem } from "../../types";

const ExcessiveCostGrid: React.FC<ExcessiveCostGridProps> = ({
  data,
  isLoading = false,
  threshold = 0.3,
  onThresholdChange,
  onItemSelect,
  selectedItem,
  sortBy = 'cost',
  onSortChange,
  groupBy = 'category',
  onGroupByChange,
  width = 740,
  height = 460
}) => {
  const [hoveredItem, setHoveredItem] = useState<ExcessiveItem | null>(null);

  // Enterprise IQ color scheme
  const colors = {
    normal: '#00e0ff',      // Electric Cyan (< 20%)
    moderate: '#5fd4d6',    // Lighter cyan (20-25%)
    high: '#ffc145',        // Amber (25-30%)
    excessive: '#e930ff',   // Signal Magenta (30%+)
    background: '#0a1224',  // Midnight Navy
    cardBackground: '#232a36', // Graphite
    text: '#f7f9fb',       // Cloud White
    border: '#3a4459'      // Light Graphite
  };

  const Card = ({ title, subtitle, children, isLoading: cardLoading, style }: any) => (
    <div style={{
      backgroundColor: colors.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      position: 'relative',
      ...style
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          color: colors.text,
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            color: colors.text,
            fontSize: '12px',
            opacity: 0.7,
            margin: 0
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {cardLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: colors.text,
          opacity: 0.7
        }}>
          Loading...
        </div>
      ) : children}
    </div>
  );

  // Process and sort the data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let sortedData = [...data];

    // Apply sorting
    switch (sortBy) {
      case 'cost':
        sortedData.sort((a, b) => b.Total_Holding_Cost - a.Total_Holding_Cost);
        break;
      case 'percentage':
        sortedData.sort((a, b) => b.Holding_Cost_Percentage - a.Holding_Cost_Percentage);
        break;
      case 'savings':
        sortedData.sort((a, b) => b.Potential_Savings - a.Potential_Savings);
        break;
      case 'value':
        sortedData.sort((a, b) => b.Average_Inventory_Value - a.Average_Inventory_Value);
        break;
    }

    return sortedData;
  }, [data, sortBy]);

  // Group data for grid layout
  const groupedData = useMemo(() => {
    if (!processedData.length) return {};

    return processedData.reduce((groups, item) => {
      let key: string;
      switch (groupBy) {
        case 'category':
          key = item.Item_Category;
          break;
        case 'warehouse':
          key = item.Warehouse_Name;
          break;
        case 'component':
          // Determine primary cost component
          const costs = {
            'Capital': item.Annual_Holding_Cost,
            'Opportunity': item.Annual_Opportunity_Cost,
            'Storage': item.Annual_Storage_Cost,
            'Risk': item.Annual_Risk_Cost
          };
          key = Object.entries(costs).sort(([,a], [,b]) => b - a)[0][0];
          break;
        default:
          key = 'All Items';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, ExcessiveItem[]>);
  }, [processedData, groupBy]);

  const getItemColor = (percentage: number) => {
    if (percentage >= threshold) return colors.excessive;
    if (percentage >= 0.25) return colors.high;
    if (percentage >= 0.20) return colors.moderate;
    return colors.normal;
  };

  const getItemSize = (inventoryValue: number, maxValue: number) => {
    const minSize = 30;
    const maxSize = 80;
    const ratio = inventoryValue / maxValue;
    return minSize + (maxSize - minSize) * ratio;
  };

  const handleItemClick = (item: ExcessiveItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  const renderFilterControls = () => (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: colors.cardBackground,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    }}>
      {/* Threshold slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ color: colors.text, fontSize: '12px', minWidth: '60px' }}>
          Threshold:
        </label>
        <input
          type="range"
          min="0.2"
          max="0.4"
          step="0.01"
          value={threshold}
          onChange={(e) => onThresholdChange?.(parseFloat(e.target.value))}
          style={{ width: '80px' }}
        />
        <span style={{ color: colors.text, fontSize: '12px', minWidth: '40px' }}>
          {Math.round(threshold * 100)}%
        </span>
      </div>

      {/* Sort by dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ color: colors.text, fontSize: '12px' }}>Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value)}
          style={{
            backgroundColor: colors.border,
            color: colors.text,
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px'
          }}
        >
          <option value="cost">Total Cost</option>
          <option value="percentage">Cost %</option>
          <option value="savings">Potential Savings</option>
          <option value="value">Inventory Value</option>
        </select>
      </div>

      {/* Group by dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ color: colors.text, fontSize: '12px' }}>Group by:</label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange?.(e.target.value)}
          style={{
            backgroundColor: colors.border,
            color: colors.text,
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px'
          }}
        >
          <option value="category">Category</option>
          <option value="warehouse">Warehouse</option>
          <option value="component">Cost Component</option>
        </select>
      </div>

      {/* Statistics */}
      <div style={{ marginLeft: 'auto', color: colors.text, fontSize: '12px' }}>
        {processedData.length} items exceeding {Math.round(threshold * 100)}% threshold
      </div>
    </div>
  );

  const renderGrid = () => {
    if (!processedData.length) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: colors.text,
          opacity: 0.6
        }}>
          No items exceed the current threshold
        </div>
      );
    }

    const maxValue = Math.max(...processedData.map(item => item.Average_Inventory_Value));

    return (
      <div style={{ 
        height: `${height - 120}px`, 
        overflow: 'auto',
        padding: '8px'
      }}>
        {Object.entries(groupedData).map(([groupName, items]) => (
          <div key={groupName} style={{ marginBottom: '24px' }}>
            <h4 style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              borderBottom: `1px solid ${colors.border}`,
              paddingBottom: '4px'
            }}>
              {groupName} ({items.length} items)
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: '4px',
              padding: '8px'
            }}>
              {items.map((item, index) => {
                const size = getItemSize(item.Average_Inventory_Value, maxValue);
                const color = getItemColor(item.Holding_Cost_Percentage);
                const isSelected = selectedItem?.Item_Key === item.Item_Key;
                const isHovered = hoveredItem?.Item_Key === item.Item_Key;

                return (
                  <div
                    key={`${groupName}-${item.Item_Key}-${index}`}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: colors.background,
                      border: isSelected ? `2px solid ${colors.text}` : 'none',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    title={`${item.Item_Name} - ${(item.Holding_Cost_Percentage * 100).toFixed(1)}%`}
                  >
                    <div style={{
                      textAlign: 'center',
                      lineHeight: '1.2',
                      padding: '2px'
                    }}>
                      <div style={{ fontSize: '8px' }}>{item.Item_Number}</div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                        {(item.Holding_Cost_Percentage * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailPanel = () => {
    const itemToShow = selectedItem || hoveredItem;
    
    if (!itemToShow) {
      return (
        <div style={{
          color: colors.text,
          opacity: 0.6,
          textAlign: 'center',
          marginTop: '20px'
        }}>
          Select or hover over an item to see details
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: colors.cardBackground,
        borderRadius: '8px',
        padding: '12px',
        marginTop: '16px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{
          color: colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          {itemToShow.Item_Name}
        </h4>
        
        <div style={{ color: colors.text, fontSize: '12px', lineHeight: '1.4' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <strong>Item #:</strong> {itemToShow.Item_Number}
            </div>
            <div>
              <strong>Category:</strong> {itemToShow.Item_Category}
            </div>
            <div>
              <strong>Warehouse:</strong> {itemToShow.Warehouse_Name}
            </div>
            <div>
              <strong>Severity:</strong> 
              <span style={{ 
                color: itemToShow.Severity === 'High' ? colors.excessive : 
                       itemToShow.Severity === 'Medium' ? colors.high : colors.moderate,
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                {itemToShow.Severity}
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Inventory Value:</strong> ${itemToShow.Average_Inventory_Value.toLocaleString()}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Holding Cost:</strong> ${itemToShow.Total_Holding_Cost.toLocaleString()} 
              ({(itemToShow.Holding_Cost_Percentage * 100).toFixed(1)}%)
            </div>
            <div style={{ color: colors.excessive, fontWeight: 'bold' }}>
              <strong>Potential Savings:</strong> ${itemToShow.Potential_Savings.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card 
        title="Excessive Cost Analysis" 
        isLoading={true}
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div style={{ height: `${height}px` }} />
      </Card>
    );
  }

  return (
    <Card 
      title="Excessive Cost Items"
      subtitle={`Items with holding costs above threshold`}
      style={{ backgroundColor: colors.cardBackground }}
    >
      <div style={{ height: `${height}px` }}>
        {renderFilterControls()}
        
        <div style={{ display: 'flex', height: `${height - 80}px` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {renderGrid()}
          </div>
          
          <div style={{ width: '240px', marginLeft: '16px', overflow: 'auto' }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px',
              fontSize: '10px'
            }}>
              {[
                { color: colors.normal, label: 'Normal (<20%)' },
                { color: colors.moderate, label: 'Moderate (20-25%)' },
                { color: colors.high, label: 'High (25-30%)' },
                { color: colors.excessive, label: 'Excessive (30%+)' }
              ].map((legend, index) => (
                <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: legend.color, 
                    borderRadius: '2px' 
                  }} />
                  <span style={{ color: colors.text }}>{legend.label}</span>
                </div>
              ))}
            </div>
            
            {renderDetailPanel()}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExcessiveCostGrid; 