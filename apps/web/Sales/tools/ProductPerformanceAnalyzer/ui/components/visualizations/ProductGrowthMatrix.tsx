import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Product, QuadrantData } from '../../types';
import { formatCurrency, formatPercentage, formatWithCommas } from '../../utils/formatters';
import { generateChartLayout, prepareGrowthMatrixData } from '../../utils/chartHelpers';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ProductGrowthMatrixProps {
  data?: Product[];
  loading?: boolean;
  title?: string;
  onProductSelect?: (product: Product) => void;
  onQuadrantSelect?: (quadrant: string) => void;
  height?: number;
  width?: number;
}

/**
 * Product Growth Matrix Visualization
 * Shows products positioned in four-quadrant growth/margin matrix
 */
export const ProductGrowthMatrix: React.FC<ProductGrowthMatrixProps> = ({
  data = [],
  loading = false,
  title = 'Product Growth Matrix',
  onProductSelect,
  onQuadrantSelect,
  height = 560,
  width = 560,
}) => {
  const theme = useTheme();
  const [marginThreshold, setMarginThreshold] = useState<number>(15);
  const [growthThreshold, setGrowthThreshold] = useState<number>(5);
  
  // Generate growth data (in real implementation, this would come from historical data)
  const productsWithGrowth = useMemo(() => {
    if (!data || !data.length) return [];
    
    return data.map(product => {
      // For demo purpose - simulate growth between -20% and 30%
      // In real implementation, we would compare current vs previous period
      const growthRate = (Math.random() * 50) - 20;
      
      // Calculate margin if not provided
      let margin = product.margin;
      let margin_pct = product.margin_pct;
      
      if (margin === undefined || margin_pct === undefined) {
        const cost = product.cost || (product.sales_amount * 0.7); // Default 30% margin if no cost data
        margin = product.sales_amount - cost;
        margin_pct = (margin / product.sales_amount) * 100;
      }
      
      return {
        ...product,
        growth_rate: growthRate,
        margin,
        margin_pct,
      };
    });
  }, [data]);
  
  // Categorize products into quadrants
  const quadrants = useMemo(() => {
    const stars = productsWithGrowth.filter(p => 
      p.margin_pct >= marginThreshold && p.growth_rate >= growthThreshold
    );
    
    const questionMarks = productsWithGrowth.filter(p => 
      p.margin_pct < marginThreshold && p.growth_rate >= growthThreshold
    );
    
    const cashCows = productsWithGrowth.filter(p => 
      p.margin_pct >= marginThreshold && p.growth_rate < growthThreshold
    );
    
    const dogs = productsWithGrowth.filter(p => 
      p.margin_pct < marginThreshold && p.growth_rate < growthThreshold
    );
    
    return { stars, questionMarks, cashCows, dogs };
  }, [productsWithGrowth, marginThreshold, growthThreshold]);
  
  // Calculate quadrant metrics
  const quadrantData = useMemo((): Record<string, QuadrantData> => {
    return {
      stars: {
        name: 'Stars',
        description: 'High Growth, High Margin',
        count: quadrants.stars.length,
        totalSales: quadrants.stars.reduce((sum, p) => sum + p.sales_amount, 0),
        recommendation: 'Invest for growth'
      },
      questionMarks: {
        name: 'Question Marks',
        description: 'High Growth, Low Margin',
        count: quadrants.questionMarks.length,
        totalSales: quadrants.questionMarks.reduce((sum, p) => sum + p.sales_amount, 0),
        recommendation: 'Improve margins or divest'
      },
      cashCows: {
        name: 'Cash Cows',
        description: 'Low Growth, High Margin',
        count: quadrants.cashCows.length,
        totalSales: quadrants.cashCows.reduce((sum, p) => sum + p.sales_amount, 0),
        recommendation: 'Maintain and harvest'
      },
      dogs: {
        name: 'Dogs',
        description: 'Low Growth, Low Margin',
        count: quadrants.dogs.length,
        totalSales: quadrants.dogs.reduce((sum, p) => sum + p.sales_amount, 0),
        recommendation: 'Consider discontinuing'
      }
    };
  }, [quadrants]);
  
  // Prepare scatter plot data with different traces for each quadrant
  const scatterData = useMemo(() => {
    // Define colors for each quadrant
    const colors = {
      stars: theme.colors.electricCyan,
      questionMarks: '#5fd4d6',
      cashCows: '#43cad0',
      dogs: theme.colors.signalMagenta,
    };
    
    return Object.entries(quadrants).map(([quadrant, products]) => {
      const color = colors[quadrant as keyof typeof colors];
      
      return {
        type: 'scatter',
        x: products.map(p => p.margin_pct),
        y: products.map(p => p.growth_rate),
        mode: 'markers',
        name: quadrantData[quadrant].name,
        marker: {
          size: products.map(p => Math.min(Math.max(p.sales_amount / 1000, 10), 30)),
          color,
          line: {
            color: theme.colors.midnight,
            width: 1,
          },
        },
        text: products.map(p => 
          `${p.product_name}<br>` +
          `Sales: ${formatCurrency(p.sales_amount)}<br>` +
          `Margin: ${formatPercentage(p.margin_pct)}<br>` +
          `Growth: ${p.growth_rate >= 0 ? '+' : ''}${p.growth_rate.toFixed(1)}%`
        ),
        hoverinfo: 'text',
      };
    });
  }, [quadrants, quadrantData, theme]);
  
  // Prepare quadrant divider lines
  const dividerLines = useMemo(() => {
    const minMargin = -5;
    const maxMargin = 50;
    const minGrowth = -25;
    const maxGrowth = 35;
    
    return [
      // Vertical line (margin threshold)
      {
        type: 'scatter',
        x: [marginThreshold, marginThreshold],
        y: [minGrowth, maxGrowth],
        mode: 'lines',
        line: {
          color: theme.colors.cloudWhite,
          width: 2,
          dash: 'dash',
        },
        hoverinfo: 'none',
        showlegend: false,
      },
      // Horizontal line (growth threshold)
      {
        type: 'scatter',
        x: [minMargin, maxMargin],
        y: [growthThreshold, growthThreshold],
        mode: 'lines',
        line: {
          color: theme.colors.cloudWhite,
          width: 2,
          dash: 'dash',
        },
        hoverinfo: 'none',
        showlegend: false,
      }
    ];
  }, [marginThreshold, growthThreshold, theme]);
  
  // Prepare quadrant labels
  const quadrantLabels = useMemo(() => {
    return {
      annotations: [
        // Stars
        {
          x: 35,
          y: 25,
          xref: 'x',
          yref: 'y',
          text: 'Stars',
          showarrow: false,
          font: {
            family: theme.typography.fontFamily,
            size: 14,
            color: theme.colors.electricCyan,
          },
        },
        // Question Marks
        {
          x: 5,
          y: 25,
          xref: 'x',
          yref: 'y',
          text: 'Question Marks',
          showarrow: false,
          font: {
            family: theme.typography.fontFamily,
            size: 14,
            color: '#5fd4d6',
          },
        },
        // Cash Cows
        {
          x: 35,
          y: -15,
          xref: 'x',
          yref: 'y',
          text: 'Cash Cows',
          showarrow: false,
          font: {
            family: theme.typography.fontFamily,
            size: 14,
            color: '#43cad0',
          },
        },
        // Dogs
        {
          x: 5,
          y: -15,
          xref: 'x',
          yref: 'y',
          text: 'Dogs',
          showarrow: false,
          font: {
            family: theme.typography.fontFamily,
            size: 14,
            color: theme.colors.signalMagenta,
          },
        },
      ]
    };
  }, [theme]);
  
  // Generate layout
  const chartLayout = useMemo(() => {
    return {
      ...generateChartLayout(theme, {
        height: height - 160, // Reserve space for quadrant summary
        width,
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          bgcolor: theme.colors.midnight,
          bordercolor: theme.colors.graphite,
        },
        xaxis: {
          title: 'Margin (%)',
          range: [-5, 50],
          zeroline: true,
          showgrid: true,
        },
        yaxis: {
          title: 'Growth Rate (%)',
          range: [-25, 35],
          zeroline: true,
          showgrid: true,
        },
      }),
      ...quadrantLabels,
    };
  }, [theme, height, width, quadrantLabels]);
  
  // Handle scatter point click
  const handlePointClick = (event: any) => {
    if (!onProductSelect || !event.points || !event.points[0]) return;
    
    const { curveNumber, pointIndex } = event.points[0];
    
    if (curveNumber === undefined || pointIndex === undefined) return;
    
    // Map curve number to quadrant
    const quadrantKeys = Object.keys(quadrants);
    if (curveNumber < quadrantKeys.length) {
      const quadrantKey = quadrantKeys[curveNumber];
      const products = quadrants[quadrantKey as keyof typeof quadrants];
      
      if (pointIndex < products.length) {
        onProductSelect(products[pointIndex]);
      }
    }
  };
  
  // Handle threshold change
  const handleMarginThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMarginThreshold(value);
    }
  };
  
  const handleGrowthThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setGrowthThreshold(value);
    }
  };
  
  // Generate summary cards for each quadrant
  const quadrantCards = useMemo(() => {
    return Object.entries(quadrantData).map(([key, data]) => {
      const colorMap: Record<string, string> = {
        stars: theme.colors.electricCyan,
        questionMarks: '#5fd4d6',
        cashCows: '#43cad0',
        dogs: theme.colors.signalMagenta,
      };
      
      const color = colorMap[key];
      
      return (
        <div
          key={key}
          style={{
            background: `${color}20`,
            border: `1px solid ${color}`,
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
          }}
          onClick={() => onQuadrantSelect && onQuadrantSelect(key)}
        >
          <div style={{ 
            color: theme.colors.cloudWhite, 
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '4px' 
          }}>
            {data.name} ({data.count})
          </div>
          <div style={{ 
            color: color, 
            fontSize: '16px', 
            fontWeight: 600,
            marginBottom: '4px' 
          }}>
            {formatCurrency(data.totalSales)}
          </div>
          <div style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: '12px' 
          }}>
            {data.recommendation}
          </div>
        </div>
      );
    });
  }, [quadrantData, theme, onQuadrantSelect]);
  
  return (
    <Card 
      title={title}
      elevation="md"
      isLoading={loading}
    >
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Grid cols={2} gap={16}>
            {/* Margin threshold control */}
            <GridItem>
              <div>
                <label style={{ 
                  color: theme.colors.cloudWhite,
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Margin Threshold: {marginThreshold}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={marginThreshold}
                  onChange={handleMarginThresholdChange}
                  style={{ width: '100%' }}
                />
              </div>
            </GridItem>
            
            {/* Growth threshold control */}
            <GridItem>
              <div>
                <label style={{ 
                  color: theme.colors.cloudWhite,
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  Growth Threshold: {growthThreshold}%
                </label>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="1"
                  value={growthThreshold}
                  onChange={handleGrowthThresholdChange}
                  style={{ width: '100%' }}
                />
              </div>
            </GridItem>
          </Grid>
        </div>
        
        {/* Growth matrix chart */}
        <Plot
          data={[...scatterData, ...dividerLines]}
          layout={chartLayout}
          config={{ responsive: true }}
          onClick={handlePointClick}
        />
        
        {/* Quadrant summary cards */}
        <Grid cols={4} gap={16} style={{ marginTop: '16px' }}>
          {quadrantCards.map((card, index) => (
            <GridItem key={index}>
              {card}
            </GridItem>
          ))}
        </Grid>
      </div>
    </Card>
  );
};

ProductGrowthMatrix.displayName = 'ProductGrowthMatrix';

export default ProductGrowthMatrix; 