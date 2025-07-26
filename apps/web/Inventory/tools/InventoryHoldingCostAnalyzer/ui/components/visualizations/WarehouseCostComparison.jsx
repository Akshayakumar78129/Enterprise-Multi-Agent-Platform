import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const WarehouseCostComparison = ({
  data = [],
  isLoading = false,
  width = 680,
  height = 400,
  onWarehouseSelect,
  onSortChange
}) => {
  const [sortBy, setSortBy] = useState('total_cost');
  const [showComponents, setShowComponents] = useState(true);
  const [showPercentage, setShowPercentage] = useState(true);
  const [viewType, setViewType] = useState('absolute');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState('all');

  // Enterprise IQ colors
  const colors = {
    capital: '#00e0ff',      // Electric Cyan
    storage: '#3e7b97',      // Blue-gray
    risk: '#ffc145',         // Amber
    opportunity: '#e930ff',  // Signal Magenta
    background: '#232a36',   // Graphite
    text: '#f7f9fb',        // Cloud White
    grid: '#3a4459',        // Light Graphite
    target: '#5fd4d6'       // Lighter cyan for target line
  };

  const Card = ({ title, subtitle, children, isLoading: cardLoading }) => (
    <div style={{
      backgroundColor: colors.background,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.grid}`,
      position: 'relative'
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

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    if (warehouseTypeFilter !== 'all') {
      filtered = data.filter(w => w.warehouse_type === warehouseTypeFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'total_cost':
          return b.total_cost - a.total_cost;
        case 'cost_percentage':
          return b.cost_percentage - a.cost_percentage;
        case 'cost_per_item':
          return b.cost_per_item - a.cost_per_item;
        case 'warehouse_name':
          return a.warehouse_name.localeCompare(b.warehouse_name);
        default:
          return 0;
      }
    });
  }, [data, sortBy, warehouseTypeFilter]);

  const chartData = useMemo(() => {
    // Validate data structure and ensure arrays are properly defined
    if (!filteredAndSortedData || !Array.isArray(filteredAndSortedData) || filteredAndSortedData.length === 0) {
      return [];
    }

    // Validate each warehouse data point has required properties
    const validData = filteredAndSortedData.filter(w => 
      w && 
      typeof w === 'object' && 
      w.warehouse_name !== undefined &&
      w.total_cost !== undefined &&
      w.cost_percentage !== undefined &&
      w.capital_cost !== undefined &&
      w.storage_cost !== undefined &&
      w.risk_cost !== undefined &&
      w.opportunity_cost !== undefined &&
      w.item_count !== undefined &&
      w.item_count > 0 // Prevent division by zero
    );

    if (validData.length === 0) {
      return [];
    }

    const traces = [];
    const warehouseNames = validData.map(w => w.warehouse_name || 'Unknown');

    if (showComponents) {
      // Stacked component bars
      traces.push({
        x: warehouseNames,
        y: validData.map(w => {
          const value = viewType === 'normalized' ? 
            (Number(w.capital_cost) || 0) / (Number(w.item_count) || 1) : 
            (Number(w.capital_cost) || 0);
          return value;
        }),
        name: 'Capital Cost',
        type: 'bar',
        marker: { color: colors.capital },
        hovertemplate: '<b>Capital Cost</b><br>Warehouse: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: warehouseNames,
        y: validData.map(w => {
          const value = viewType === 'normalized' ? 
            (Number(w.storage_cost) || 0) / (Number(w.item_count) || 1) : 
            (Number(w.storage_cost) || 0);
          return value;
        }),
        name: 'Storage Cost',
        type: 'bar',
        marker: { color: colors.storage },
        hovertemplate: '<b>Storage Cost</b><br>Warehouse: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: warehouseNames,
        y: validData.map(w => {
          const value = viewType === 'normalized' ? 
            (Number(w.risk_cost) || 0) / (Number(w.item_count) || 1) : 
            (Number(w.risk_cost) || 0);
          return value;
        }),
        name: 'Risk Cost',
        type: 'bar',
        marker: { color: colors.risk },
        hovertemplate: '<b>Risk Cost</b><br>Warehouse: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: warehouseNames,
        y: validData.map(w => {
          const value = viewType === 'normalized' ? 
            (Number(w.opportunity_cost) || 0) / (Number(w.item_count) || 1) : 
            (Number(w.opportunity_cost) || 0);
          return value;
        }),
        name: 'Opportunity Cost',
        type: 'bar',
        marker: { color: colors.opportunity },
        hovertemplate: '<b>Opportunity Cost</b><br>Warehouse: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });
    } else {
      // Total cost bars
      traces.push({
        x: warehouseNames,
        y: validData.map(w => {
          const value = viewType === 'normalized' ? 
            (Number(w.total_cost) || 0) / (Number(w.item_count) || 1) : 
            (Number(w.total_cost) || 0);
          return value;
        }),
        name: 'Total Holding Cost',
        type: 'bar',
        marker: { color: colors.capital },
        hovertemplate: '<b>Total Cost</b><br>Warehouse: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });
    }

    if (showPercentage) {
      // Cost percentage line
      traces.push({
        x: warehouseNames,
        y: validData.map(w => (Number(w.cost_percentage) || 0) * 100),
        name: 'Cost Percentage',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y2',
        line: { color: colors.target, width: 3 },
        marker: { color: colors.target, size: 8 },
        hovertemplate: '<b>Cost Percentage</b><br>Warehouse: %{x}<br>Percentage: %{y:.1f}%<extra></extra>'
      });
    }

    return traces;
  }, [filteredAndSortedData, showComponents, showPercentage, viewType, colors]);

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: colors.text, family: 'Inter, sans-serif' },
    margin: { l: 80, r: 240, t: 40, b: 100 },
    barmode: showComponents ? 'stack' : 'group',
    xaxis: {
      title: { text: 'Warehouse' },
      gridcolor: `${colors.grid}33`,
      showgrid: false,
      color: colors.text,
      tickangle: -45
    },
    yaxis: {
      title: { text: viewType === 'normalized' ? 'Cost per Item ($)' : 'Total Holding Cost ($)' },
      gridcolor: `${colors.grid}33`,
      showgrid: true,
      zeroline: false,
      color: colors.text,
      tickformat: ',.0f'
    },
    yaxis2: showPercentage ? {
      title: { text: 'Cost Percentage (%)' },
      overlaying: 'y',
      side: 'right',
      color: colors.text,
      tickformat: '.1f',
      showgrid: false
    } : undefined,
    legend: {
      x: 1.25,
      y: 0.5,
      xanchor: 'left',
      yanchor: 'middle',
      bgcolor: 'transparent',
      font: { color: colors.text }
    },
    hoverlabel: {
      bgcolor: colors.background,
      bordercolor: colors.grid,
      font: { color: colors.text, family: 'Inter, sans-serif' }
    },
    hovermode: 'x unified'
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    onSortChange?.(newSortBy);
  };

  const renderControls = () => (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Sort Controls */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <label style={{ color: colors.text, fontSize: '12px', marginRight: '8px' }}>
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          style={{
            padding: '6px 8px',
            borderRadius: '4px',
            border: `1px solid ${colors.grid}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '12px'
          }}
        >
          <option value="total_cost">Total Cost</option>
          <option value="cost_percentage">Cost Percentage</option>
          <option value="cost_per_item">Cost per Item</option>
          <option value="warehouse_name">Warehouse Name</option>
        </select>
      </div>

      {/* View Type Toggle */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {['absolute', 'normalized'].map((type) => (
          <button
            key={type}
            onClick={() => setViewType(type)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewType === type ? colors.capital : 'transparent',
              color: viewType === type ? '#0a1224' : colors.text,
              border: `1px solid ${viewType === type ? colors.capital : colors.grid}`
            }}
          >
            {type === 'absolute' ? 'Absolute' : 'Per Item'}
          </button>
        ))}
      </div>

      {/* Warehouse Type Filter */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <label style={{ color: colors.text, fontSize: '12px' }}>
          Type:
        </label>
        <select
          value={warehouseTypeFilter}
          onChange={(e) => setWarehouseTypeFilter(e.target.value)}
          style={{
            padding: '6px 8px',
            borderRadius: '4px',
            border: `1px solid ${colors.grid}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '12px'
          }}
        >
          <option value="all">All Types</option>
          <option value="Standard">Standard</option>
          <option value="Special">Special</option>
        </select>
      </div>

      {/* Toggle Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: colors.text,
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={showComponents}
            onChange={(e) => setShowComponents(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show Components
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: colors.text,
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={showPercentage}
            onChange={(e) => setShowPercentage(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show Percentage
        </label>
      </div>
    </div>
  );

  const renderWarehouseDetails = () => {
    if (!selectedWarehouse) return null;

    const warehouse = selectedWarehouse;
    return (
      <div style={{
        backgroundColor: colors.background,
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        border: `1px solid ${colors.grid}`
      }}>
        <h4 style={{
          color: colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          margin: '0 0 12px 0'
        }}>
          {warehouse.warehouse_name} Details
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Total Cost
            </div>
            <div style={{
              color: colors.capital,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${warehouse.total_cost.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Cost Percentage
            </div>
            <div style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {(warehouse.cost_percentage * 100).toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Cost per Item
            </div>
            <div style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${warehouse.cost_per_item.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Items
            </div>
            <div style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {warehouse.item_count.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Card title="Warehouse Cost Comparison" isLoading={true} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Warehouse Cost Comparison">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${height - 100}px`,
          color: colors.text,
          opacity: 0.7
        }}>
          No warehouse data available
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Warehouse Cost Comparison" 
      subtitle={`${filteredAndSortedData.length} warehouses analyzed`}
    >
      {renderControls()}
      
      <div style={{ width: '100%', marginBottom: '16px' }}>
        {chartData && chartData.length > 0 ? (
          <Plot
            data={chartData}
            layout={{
              ...layout,
              width: width - 48,
              height: height - 160
            }}
            config={{
              displayModeBar: false,
              responsive: true,
              staticPlot: false
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            onClick={(event) => {
              try {
                if (event && event.points && event.points[0]) {
                  const warehouseName = event.points[0].x;
                  const warehouse = filteredAndSortedData.find(w => w.warehouse_name === warehouseName);
                  if (warehouse) {
                    setSelectedWarehouse(warehouse);
                    onWarehouseSelect?.(warehouse);
                  }
                }
              } catch (error) {
                console.warn('Error handling chart click:', error);
              }
            }}
            onError={(error) => {
              console.warn('Plotly chart error:', error);
            }}
            onInitialized={(figure, graphDiv) => {
              // Ensure hover layer is properly initialized
              if (graphDiv && graphDiv._fullLayout) {
                try {
                  // Initialize hover layer if it doesn't exist
                  if (!graphDiv._fullLayout._hoverlayer) {
                    const hoverLayer = document.createElement('g');
                    hoverLayer.className = 'hoverlayer';
                    if (graphDiv.querySelector('.plot .plotbg')) {
                      graphDiv.querySelector('.plot .plotbg').appendChild(hoverLayer);
                      graphDiv._fullLayout._hoverlayer = hoverLayer;
                    }
                  }
                } catch (hoverError) {
                  console.warn('Error initializing hover layer:', hoverError);
                }
              }
            }}
            onUpdate={(figure, graphDiv) => {
              // Ensure hover layer persists after updates
              if (graphDiv && graphDiv._fullLayout && !graphDiv._fullLayout._hoverlayer) {
                try {
                  const hoverLayer = document.createElement('g');
                  hoverLayer.className = 'hoverlayer';
                  if (graphDiv.querySelector('.plot .plotbg')) {
                    graphDiv.querySelector('.plot .plotbg').appendChild(hoverLayer);
                    graphDiv._fullLayout._hoverlayer = hoverLayer;
                  }
                } catch (hoverError) {
                  console.warn('Error maintaining hover layer:', hoverError);
                }
              }
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: height - 160,
            color: colors.text,
            opacity: 0.7
          }}>
            No chart data available
          </div>
        )}
      </div>
      
      {renderWarehouseDetails()}
    </Card>
  );
};

export default WarehouseCostComparison; 