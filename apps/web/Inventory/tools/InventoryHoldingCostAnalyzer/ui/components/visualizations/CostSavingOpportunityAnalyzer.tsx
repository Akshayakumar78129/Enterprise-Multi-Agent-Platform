import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface SavingOpportunity {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  difficulty: number; // 1-5 scale
  potential_savings: number;
  inventory_value: number;
  primary_component: 'capital' | 'storage' | 'risk' | 'opportunity';
  implementation_timeline: number; // days
  description?: string;
}

interface CostSavingOpportunityAnalyzerProps {
  data: SavingOpportunity[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onOpportunitySelect?: (opportunity: SavingOpportunity) => void;
  onGroupByChange?: (groupBy: 'item' | 'category' | 'warehouse' | 'component') => void;
}

const CostSavingOpportunityAnalyzer: React.FC<CostSavingOpportunityAnalyzerProps> = ({
  data = [],
  isLoading = false,
  width = 740,
  height = 500,
  onOpportunitySelect,
  onGroupByChange
}) => {
  const [groupBy, setGroupBy] = useState<'item' | 'category' | 'warehouse' | 'component'>('item');
  const [selectedOpportunity, setSelectedOpportunity] = useState<SavingOpportunity | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<number>(5);
  const [minSavings, setMinSavings] = useState<number>(0);

  // Enterprise IQ colors
  const colors = {
    capital: '#00e0ff',      // Electric Cyan
    storage: '#3e7b97',      // Blue-gray
    risk: '#ffc145',         // Amber
    opportunity: '#e930ff',  // Signal Magenta
    background: '#232a36',   // Graphite
    text: '#f7f9fb',        // Cloud White
    grid: '#3a4459'         // Light Graphite
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.difficulty <= difficultyFilter && 
      item.potential_savings >= minSavings
    );
  }, [data, difficultyFilter, minSavings]);

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const groupedData = groupBy === 'item' ? filteredData : 
      Object.values(
        filteredData.reduce((acc, item) => {
          const key = groupBy === 'category' ? item.category :
                     groupBy === 'warehouse' ? item.warehouse : item.primary_component;
          
          if (!acc[key]) {
            acc[key] = {
              id: key,
              name: key,
              category: groupBy === 'category' ? key : item.category,
              warehouse: groupBy === 'warehouse' ? key : item.warehouse,
              difficulty: 0,
              potential_savings: 0,
              inventory_value: 0,
              primary_component: groupBy === 'component' ? key as any : item.primary_component,
              implementation_timeline: 0,
              count: 0
            };
          }
          
          acc[key].difficulty += item.difficulty;
          acc[key].potential_savings += item.potential_savings;
          acc[key].inventory_value += item.inventory_value;
          acc[key].implementation_timeline += item.implementation_timeline;
          acc[key].count = (acc[key].count || 0) + 1;
          
          return acc;
        }, {} as Record<string, any>)
      ).map(item => ({
        ...item,
        difficulty: item.difficulty / item.count,
        implementation_timeline: item.implementation_timeline / item.count
      }));

    return [{
      x: groupedData.map(d => d.difficulty),
      y: groupedData.map(d => d.potential_savings),
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: groupedData.map(d => Math.max(8, Math.min(40, d.inventory_value / 10000))),
        color: groupedData.map(d => colors[d.primary_component]),
        opacity: 0.7,
        line: {
          color: colors.text,
          width: 1
        }
      },
      text: groupedData.map(d => d.name),
      hovertemplate: 
        '<b>%{text}</b><br>' +
        'Difficulty: %{x:.1f}<br>' +
        'Potential Savings: $%{y:,.0f}<br>' +
        'Inventory Value: $%{marker.size}<br>' +
        '<extra></extra>',
      customdata: groupedData
    }];
  }, [filteredData, groupBy, colors]);

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: colors.text, family: 'Inter, sans-serif' },
    margin: { l: 80, r: 80, t: 40, b: 80 },
    xaxis: {
      title: 'Implementation Difficulty (1-5 scale)',
      gridcolor: `${colors.grid}33`,
      showgrid: true,
      zeroline: false,
      color: colors.text,
      range: [0.5, 5.5],
      dtick: 1
    },
    yaxis: {
      title: 'Potential Annual Savings ($)',
      gridcolor: `${colors.grid}33`,
      showgrid: true,
      zeroline: false,
      color: colors.text,
      tickformat: ',.0f'
    },
    showlegend: false,
    hovermode: 'closest',
    shapes: [
      // Quadrant dividers
      {
        type: 'line',
        x0: 0.5, x1: 5.5,
        y0: filteredData.length ? filteredData.reduce((sum, d) => sum + d.potential_savings, 0) / filteredData.length : 0,
        y1: filteredData.length ? filteredData.reduce((sum, d) => sum + d.potential_savings, 0) / filteredData.length : 0,
        line: { color: colors.grid, width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        x0: 3, x1: 3,
        y0: 0,
        y1: filteredData.length ? Math.max(...filteredData.map(d => d.potential_savings)) : 0,
        line: { color: colors.grid, width: 1, dash: 'dash' }
      }
    ],
    annotations: [
      {
        x: 1.5, y: 0.9,
        text: "Quick Wins",
        showarrow: false,
        font: { color: colors.text, size: 12 },
        bgcolor: colors.background,
        bordercolor: colors.grid,
        borderwidth: 1
      },
      {
        x: 4.5, y: 0.9,
        text: "Major Projects",
        showarrow: false,
        font: { color: colors.text, size: 12 },
        bgcolor: colors.background,
        bordercolor: colors.grid,
        borderwidth: 1
      },
      {
        x: 1.5, y: 0.1,
        text: "Fill-ins",
        showarrow: false,
        font: { color: colors.text, size: 12 },
        bgcolor: colors.background,
        bordercolor: colors.grid,
        borderwidth: 1
      },
      {
        x: 4.5, y: 0.1,
        text: "Back Burner",
        showarrow: false,
        font: { color: colors.text, size: 12 },
        bgcolor: colors.background,
        bordercolor: colors.grid,
        borderwidth: 1
      }
    ]
  };

  const handleGroupByChange = (newGroupBy: 'item' | 'category' | 'warehouse' | 'component') => {
    setGroupBy(newGroupBy);
    onGroupByChange?.(newGroupBy);
  };

  const renderControls = () => (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Group By Controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <label style={{ color: colors.text, fontSize: '12px', marginRight: '8px' }}>
          Group by:
        </label>
        {(['item', 'category', 'warehouse', 'component'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleGroupByChange(type)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: groupBy === type ? colors.capital : 'transparent',
              color: groupBy === type ? '#0a1224' : colors.text,
              border: `1px solid ${groupBy === type ? colors.capital : colors.grid}`
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ color: colors.text, fontSize: '12px' }}>
          Max Difficulty:
        </label>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(parseInt(e.target.value))}
          style={{ width: '80px' }}
        />
        <span style={{ color: colors.text, fontSize: '12px', minWidth: '12px' }}>
          {difficultyFilter}
        </span>
      </div>

      {/* Minimum Savings Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ color: colors.text, fontSize: '12px' }}>
          Min Savings:
        </label>
        <input
          type="number"
          value={minSavings}
          onChange={(e) => setMinSavings(Number(e.target.value))}
          style={{
            width: '80px',
            padding: '4px 6px',
            borderRadius: '4px',
            border: `1px solid ${colors.grid}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '12px'
          }}
        />
      </div>
    </div>
  );

  const renderDetailPanel = () => {
    if (!selectedOpportunity) {
      return (
        <div style={{
          backgroundColor: colors.background,
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px',
          border: `1px solid ${colors.grid}`,
          textAlign: 'center'
        }}>
          <div style={{ color: colors.text, opacity: 0.7 }}>
            Select an opportunity to see details
          </div>
        </div>
      );
    }

    const opportunity = selectedOpportunity;
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
          Saving Opportunity: {opportunity.name}
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Potential Savings
            </div>
            <div style={{
              color: colors.capital,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ${opportunity.potential_savings.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Difficulty
            </div>
            <div style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {opportunity.difficulty.toFixed(1)}/5
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Timeline
            </div>
            <div style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {opportunity.implementation_timeline} days
            </div>
          </div>
          
          <div>
            <div style={{ color: colors.text, fontSize: '11px', opacity: 0.7 }}>
              Primary Component
            </div>
            <div style={{
              color: colors[opportunity.primary_component],
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {opportunity.primary_component}
            </div>
          </div>
        </div>

        {opportunity.description && (
          <p style={{
            color: colors.text,
            fontSize: '12px',
            opacity: 0.8,
            lineHeight: '1.4',
            margin: 0
          }}>
            {opportunity.description}
          </p>
        )}
      </div>
    );
  };

  const renderQuadrantSummary = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const avgSavings = filteredData.reduce((sum, d) => sum + d.potential_savings, 0) / filteredData.length;
    
    const quadrants = {
      quickWins: filteredData.filter(d => d.difficulty < 3 && d.potential_savings > avgSavings),
      majorProjects: filteredData.filter(d => d.difficulty >= 3 && d.potential_savings > avgSavings),
      fillIns: filteredData.filter(d => d.difficulty < 3 && d.potential_savings <= avgSavings),
      backBurner: filteredData.filter(d => d.difficulty >= 3 && d.potential_savings <= avgSavings)
    };

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginTop: '16px'
      }}>
        {Object.entries(quadrants).map(([key, items]) => (
          <div key={key} style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${colors.grid}`,
            textAlign: 'center'
          }}>
            <div style={{
              color: colors.text,
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {key === 'quickWins' ? 'Quick Wins' :
               key === 'majorProjects' ? 'Major Projects' :
               key === 'fillIns' ? 'Fill-ins' : 'Back Burner'}
            </div>
            <div style={{
              color: colors.capital,
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {items.length}
            </div>
            <div style={{
              color: colors.text,
              fontSize: '10px',
              opacity: 0.7
            }}>
              ${items.reduce((sum, i) => sum + i.potential_savings, 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card title="Cost-Saving Opportunities" isLoading={true}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${height - 100}px`,
          color: colors.text
        }}>
          Loading opportunity data...
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Cost-Saving Opportunities">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${height - 100}px`,
          color: colors.text,
          opacity: 0.7
        }}>
          No opportunities identified
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Cost-Saving Opportunities" 
      subtitle={`${filteredData.length} opportunities identified`}
    >
      {renderControls()}
      
      <div style={{ width: '100%', marginBottom: '16px' }}>
        <Plot
          data={chartData}
          layout={{
            ...layout,
            width: width - 48,
            height: height - 200
          }}
          config={{
            displayModeBar: false,
            responsive: true
          }}
          onClick={(event) => {
            if (event.points && event.points[0] && event.points[0].customdata) {
              const opportunity = event.points[0].customdata as SavingOpportunity;
              setSelectedOpportunity(opportunity);
              onOpportunitySelect?.(opportunity);
            }
          }}
        />
      </div>
      
      {renderQuadrantSummary()}
      {renderDetailPanel()}
    </Card>
  );
};

export default CostSavingOpportunityAnalyzer; 