import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const LTVDistribution = ({
  data = [],
  isLoading = false,
  width = 640,
  height = 380,
  onBinClick = null,
  highlightedRange = null,
  showPercentage = false
}) => {
  const [selectedRange, setSelectedRange] = useState(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data by value range order
    const sortedData = [...data].sort((a, b) => {
      const order = ['0-50K', '50K-100K', '100K-200K', '200K-500K', '500K+'];
      return order.indexOf(a.value_range) - order.indexOf(b.value_range);
    });

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    // Define color scheme based on value ranges
    const getBarColor = (range, isHighlighted) => {
      const baseColors = {
        '0-50K': '#5fd4d6',      // Lighter cyan
        '50K-100K': '#00e0ff',   // Electric Cyan
        '100K-200K': '#20a4d6',  // Medium cyan
        '200K-500K': '#4d7cff',  // Blue
        '500K+': '#e930ff'       // Signal Magenta
      };
      
      return isHighlighted ? '#e930ff' : baseColors[range] || '#00e0ff';
    };

    return [{
      x: sortedData.map(d => d.value_range),
      y: sortedData.map(d => showPercentage ? d.percentage : d.customer_count),
      type: 'bar',
      name: showPercentage ? 'Percentage of Customers' : 'Customer Count',
      marker: {
        color: sortedData.map(d => getBarColor(d.value_range, highlightedRange === d.value_range)),
        line: {
          color: '#f7f9fb',
          width: 1
        },
        opacity: 0.9
      },
      text: sortedData.map(d => 
        showPercentage 
          ? `${d.percentage}%<br>${d.customer_count} customers`
          : `${d.customer_count}<br>Avg: ${formatCurrency(d.avg_ltv_in_range)}`
      ),
      textposition: 'none',
      hovertemplate: sortedData.map(d => 
        `<b>${d.value_range}</b><br>` +
        `Customers: ${d.customer_count}<br>` +
        `Percentage: ${d.percentage}%<br>` +
        `Avg LTV: ${formatCurrency(d.avg_ltv_in_range)}<br>` +
        `Range: ${formatCurrency(d.min_ltv_in_range)} - ${formatCurrency(d.max_ltv_in_range)}<br>` +
        '<extra></extra>'
      ),
      customdata: sortedData.map(d => d.value_range)
    }];
  }, [data, showPercentage, highlightedRange]);

  const layout = {
    title: {
      text: 'Customer Lifetime Value Distribution',
      font: { color: '#f7f9fb', size: 16, family: 'Inter' },
      x: 0
    },
    xaxis: {
      title: {
        text: 'LTV Value Range',
        font: { color: '#f7f9fb', size: 12, family: 'Inter' }
      },
      tickfont: { color: '#f7f9fb', size: 10, family: 'Inter' },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: {
        text: showPercentage ? 'Percentage of Customers (%)' : 'Customer Count',
        font: { color: '#f7f9fb', size: 12, family: 'Inter' }
      },
      tickfont: { color: '#f7f9fb', size: 10, family: 'Inter' },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: true,
      zeroline: false
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { family: 'Inter', color: '#f7f9fb' },
    margin: { l: 60, r: 40, t: 60, b: 60 },
    showlegend: false,
    hovermode: 'closest',
    bargap: 0.2
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    displaylogo: false
  };

  const handlePlotClick = (event) => {
    if (event.points && event.points.length > 0) {
      const clickedRange = event.points[0].customdata;
      setSelectedRange(clickedRange === selectedRange ? null : clickedRange);
      
      if (onBinClick) {
        onBinClick(clickedRange);
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card title="LTV Distribution" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: `${height}px`,
            color: "#5891cb",
          }}
        >
          No distribution data available
        </div>
      </Card>
    );
  }

  const totalCustomers = data.reduce((sum, d) => sum + d.customer_count, 0);
  const avgLTV = data.reduce((sum, d) => sum + (d.avg_ltv_in_range * d.customer_count), 0) / totalCustomers;

  return (
    <Card
      title="Customer Lifetime Value Distribution"
      subtitle={`${totalCustomers.toLocaleString()} customers • Avg LTV: $${Math.round(avgLTV).toLocaleString()}`}
      isLoading={isLoading}
    >
      <div style={{ width: '100%', height: `${height}px` }}>
        <Plot
          data={chartData}
          layout={{
            ...layout,
            width: width,
            height: height - 20
          }}
          config={config}
          onClick={handlePlotClick}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Value tier legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '16px',
        flexWrap: 'wrap'
      }}>
        {data.map((tier, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#f7f9fb',
              cursor: onBinClick ? 'pointer' : 'default',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: highlightedRange === tier.value_range ? 'rgba(233, 48, 255, 0.2)' : 'transparent',
              border: highlightedRange === tier.value_range ? '1px solid #e930ff' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => onBinClick && onBinClick(tier.value_range)}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: tier.value_range === '0-50K' ? '#5fd4d6' :
                                tier.value_range === '50K-100K' ? '#00e0ff' :
                                tier.value_range === '100K-200K' ? '#20a4d6' :
                                tier.value_range === '200K-500K' ? '#4d7cff' : '#e930ff',
                borderRadius: '2px'
              }}
            />
            <span>{tier.value_range}</span>
            <span style={{ color: '#5891cb' }}>
              ({tier.customer_count} • {tier.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LTVDistribution; 