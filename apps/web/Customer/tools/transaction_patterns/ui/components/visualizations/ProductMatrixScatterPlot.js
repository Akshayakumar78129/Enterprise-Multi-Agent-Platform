import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { handleChartClick } from '../../utils/chartSelectionHelper';
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const ProductMatrixScatterPlot = ({ data, onInsight, selectedPoints = [] }) => {
  const [keyPoints, setKeyPoints] = useState([]);
  const [miniInsight, setMiniInsight] = useState(null); // { title, bullets: string[] }

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate insights
    const sortedByRevenue = [...data].sort((a, b) => b.total_value - a.total_value);
    const sortedByQuantity = [...data].sort((a, b) => b.total_quantity - a.total_quantity);
    const topRevenueProduct = sortedByRevenue[0];
    const topQuantityProduct = sortedByQuantity[0];
    
    // Calculate average price for each product and find extremes
    const productsWithPrice = data.map(d => ({
      ...d,
      avgPrice: d.total_quantity > 0 ? d.total_value / d.total_quantity : 0
    }));
    const sortedByPrice = productsWithPrice.sort((a, b) => b.avgPrice - a.avgPrice);
    const highestPriceProduct = sortedByPrice[0];
    const lowestPriceProduct = sortedByPrice[sortedByPrice.length - 1];
    
    // Calculate portfolio metrics
    const totalRevenue = data.reduce((sum, d) => sum + d.total_value, 0);
    const totalQuantity = data.reduce((sum, d) => sum + d.total_quantity, 0);
    const avgPortfolioPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
    
    // Find high-performers (top-right quadrant)
    const medianRevenue = sortedByRevenue[Math.floor(sortedByRevenue.length / 2)].total_value;
    const medianQuantity = sortedByQuantity[Math.floor(sortedByQuantity.length / 2)].total_quantity;
    const highPerformers = data.filter(d => d.total_value >= medianRevenue && d.total_quantity >= medianQuantity);

    setKeyPoints([
      `★ Top revenue: ${topRevenueProduct.name} ($${topRevenueProduct.total_value.toLocaleString()})`,
      `📦 Top volume: ${topQuantityProduct.name} (${topQuantityProduct.total_quantity.toLocaleString()} units)`,
      `💎 Highest price: ${highestPriceProduct.name} ($${highestPriceProduct.avgPrice.toFixed(2)}/unit)`,
      `🎯 High performers: ${highPerformers.length} products (${((highPerformers.length / data.length) * 100).toFixed(1)}% of portfolio)`,
      `📊 Portfolio avg price: $${avgPortfolioPrice.toFixed(2)}/unit`
    ]);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card title="Product Performance Matrix" isLoading={false}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No product data available
        </div>
      </Card>
    );
  }

  const selectedNames = new Set((selectedPoints||[]).filter(p => p.chartId === 'scatter').map(p => p.label));
  
  // Enhanced hover template with business insights
  const baseTrace = {
    x: data.map(d => d.total_quantity),
    y: data.map(d => d.total_value),
    text: data.map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: data.map(d => {
        // Size based on revenue contribution
        const totalRevenue = data.reduce((sum, item) => sum + item.total_value, 0);
        const contribution = d.total_value / totalRevenue;
        return Math.max(8, Math.min(20, 8 + contribution * 200));
      }),
      color: data.map(d => (d.total_quantity ? (d.total_value / d.total_quantity) : 0)),
      colorscale: [
        [0, '#0a1224'],      // Dark blue for low prices
        [0.3, '#1a2b42'],    // Medium blue
        [0.6, '#4a7c8a'],    // Blue-cyan
        [0.8, '#00e0ff'],    // Electric cyan
        [1, '#e930ff']       // Magenta for high prices
      ],
      showscale: true,
      colorbar: { 
        title: {
          text: 'Avg Price ($)',
          font: { color: '#f7f9fb', size: 12 }
        },
        tickfont: { color: '#f7f9fb' },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: '#00e0ff',
        borderwidth: 1
      }
    },
    hovertemplate: 
      '<b>🏷️ %{text}</b><br>' +
      '📦 <b>Quantity Sold:</b> %{x:,} units<br>' +
      '💰 <b>Total Revenue:</b> $%{y:,}<br>' +
      '💵 <b>Average Price:</b> $%{marker.color:,.2f}<br>' +
      '📊 <b>Revenue Share:</b> %{customdata:.1f}%<br>' +
      '💡 <i>Performance quadrant analysis:</i><br>' +
      '🎯 <i>Top-right = Star products (high volume + high revenue)</i><br>' +
      '⚡ <i>Top-left = Cash cows (high revenue, lower volume)</i><br>' +
      '🔄 <i>Bottom-right = Volume drivers (high volume, lower revenue)</i><br>' +
      '⚠️ <i>Bottom-left = Consider optimization or discontinuation</i><br>' +
      '<extra></extra>',
    customdata: data.map(d => {
      const totalRevenue = data.reduce((sum, item) => sum + item.total_value, 0);
      return totalRevenue > 0 ? (d.total_value / totalRevenue) * 100 : 0;
    })
  };

  const selectedTrace = selectedNames.size ? {
    x: data.filter(d => selectedNames.has(d.name)).map(d => d.total_quantity),
    y: data.filter(d => selectedNames.has(d.name)).map(d => d.total_value),
    text: data.filter(d => selectedNames.has(d.name)).map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 16,
      color: 'rgba(57,255,20,1)',
      line: { color: '#39ff14', width: 2 }
    },
    hoverinfo: 'skip',
    showlegend: false
  } : null;

  const plotData = selectedTrace ? [baseTrace, selectedTrace] : [baseTrace];

  const layout = {
    title: {
      text: 'Product Performance Matrix (Revenue vs. Volume)',
      font: { color: '#f7f9fb', size: 16 },
      x: 0.05
    },
    width: 800,
    height: 500,
    margin: { l: 80, r: 80, t: 60, b: 80 },
    paper_bgcolor: '#232a36',
    plot_bgcolor: '#232a36',
    font: { color: '#f7f9fb' },
    xaxis: {
      title: 'Total Quantity Sold (units)',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false,
      type: 'log',
      autorange: true
    },
    yaxis: {
      title: 'Total Sales Value ($)',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false,
      type: 'log',
      autorange: true
    },
    hovermode: 'closest',
    clickmode: 'event+select',
    // Add quadrant lines for better analysis
    shapes: [
      // Median lines to create quadrants
      {
        type: 'line',
        x0: Math.log10(data.sort((a, b) => a.total_quantity - b.total_quantity)[Math.floor(data.length / 2)].total_quantity),
        y0: Math.log10(Math.min(...data.map(d => d.total_value))),
        x1: Math.log10(data.sort((a, b) => a.total_quantity - b.total_quantity)[Math.floor(data.length / 2)].total_quantity),
        y1: Math.log10(Math.max(...data.map(d => d.total_value))),
        line: { color: 'rgba(255,255,255,0.3)', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        x0: Math.log10(Math.min(...data.map(d => d.total_quantity))),
        y0: Math.log10(data.sort((a, b) => a.total_value - b.total_value)[Math.floor(data.length / 2)].total_value),
        x1: Math.log10(Math.max(...data.map(d => d.total_quantity))),
        y1: Math.log10(data.sort((a, b) => a.total_value - b.total_value)[Math.floor(data.length / 2)].total_value),
        line: { color: 'rgba(255,255,255,0.3)', width: 1, dash: 'dash' }
      }
    ]
  };

  const totalRevenue = data.reduce((sum, d) => sum + d.total_value, 0);
  const totalQuantity = data.reduce((sum, d) => sum + d.total_quantity, 0);

  return (
    <Card
      title="Product Performance Matrix"
      subtitle={`${data.length} products • $${totalRevenue.toLocaleString()} total revenue • ${totalQuantity.toLocaleString()} units sold`}
      isLoading={false}
      tooltip="Scatter plot showing product performance by sales value vs quantity sold.\nBubble size = revenue contribution, color = average price. Click products for detailed analysis."
    >
      <div 
        data-type="chart" 
        data-title="Product Performance Matrix" 
        data-value={`${data.length} products analyzed`}
        style={{ width: '100%', height: '100%' }}
      >
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          config={{ 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            responsive: true 
          }}
          onClick={(event) => {
            if (!event.points || event.points.length === 0) return;
            const point = event.points[0];
            const { text: name, x: total_quantity, y: total_value } = point;
            const avgPrice = total_quantity > 0 ? total_value / total_quantity : 0;
            const revenueShare = totalRevenue > 0 ? (total_value / totalRevenue) * 100 : 0;
            const isShiftClick = !!(event?.event?.shiftKey);
            if (isShiftClick) {
              // Multi-select via helper (no regular click behavior)
              try {
                handleChartClick({
                  chartId: 'scatter',
                  chartType: 'scatter',
                  label: name,
                  value: total_value,
                  unit: '',
                  index: point.pointIndex,
                  color: point.marker?.color,
                  metadata: { total_quantity, avgPrice, revenueShare }
                }, event.event);
              } catch {}
              return;
            }
            // Regular click behavior
            const bullets = [];
            bullets.push(`Total value: $${(total_value||0).toLocaleString()}`);
            bullets.push(`Total quantity: ${(total_quantity||0).toLocaleString()} units`);
            bullets.push(`Avg unit price: $${avgPrice.toFixed(2)}`);
            setMiniInsight({ title: `Product: ${name}`, bullets: bullets.slice(0,3) });
            if (onInsight) {
              const insight = {
                title: `Product Insights: ${name}`,
                subtitle: 'Performance analysis for this product',
                metrics: [
                  { label: 'Total Quantity Sold', value: total_quantity.toLocaleString() + ' units' },
                  { label: 'Total Sales Value', value: `$${total_value.toLocaleString()}` },
                  { label: 'Average Price', value: `$${avgPrice.toFixed(2)}` },
                  { label: 'Revenue Share', value: `${revenueShare.toFixed(1)}%` }
                ],
                context: { name, total_quantity, total_value, avgPrice, revenueShare, source: 'productMatrix' },
              };
              onInsight(insight, event.event || event);
            }
          }}
        />
        {miniInsight && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 12,
            background: 'rgba(35,42,54,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 10px',
            color: '#dbe7ff',
            fontSize: 12,
            zIndex: 5,
            maxWidth: 320
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#a5b4fc' }}>{miniInsight.title}</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {miniInsight.bullets.map((b, i)=>(<li key={i} style={{ marginBottom: 2 }}>{b}</li>))}
            </ul>
          </div>
        )}
      </div>
      {keyPoints && keyPoints.length > 0 && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#d6e3f1',
          fontSize: 12
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>Key Points</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {keyPoints.map((kp, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{kp}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default ProductMatrixScatterPlot;
