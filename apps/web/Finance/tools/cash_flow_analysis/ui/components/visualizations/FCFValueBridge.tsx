import React, { useMemo } from 'react';
import { FCFBridgeData, formatCurrency } from '../../api/cashFlowApi';
import styles from './FCFValueBridge.module.css';

interface FCFValueBridgeProps {
  data: FCFBridgeData[];
  onBarClick?: (data: FCFBridgeData, chartType: string) => void;
}

const FCFValueBridge: React.FC<FCFValueBridgeProps> = ({ data, onBarClick }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort by sequence order and calculate cumulative values
    const sortedData = [...data].sort((a, b) => a.sequence_order - b.sequence_order);
    let cumulativeValue = 0;
    
    return sortedData.map((item, index) => {
      const startValue = cumulativeValue;
      cumulativeValue += item.value;
      
      return {
        ...item,
        startValue,
        endValue: cumulativeValue,
        displayValue: Math.abs(item.value),
        isPositive: item.value >= 0,
        isBaseline: item.impact_type === 'baseline',
        width: 100, // Equal width for all bars
        position: index * 120 + 50 // Spacing between bars
      };
    });
  }, [data]);

  const maxValue = useMemo(() => {
    if (processedData.length === 0) return 100;
    const allValues = processedData.flatMap(d => [Math.abs(d.startValue), Math.abs(d.endValue)]);
    return Math.max(...allValues, 100);
  }, [processedData]);

  const getBarHeight = (value: number) => {
    return Math.max((Math.abs(value) / maxValue) * 300, 10); // Min height of 10px
  };

  const getBarColor = (item: any) => {
    if (item.isBaseline) return '#00e0ff'; // Electric Cyan for baseline
    if (item.isPositive) return '#00ff88'; // Green for positive impact
    return '#ff5252'; // Red for negative impact
  };

  const getYPosition = (item: any) => {
    const height = getBarHeight(item.displayValue);
    if (item.isBaseline) {
      return 350 - height; // Bottom aligned for baseline
    }
    
    // For waterfall effect, position based on cumulative flow
    const baseHeight = item.startValue >= 0 ? 
      350 - getBarHeight(item.startValue) : 
      350 - getBarHeight(Math.abs(item.startValue));
    
    return item.value >= 0 ? 
      baseHeight - height : // Positive values go up
      baseHeight; // Negative values go down
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Free Cash Flow Value Bridge</h3>
          <p className={styles.subtitle}>FCF Generation and Value Creation Analysis</p>
        </div>
        <div className={styles.emptyState}>
          <p>No FCF bridge data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Free Cash Flow Value Bridge</h3>
        <p className={styles.subtitle}>FCF Generation and Value Creation Analysis</p>
      </div>

      <div className={styles.chartContainer}>
        <svg 
          className={styles.chart} 
          viewBox={`0 0 ${processedData.length * 120 + 100} 450`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(247, 249, 251, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" opacity="0.3" />
          
          {/* Zero line */}
          <line 
            x1="0" 
            y1="350" 
            x2={processedData.length * 120 + 100} 
            y2="350"
            stroke="rgba(247, 249, 251, 0.3)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Bars and connectors */}
          {processedData.map((item, index) => {
            const barHeight = getBarHeight(item.displayValue);
            const yPos = getYPosition(item);
            const nextItem = processedData[index + 1];

            return (
              <g key={`${item.component}-${index}`}>
                {/* Connecting line to next bar (waterfall effect) */}
                {!item.isBaseline && nextItem && (
                  <line
                    x1={item.position + 50}
                    y1={item.value >= 0 ? yPos : yPos + barHeight}
                    x2={nextItem.position - 50}
                    y2={item.value >= 0 ? yPos : yPos + barHeight}
                    stroke="rgba(0, 224, 255, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Bar */}
                <rect
                  x={item.position - 50}
                  y={yPos}
                  width={100}
                  height={barHeight}
                  fill={getBarColor(item)}
                  className={styles.bar}
                  onClick={() => onBarClick?.(item, 'fcf_value_bridge')}
                />

                {/* Bar value label */}
                <text
                  x={item.position}
                  y={yPos - 10}
                  textAnchor="middle"
                  className={styles.valueLabel}
                  fill="#f7f9fb"
                >
                  {formatCurrency(item.value, true)}
                </text>

                {/* Component name label */}
                <text
                  x={item.position}
                  y={400}
                  textAnchor="middle"
                  className={styles.componentLabel}
                  fill="rgba(247, 249, 251, 0.8)"
                >
                  {item.component.length > 15 ? 
                    `${item.component.substring(0, 15)}...` : 
                    item.component}
                </text>

                {/* Impact type indicator */}
                <circle
                  cx={item.position + 35}
                  cy={yPos + 10}
                  r="3"
                  fill={
                    item.impact_type === 'baseline' ? '#00e0ff' :
                    item.impact_type === 'reduction' ? '#ff5252' : '#00ff88'
                  }
                />
              </g>
            );
          })}

          {/* Final FCF value */}
          {processedData.length > 0 && (
            <g>
              <text
                x={processedData[processedData.length - 1].position + 60}
                y="340"
                textAnchor="start"
                className={styles.finalValueLabel}
                fill="#00e0ff"
              >
                Final FCF: {formatCurrency(processedData[processedData.length - 1].endValue, true)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#00e0ff' }}></div>
          <span>EBITDA Baseline</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#00ff88' }}></div>
          <span>Value Creating</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#ff5252' }}></div>
          <span>Value Reducing</span>
        </div>
      </div>

      {/* Insights Panel */}
      <div className={styles.insightsPanel}>
        <h4>Key Insights</h4>
        <div className={styles.insights}>
          {processedData.length > 0 && (
            <>
              <div className={styles.insight}>
                <strong>Starting EBITDA:</strong> {formatCurrency(processedData[0]?.value || 0)}
              </div>
              <div className={styles.insight}>
                <strong>Final FCF:</strong> {formatCurrency(processedData[processedData.length - 1]?.endValue || 0)}
              </div>
              <div className={styles.insight}>
                <strong>Conversion Rate:</strong> {
                  processedData[0]?.value ? 
                  (((processedData[processedData.length - 1]?.endValue || 0) / Math.abs(processedData[0].value)) * 100).toFixed(1) : '0'
                }%
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FCFValueBridge;