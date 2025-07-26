import React, { useState, useEffect } from "react";
import { CostBreakdownVisualizationProps } from "../../types";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const CostBreakdownVisualization: React.FC<CostBreakdownVisualizationProps> = ({
  data,
  isLoading = false,
  viewType = 'component',
  onViewTypeChange,
  onSegmentClick,
  selectedSegment,
  width = 760,
  height = 480
}) => {
  const [plotData, setPlotData] = useState<any[]>([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null);

  // Enterprise IQ color scheme
  const colors = {
    capitalCost: '#00e0ff',     // Electric Cyan
    opportunityCost: '#e930ff',  // Signal Magenta
    storageCost: '#3e7b97',     // Blue-gray
    riskCost: '#ffc145',        // Amber
    background: '#0a1224',      // Midnight Navy
    cardBackground: '#232a36',   // Graphite
    text: '#f7f9fb',           // Cloud White
    border: '#3a4459'          // Light Graphite
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

  useEffect(() => {
    if (!data || isLoading) {
      setPlotData([]);
      setSelectedBreakdown(null);
      return;
    }

    // Validate data structure before generating plot data
    if (!data.byComponent && !data.byCategory && !data.byWarehouse) {
      console.warn('No valid data structure found in CostBreakdownVisualization:', data);
      setPlotData([]);
      setSelectedBreakdown(null);
      return;
    }

    try {
      generatePlotData();
    } catch (error) {
      console.error('Error generating plot data in CostBreakdownVisualization:', error);
      setPlotData([]);
      setSelectedBreakdown(null);
    }
  }, [data, viewType, isLoading]);

  const generatePlotData = () => {
    if (!data) return;

    let plotData: any[] = [];

    switch (viewType) {
      case 'component':
        plotData = createComponentSunburst();
        break;
      case 'category':
        plotData = createCategorySunburst();
        break;
      case 'warehouse':
        plotData = createWarehouseSunburst();
        break;
      default:
        plotData = createComponentSunburst();
    }

    setPlotData(plotData);
  };

  const createComponentSunburst = () => {
    // Validate data structure exists
    if (!data || !data.byComponent || !data.byCategory) {
      console.warn('Invalid data structure for component sunburst:', data);
      return [];
    }

    const componentData = data.byComponent;
    const categoryData = data.byCategory;

    // Validate componentData has expected structure and values
    const requiredComponents = ['Capital Cost', 'Storage Cost', 'Risk Cost', 'Opportunity Cost'];
    const missingComponents = requiredComponents.filter(comp => !(comp in componentData));
    if (missingComponents.length > 0) {
      console.warn('Missing component data:', missingComponents);
    }

    // Special validation for Storage Cost to prevent click errors
    if ('Storage Cost' in componentData) {
      const storageCostValue = componentData['Storage Cost'];
      if (typeof storageCostValue !== 'number' || isNaN(storageCostValue) || storageCostValue < 0) {
        console.warn('Invalid Storage Cost value detected:', storageCostValue, 'Setting to 0');
        componentData['Storage Cost'] = 0;
      }
    }

    // Create hierarchical data structure for sunburst
    const ids: string[] = [];
    const labels: string[] = [];
    const parents: string[] = [];
    const values: number[] = [];
    const colors_array: string[] = [];

    // Root
    ids.push('Total');
    labels.push('Total Holding Cost');
    parents.push('');
    values.push(Object.values(componentData).reduce((sum, val) => sum + val, 0));
    colors_array.push(colors.cardBackground);

    // Components (level 1)
    const componentColors = {
      'Capital Cost': colors.capitalCost,
      'Opportunity Cost': colors.opportunityCost,
      'Storage Cost': colors.storageCost,
      'Risk Cost': colors.riskCost
    };

    Object.entries(componentData).forEach(([component, value]) => {
      // Validate component data
      const safeValue = typeof value === 'number' && !isNaN(value) && value >= 0 ? value : 0;
      
      if (safeValue === 0) {
        console.warn(`Invalid or zero value for component ${component}:`, value);
      }

      ids.push(component);
      labels.push(component);
      parents.push('Total');
      values.push(safeValue);
      colors_array.push(componentColors[component as keyof typeof componentColors] || colors.text);
    });

    // Categories under each component (level 2)
    Object.entries(categoryData).forEach(([category, categoryInfo]) => {
      // Validate category info structure with comprehensive checks
      if (!categoryInfo || typeof categoryInfo !== 'object') {
        console.warn(`Invalid category info for ${category}:`, categoryInfo);
        return;
      }

      // Ensure components object exists with default structure
      const components = categoryInfo.components || {};
      const defaultComponents = {
        capital: 0,
        opportunity: 0,
        storage: 0,
        risk: 0,
        ...components
      };

      Object.entries(defaultComponents).forEach(([componentKey, componentValue]) => {
        const componentName = componentKey === 'capital' ? 'Capital Cost' :
                             componentKey === 'opportunity' ? 'Opportunity Cost' :
                             componentKey === 'storage' ? 'Storage Cost' :
                             'Risk Cost';
        
        // Validate component value with safe numeric conversion
        const safeComponentValue = typeof componentValue === 'number' && !isNaN(componentValue) && componentValue >= 0 ? componentValue : 0;
        
        // Include all categories, even with zero values, to ensure consistent data structure
        if (safeComponentValue >= 0) {
          const id = `${componentName}-${category}`;
          ids.push(id);
          labels.push(category);
          parents.push(componentName);
          values.push(safeComponentValue);
          colors_array.push(componentColors[componentName] || colors.text);
        }
      });
    });

    return [{
      type: 'sunburst',
      ids: ids,
      labels: labels,
      parents: parents,
      values: values,
      leaf: { opacity: 0.8 },
      marker: {
        line: { width: 2, color: colors.background },
        colors: colors_array
      },
      branchvalues: 'total',
      hovertemplate: '<b>%{label}</b><br>' +
                    'Value: $%{value:,.0f}<br>' +
                    'Percentage: %{percentParent}<br>' +
                    '<extra></extra>',
      textinfo: 'label+percent parent',
      textfont: { size: 12, color: colors.text },
      insidetextorientation: 'radial'
    }];
  };

  const createCategorySunburst = () => {
    const categoryData = data!.byCategory;

    const ids: string[] = [];
    const labels: string[] = [];
    const parents: string[] = [];
    const values: number[] = [];
    const colors_array: string[] = [];

    // Root
    const totalCost = Object.values(categoryData).reduce((sum, cat) => sum + cat.totalCost, 0);
    ids.push('Total');
    labels.push('Total by Category');
    parents.push('');
    values.push(totalCost);
    colors_array.push(colors.cardBackground);

    // Categories (level 1)
    Object.entries(categoryData).forEach(([category, categoryInfo], index) => {
      ids.push(category);
      labels.push(category);
      parents.push('Total');
      values.push(categoryInfo.totalCost);
      
      // Use different shades of the primary colors
      const categoryColors = [colors.capitalCost, colors.opportunityCost, colors.storageCost, colors.riskCost];
      colors_array.push(categoryColors[index % categoryColors.length]);
    });

    return [{
      type: 'sunburst',
      ids: ids,
      labels: labels,
      parents: parents,
      values: values,
      leaf: { opacity: 0.8 },
      marker: {
        line: { width: 2, color: colors.background },
        colors: colors_array
      },
      branchvalues: 'total',
      hovertemplate: '<b>%{label}</b><br>' +
                    'Total Cost: $%{value:,.0f}<br>' +
                    'Percentage: %{percentParent}<br>' +
                    '<extra></extra>',
      textinfo: 'label+percent parent',
      textfont: { size: 12, color: colors.text }
    }];
  };

  const createWarehouseSunburst = () => {
    const warehouseData = data!.byWarehouse;

    const ids: string[] = [];
    const labels: string[] = [];
    const parents: string[] = [];
    const values: number[] = [];
    const colors_array: string[] = [];

    // Root
    const totalCost = Object.values(warehouseData).reduce((sum, wh) => sum + wh.totalCost, 0);
    ids.push('Total');
    labels.push('Total by Warehouse');
    parents.push('');
    values.push(totalCost);
    colors_array.push(colors.cardBackground);

    // Warehouses (level 1)
    Object.entries(warehouseData).forEach(([warehouseId, warehouseInfo], index) => {
      ids.push(warehouseId);
      labels.push(warehouseInfo.warehouseName);
      parents.push('Total');
      values.push(warehouseInfo.totalCost);
      
      // Use different shades based on warehouse type
      const typeColors = {
        'Central': colors.capitalCost,
        'Regional': colors.opportunityCost,
        'Local': colors.storageCost,
        'Special': colors.riskCost
      };
      colors_array.push(typeColors[warehouseInfo.warehouseType as keyof typeof typeColors] || colors.text);
    });

    return [{
      type: 'sunburst',
      ids: ids,
      labels: labels,
      parents: parents,
      values: values,
      leaf: { opacity: 0.8 },
      marker: {
        line: { width: 2, color: colors.background },
        colors: colors_array
      },
      branchvalues: 'total',
      hovertemplate: '<b>%{label}</b><br>' +
                    'Total Cost: $%{value:,.0f}<br>' +
                    'Type: %{customdata}<br>' +
                    'Percentage: %{percentParent}<br>' +
                    '<extra></extra>',
      textinfo: 'label+percent parent',
      textfont: { size: 12, color: colors.text }
    }];
  };

  const handlePlotClick = (event: any) => {
    // Prevent event propagation to avoid Plotly animation conflicts
    if (event?.originalEvent) {
      event.originalEvent.stopPropagation();
    }

    // Comprehensive null checks and data validation
    if (!event || !event.points || !Array.isArray(event.points) || event.points.length === 0) {
      console.warn('Invalid event data in handlePlotClick:', event);
      return;
    }

    const point = event.points[0];
    
    // Validate point object has required properties
    if (!point || typeof point !== 'object') {
      console.warn('Invalid point data in handlePlotClick:', point);
      return;
    }

    // Additional validation for point properties to prevent undefined access
    if (!point.hasOwnProperty('id') && !point.hasOwnProperty('label')) {
      console.warn('Point missing required id or label property:', point);
      return;
    }

    // Ensure required properties exist and are valid
    const id = point.id || point.label || 'unknown';
    const label = point.label || point.id || 'Unknown';
    const value = typeof point.value === 'number' && !isNaN(point.value) ? point.value : 0;
    const parent = point.parent || '';

    // Additional validation for Storage Cost specifically with better data structure checking
    if (label === 'Storage Cost') {
      if (!data || !data.byComponent || typeof data.byComponent['Storage Cost'] === 'undefined') {
        console.warn('Storage Cost data not properly initialized:', data);
        return;
      }
      
      // Validate Storage Cost value is numeric and positive
      const storageCostValue = data.byComponent['Storage Cost'];
      if (typeof storageCostValue !== 'number' || isNaN(storageCostValue) || storageCostValue < 0) {
        console.warn('Invalid Storage Cost value:', storageCostValue);
        return;
      }
    }

    // Create safe segment data object with additional validation
    const segmentData = {
      id: String(id),
      label: String(label),
      value: Number(value),
      parent: String(parent)
    };

    // Validate segment data before proceeding
    if (!segmentData.label || segmentData.value < 0) {
      console.warn('Invalid segment data:', segmentData);
      return;
    }

    // Use setTimeout to defer state updates and prevent Plotly animation conflicts
    setTimeout(() => {
      try {
        setSelectedBreakdown(segmentData);
        if (onSegmentClick && typeof onSegmentClick === 'function') {
          onSegmentClick(segmentData);
        }
      } catch (error) {
        console.error('Error in handlePlotClick state update:', error);
      }
    }, 0);
  };

  const renderBreakdownPanel = () => {
    if (!selectedBreakdown) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: colors.text,
          opacity: 0.6,
          textAlign: 'center'
        }}>
          Select a segment to see details
        </div>
      );
    }

    try {
      return (
        <div style={{ color: colors.text, height: '100%', overflow: 'auto' }}>
          <h3 style={{ 
            color: colors.capitalCost, 
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {selectedBreakdown.label || 'Unknown'}
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              ${(typeof selectedBreakdown.value === 'number' ? selectedBreakdown.value : 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Total Cost
            </div>
          </div>

          {/* Add component-specific breakdown details with error boundaries */}
          {viewType === 'component' && (() => {
            try {
              return renderComponentDetails();
            } catch (error) {
              console.error('Error rendering component details:', error);
              return (
                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>
                  Error loading component details
                </div>
              );
            }
          })()}
          
          {viewType === 'category' && (() => {
            try {
              return renderCategoryDetails();
            } catch (error) {
              console.error('Error rendering category details:', error);
              return (
                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>
                  Error loading category details
                </div>
              );
            }
          })()}
          
          {viewType === 'warehouse' && (() => {
            try {
              return renderWarehouseDetails();
            } catch (error) {
              console.error('Error rendering warehouse details:', error);
              return (
                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>
                  Error loading warehouse details
                </div>
              );
            }
          })()}

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: colors.text, marginBottom: '8px' }}>Quick Actions</h4>
            <button style={{
              backgroundColor: colors.capitalCost,
              color: colors.background,
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              marginRight: '8px',
              marginBottom: '8px'
            }}>
              Analyze Further
            </button>
            <button style={{
              backgroundColor: colors.opportunityCost,
              color: colors.background,
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              marginBottom: '8px'
            }}>
              Generate Report
            </button>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in renderBreakdownPanel:', error);
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: colors.text,
          opacity: 0.6,
          textAlign: 'center'
        }}>
          Error loading breakdown details
        </div>
      );
    }
  };

  const renderComponentDetails = () => {
    if (!data || !selectedBreakdown) return null;

    const selectedLabel = selectedBreakdown.label;
    const selectedParent = selectedBreakdown.parent;
    
    // Determine if this is a component (level 1) or category (level 2)
    const validComponents = ['Capital Cost', 'Storage Cost', 'Risk Cost', 'Opportunity Cost'];
    const isComponent = validComponents.includes(selectedLabel);
    const isCategory = validComponents.includes(selectedParent);
    
    // Handle component-level selection
    if (isComponent && data.byComponent) {
      const componentData = data.byComponent[selectedLabel as keyof typeof data.byComponent];
      
      // Validate component data with fallback
      if (typeof componentData !== 'number' || isNaN(componentData) || componentData < 0) {
        console.warn(`Invalid component data for ${selectedLabel}:`, componentData);
        return (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Component Analysis</strong>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
              Data not available for {selectedLabel}
            </div>
          </div>
        );
      }

      // Safe calculation with validation
      const totalComponents = Object.values(data.byComponent).reduce((sum, val) => {
        const safeVal = typeof val === 'number' && !isNaN(val) && val >= 0 ? val : 0;
        return sum + safeVal;
      }, 0);
      
      const percentage = totalComponents > 0 ? (componentData / totalComponents) * 100 : 0;

      return (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            <strong>Component Analysis</strong>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Percentage of total: {percentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Component value: ${componentData.toLocaleString()}
          </div>
        </div>
      );
    }
    
    // Handle category-level selection (category under a component)
    if (isCategory && data.byCategory) {
      const categoryData = data.byCategory[selectedLabel];
      
      if (!categoryData || typeof categoryData !== 'object') {
        console.warn(`Invalid category data for ${selectedLabel}:`, categoryData);
        return (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Category Analysis</strong>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
              Data not available for category {selectedLabel}
            </div>
          </div>
        );
      }

      // Get the component cost for this category
      const componentKey = selectedParent === 'Capital Cost' ? 'capital' :
                          selectedParent === 'Opportunity Cost' ? 'opportunity' :
                          selectedParent === 'Storage Cost' ? 'storage' : 'risk';
      
      const componentCost = categoryData.components?.[componentKey] || 0;
      const totalCategoryCost = categoryData.totalCost || 0;
      const componentPercentage = totalCategoryCost > 0 ? (componentCost / totalCategoryCost) * 100 : 0;

      return (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            <strong>Category-Component Analysis</strong>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            {selectedParent} for {selectedLabel}: ${componentCost.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Percentage of category: {componentPercentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            Total category cost: ${totalCategoryCost.toLocaleString()}
          </div>
        </div>
      );
    }

    // Fallback for unrecognized selections
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>Analysis</strong>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
          Selected: {selectedLabel}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
          Value: ${selectedBreakdown.value?.toLocaleString() || 'N/A'}
        </div>
      </div>
    );
  };

  const renderCategoryDetails = () => {
    if (!data || !selectedBreakdown) return null;

    const categoryName = selectedBreakdown.label;
    const categoryData = data.byCategory[categoryName];
    
    if (!categoryData) return null;

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>Category Analysis</strong>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Items: {categoryData.itemCount}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Inventory Value: ${categoryData.totalValue.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Cost Rate: {((categoryData.totalCost / categoryData.totalValue) * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  const renderWarehouseDetails = () => {
    if (!data || !selectedBreakdown) return null;

    const warehouseName = selectedBreakdown.label;
    const warehouseData = Object.values(data.byWarehouse).find(wh => wh.warehouseName === warehouseName);
    
    if (!warehouseData) return null;

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>Warehouse Analysis</strong>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Type: {warehouseData.warehouseType}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Items: {warehouseData.itemCount}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
          Inventory Value: ${warehouseData.totalValue.toLocaleString()}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card 
        title="Cost Breakdown Analysis" 
        isLoading={true}
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: colors.text }}>Loading cost breakdown...</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card 
        title="Cost Breakdown Analysis"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div style={{ 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: colors.text,
          opacity: 0.6
        }}>
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Cost Breakdown Analysis"
      style={{ backgroundColor: colors.cardBackground }}
    >
      <div style={{ display: 'flex', height: `${height}px` }}>
        {/* Main visualization area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* View controls */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px',
            padding: '0 16px'
          }}>
            {['component', 'category', 'warehouse'].map((type) => (
              <button
                key={type}
                onClick={() => onViewTypeChange?.(type)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: viewType === type ? colors.capitalCost : colors.border,
                  color: viewType === type ? colors.background : colors.text,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Plotly chart */}
          <div style={{ height: `${height - 60}px` }}>
            {plotData.length > 0 ? (
              <Plot
                data={plotData}
                layout={{
                  font: { color: colors.text, family: 'Inter, sans-serif' },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  margin: { t: 0, b: 0, l: 0, r: 0 },
                  showlegend: false,
                  annotations: [],
                  width: width - 280,
                  height: height - 60,
                  // Completely disable animations to prevent transition errors
                  transition: {
                    duration: 0,
                    easing: 'linear'
                  }
                }}
                config={{
                  displayModeBar: false,
                  responsive: true,
                  staticPlot: false,
                  // Disable all animations in config as well
                  plotGlPixelRatio: 1,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d']
                }}
                onClick={(event) => {
                  try {
                    handlePlotClick(event);
                  } catch (error) {
                    console.error('Error in Plot onClick handler:', error);
                    // Prevent error propagation to Plotly
                  }
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                onError={(error) => {
                  console.error('Plotly error in CostBreakdownVisualization:', error);
                  // Reset component state on error to prevent cascade failures
                  setSelectedBreakdown(null);
                  setPlotData([]);
                }}
                onInitialized={() => {
                  console.log('CostBreakdownVisualization: Plotly initialized successfully');
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.text,
                opacity: 0.6
              }}>
                No chart data available
              </div>
            )}
          </div>
        </div>

        {/* Breakdown panel */}
        <div style={{
          width: '240px',
          backgroundColor: colors.cardBackground,
          borderRadius: '16px',
          padding: '16px',
          marginLeft: '16px',
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ 
            color: colors.text, 
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Cost Breakdown
          </h3>
          {renderBreakdownPanel()}
        </div>
      </div>
    </Card>
  );
};

export default CostBreakdownVisualization; 