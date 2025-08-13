import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const FrequencyDistribution = ({
  data = [],
  isLoading = false,
  onBinClick = null,
  selectedBin = null,
  width = 460,
  height = 300
}) => {
  const [hoveredBin, setHoveredBin] = useState(null);
  const [keyPoints, setKeyPoints] = useState([]);

  const chartData = useMemo(() => {
    console.log('📊 FrequencyDistribution data:', data);
    
    // Temporary: Use hardcoded data to test if chart works
    const testData = [
      { bin: "1", count: 24, percentage: "0.9" },
      { bin: "2", count: 43, percentage: "1.7" },
      { bin: "3", count: 45, percentage: "1.8" },
      { bin: "4", count: 48, percentage: "1.9" },
      { bin: "5-10", count: 234, percentage: "9.2" },
      { bin: "11-20", count: 456, percentage: "17.9" },
      { bin: "21-50", count: 892, percentage: "35.0" },
      { bin: "50+", count: 805, percentage: "31.6" }
    ];
    
    const actualData = data && data.length > 0 ? data : testData;
    console.log('📊 Using data:', actualData);
    
    if (!actualData || actualData.length === 0) {
      console.log('❌ FrequencyDistribution: No data or empty array');
      return null;
    }

    const totalCustomers = actualData.reduce((sum, bin) => sum + bin.count, 0);
    const avgFrequency = actualData.reduce((sum, bin, index) => {
      const binValue = bin.bin === '20+' ? 25 : 
                      bin.bin.includes('-') ? 
                        (parseInt(bin.bin.split('-')[0]) + parseInt(bin.bin.split('-')[1])) / 2 :
                        parseInt(bin.bin);
      return sum + (binValue * bin.count);
    }, 0) / totalCustomers;

    // Create the trace data
    const trace = {
      x: actualData.map(bin => bin.bin),
      y: actualData.map(bin => bin.count),
      type: 'bar',
      name: 'Customer Count',
      marker: {
        color: actualData.map((bin, index) => {
          if (selectedBin && bin.bin === selectedBin) {
            return '#00e0ff'; // Electric Cyan for selected
          }
          if (hoveredBin === index) {
            return '#5fd4d6'; // Lighter cyan for hover
          }
          // Gradient from Midnight Navy to Electric Cyan
          const intensity = bin.count / Math.max(...actualData.map(b => b.count));
          const r = Math.round(10 + (0 - 10) * intensity);
          const g = Math.round(18 + (224 - 18) * intensity);
          const b = Math.round(36 + (255 - 36) * intensity);
          return `rgb(${r}, ${g}, ${b})`;
        }),
        line: {
          color: actualData.map((bin, index) => {
            if (selectedBin && bin.bin === selectedBin) {
              return '#00e0ff';
            }
            if (hoveredBin === index) {
              return '#00e0ff';
            }
            return 'rgba(247, 249, 251, 0.2)';
          }),
          width: 1
        },
        opacity: actualData.map((bin, index) => {
          if (selectedBin && bin.bin !== selectedBin) {
            return 0.4; // Fade non-selected bars
          }
          return 1;
        })
      },
      hovertemplate: 
        '<b>%{x} purchases</b><br>' +
        'Customers: %{y}<br>' +
        'Percentage: %{customdata}%<br>' +
        '<extra></extra>',
      customdata: actualData.map(bin => bin.percentage),
      hoverlabel: {
        bgcolor: '#232a36',
        bordercolor: '#00e0ff',
        font: { color: '#f7f9fb' }
      }
    };

    // Add threshold lines for segments
    const shapes = [
      // High frequency threshold (1.5x average)
      {
        type: 'line',
        x0: avgFrequency * 1.5,
        x1: avgFrequency * 1.5,
        y0: 0,
        y1: Math.max(...actualData.map(b => b.count)),
        line: {
          color: '#e930ff',
          width: 2,
          dash: 'dash'
        }
      },
      // Low frequency threshold (0.5x average)
      {
        type: 'line',
        x0: avgFrequency * 0.5,
        x1: avgFrequency * 0.5,
        y0: 0,
        y1: Math.max(...actualData.map(b => b.count)),
        line: {
          color: '#8893a7',
          width: 2,
          dash: 'dash'
        }
      },
      // Mean line
      {
        type: 'line',
        x0: avgFrequency,
        x1: avgFrequency,
        y0: 0,
        y1: Math.max(...actualData.map(b => b.count)),
        line: {
          color: '#00e0ff',
          width: 2,
          dash: 'dot'
        }
      }
    ];

    console.log('✅ FrequencyDistribution: Generated chartData with trace');

    // Compute key points for summary
    const peakBin = actualData.reduce((a, b) => (b.count > a.count ? b : a), actualData[0]);
    const tail = actualData.find(b => (b.bin.includes('+') || (b.bin.includes('-') && parseInt(b.bin.split('-')[1]) >= 20))) || peakBin;
    const lowBin = actualData.reduce((a, b) => (b.count < a.count ? b : a), actualData[0]);
    const top3Share = (() => {
      const sorted = [...actualData].sort((a,b)=>b.count - a.count).slice(0,3);
      const share = (sorted.reduce((s, b) => s + b.count, 0) / totalCustomers) * 100;
      return share.toFixed(1);
    })();
    setKeyPoints([
      `★ Peak frequency bin: ${peakBin.bin} purchases (${peakBin.count} customers)`,
      `Long tail: ${tail.bin} captures heavy buyers`,
      `Least common bin: ${lowBin.bin} (${lowBin.count} customers)`,
      `Top 3 bins cover ${top3Share}% of customers`
    ]);

    const maxCount = Math.max(...actualData.map(b => b.count));
    return { trace, shapes, avgFrequency, maxCount };
  }, [data, selectedBin, hoveredBin]);

  const handleClick = (eventData) => {
    if (onBinClick && eventData.points && eventData.points.length > 0) {
      const clickedBin = eventData.points[0].x;
      onBinClick(clickedBin);
    }
  };

  const handleHover = (eventData) => {
    if (eventData.points && eventData.points.length > 0) {
      setHoveredBin(eventData.points[0].pointIndex);
    }
  };

  const handleUnhover = () => {
    setHoveredBin(null);
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Purchase Frequency Distribution" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No frequency data available
        </div>
      </Card>
    );
  }

  const layout = {
    width: width,
    height: height,
    margin: { t: 40, r: 30, b: 60, l: 60 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb'
    },
    xaxis: {
      title: {
        text: 'Number of Purchases',
        font: { size: 12, color: '#f7f9fb' }
      },
      tickfont: { size: 10, color: '#f7f9fb' },
      gridcolor: 'rgba(247, 249, 251, 0.1)',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: {
        text: 'Number of Customers',
        font: { size: 12, color: '#f7f9fb' }
      },
      tickfont: { size: 10, color: '#f7f9fb' },
      gridcolor: 'rgba(247, 249, 251, 0.1)',
      showgrid: true,
      zeroline: false
    },
    shapes: chartData?.shapes || [],
    annotations: chartData ? [
      {
        x: chartData.avgFrequency * 1.5,
        y: chartData.maxCount * 0.9,
        text: 'High Freq',
        showarrow: false,
        font: { size: 10, color: '#e930ff' },
        xanchor: 'center'
      },
      {
        x: chartData.avgFrequency,
        y: chartData.maxCount * 0.9,
        text: 'Average',
        showarrow: false,
        font: { size: 10, color: '#00e0ff' },
        xanchor: 'center'
      },
      {
        x: chartData.avgFrequency * 0.5,
        y: chartData.maxCount * 0.9,
        text: 'Low Freq',
        showarrow: false,
        font: { size: 10, color: '#8893a7' },
        xanchor: 'center'
      }
    ] : [],
    hovermode: 'closest',
    showlegend: false
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <Card 
      title="Purchase Frequency Distribution" 
      subtitle={`${data?.length || 0} frequency bins`}
      isLoading={isLoading}
    >
      <div style={{ width: '100%', height: '100%' }}>
        {chartData ? (
          <Plot
            data={[chartData.trace]}
            layout={layout}
            config={config}
            onClick={handleClick}
            onHover={handleHover}
            onUnhover={handleUnhover}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            color: '#5891cb'
          }}>
            No frequency data available
          </div>
        )}
      </div>
      
      {selectedBin && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 224, 255, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          fontSize: '12px',
          color: '#00e0ff'
        }}>
          Selected: {selectedBin} purchases ({(data && data.length > 0 ? data : []).find(d => d.bin === selectedBin)?.count || 0} customers)
        </div>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#d6e3f1',
          fontSize: 12
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>Key Points</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {keyPoints.map((kp, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{kp}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default FrequencyDistribution; 