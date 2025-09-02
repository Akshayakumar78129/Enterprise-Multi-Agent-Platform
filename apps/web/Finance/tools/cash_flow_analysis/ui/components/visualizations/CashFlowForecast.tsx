import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { CashFlowForecastData, formatCurrency } from '../../api/cashFlowApi';
import styles from './CashFlowForecast.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashFlowForecastProps {
  data: CashFlowForecastData[];
  onDataPointClick?: (data: CashFlowForecastData, scenario: string) => void;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CashFlowForecast: React.FC<CashFlowForecastProps> = ({ data, onDataPointClick }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort data by month
    const sortedData = [...data].sort((a, b) => parseInt(a.month) - parseInt(b.month));
    
    // Calculate cumulative cash flow
    let cumulativeBase = 0;
    let cumulativeOptimistic = 0;
    let cumulativePessimistic = 0;
    
    const cumulativeData = sortedData.map(item => {
      cumulativeBase += item.base_forecast;
      cumulativeOptimistic += item.optimistic_forecast;
      cumulativePessimistic += item.pessimistic_forecast;
      
      return {
        ...item,
        cumulative_base: cumulativeBase,
        cumulative_optimistic: cumulativeOptimistic,
        cumulative_pessimistic: cumulativePessimistic
      };
    });

    return {
      labels: sortedData.map(item => monthNames[parseInt(item.month) - 1]),
      datasets: [
        {
          label: 'Optimistic Scenario',
          data: cumulativeData.map(item => item.cumulative_optimistic),
          borderColor: 'rgba(0, 255, 136, 1)',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Base Case',
          data: cumulativeData.map(item => item.cumulative_base),
          borderColor: 'rgba(0, 224, 255, 1)',
          backgroundColor: 'rgba(0, 224, 255, 0.2)',
          borderWidth: 3,
          tension: 0.4,
          fill: '+1',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Pessimistic Scenario',
          data: cumulativeData.map(item => item.cumulative_pessimistic),
          borderColor: 'rgba(233, 48, 255, 1)',
          backgroundColor: 'rgba(233, 48, 255, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Monthly Net Flow',
          data: sortedData.map(item => item.net_monthly_flow),
          type: 'bar' as const,
          backgroundColor: sortedData.map(item => 
            item.net_monthly_flow > 0 ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 0, 68, 0.6)'
          ),
          borderColor: sortedData.map(item => 
            item.net_monthly_flow > 0 ? 'rgba(0, 255, 136, 1)' : 'rgba(255, 0, 68, 1)'
          ),
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ],
      raw: cumulativeData
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(247, 249, 251, 0.8)',
          font: {
            size: 11,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 18, 36, 0.95)',
        titleColor: '#00e0ff',
        bodyColor: 'rgba(247, 249, 251, 0.9)',
        borderColor: 'rgba(0, 224, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const month = chartData?.labels[index];
            const confidence = data[index]?.confidence_level || 'N/A';
            return `${month} - Confidence: ${confidence}`;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value, true)}`;
          },
          afterBody: (context: any) => {
            const index = context[0].dataIndex;
            const item = data[index];
            if (item) {
              return [
                '',
                `Inflow: ${formatCurrency(item.monthly_inflow)}`,
                `Outflow: ${formatCurrency(item.monthly_outflow)}`,
                `Transactions: ${item.transaction_volume.toLocaleString()}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 224, 255, 0.05)',
          lineWidth: 1
        },
        ticks: {
          color: 'rgba(247, 249, 251, 0.6)',
          font: {
            size: 11
          }
        }
      },
      y: {
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 224, 255, 0.08)',
          lineWidth: 1
        },
        ticks: {
          color: 'rgba(247, 249, 251, 0.6)',
          font: {
            size: 11
          },
          callback: (value: any) => formatCurrency(value, true)
        },
        title: {
          display: true,
          text: 'Cumulative Cash Flow',
          color: 'rgba(247, 249, 251, 0.8)',
          font: {
            size: 12
          }
        }
      },
      y1: {
        position: 'right' as const,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgba(247, 249, 251, 0.6)',
          font: {
            size: 11
          },
          callback: (value: any) => formatCurrency(value, true)
        },
        title: {
          display: true,
          text: 'Monthly Flow',
          color: 'rgba(247, 249, 251, 0.8)',
          font: {
            size: 12
          }
        }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onDataPointClick) {
        const index = elements[0].index;
        const dataPoint = data[index];
        const scenario = elements[0].datasetIndex === 0 ? 'optimistic' : 
                        elements[0].datasetIndex === 1 ? 'base' : 'pessimistic';
        onDataPointClick(dataPoint, scenario);
      }
    }
  };

  if (!chartData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Cash Flow Forecast</h3>
          <p className={styles.subtitle}>Multi-Scenario Predictive Analysis</p>
        </div>
        <div className={styles.emptyState}>
          <p>No forecast data available</p>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const finalMonth = chartData.raw[chartData.raw.length - 1];
  const avgMonthlyFlow = data.reduce((sum, item) => sum + item.net_monthly_flow, 0) / data.length;
  const totalTransactions = data.reduce((sum, item) => sum + item.transaction_volume, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Cash Flow Forecast</h3>
        <p className={styles.subtitle}>12-Month Predictive Analysis with Scenario Modeling</p>
      </div>

      <div className={styles.scenarioCards}>
        <div className={styles.scenarioCard}>
          <div className={styles.scenarioIcon} style={{ backgroundColor: 'rgba(0, 255, 136, 0.2)' }}>
            <span>↑</span>
          </div>
          <div className={styles.scenarioDetails}>
            <span className={styles.scenarioLabel}>Optimistic</span>
            <span className={styles.scenarioValue}>
              {formatCurrency(finalMonth.cumulative_optimistic, true)}
            </span>
            <span className={styles.scenarioChange}>+20% growth</span>
          </div>
        </div>

        <div className={styles.scenarioCard}>
          <div className={styles.scenarioIcon} style={{ backgroundColor: 'rgba(0, 224, 255, 0.2)' }}>
            <span>→</span>
          </div>
          <div className={styles.scenarioDetails}>
            <span className={styles.scenarioLabel}>Base Case</span>
            <span className={styles.scenarioValue}>
              {formatCurrency(finalMonth.cumulative_base, true)}
            </span>
            <span className={styles.scenarioChange}>Historical avg</span>
          </div>
        </div>

        <div className={styles.scenarioCard}>
          <div className={styles.scenarioIcon} style={{ backgroundColor: 'rgba(233, 48, 255, 0.2)' }}>
            <span>↓</span>
          </div>
          <div className={styles.scenarioDetails}>
            <span className={styles.scenarioLabel}>Pessimistic</span>
            <span className={styles.scenarioValue}>
              {formatCurrency(finalMonth.cumulative_pessimistic, true)}
            </span>
            <span className={styles.scenarioChange}>-20% decline</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <Line data={chartData} options={options} />
      </div>

      <div className={styles.insightCards}>
        <div className={styles.insightCard}>
          <span className={styles.insightLabel}>Avg Monthly Flow</span>
          <span className={styles.insightValue} style={{
            color: avgMonthlyFlow > 0 ? '#00ff88' : '#ff0044'
          }}>
            {formatCurrency(avgMonthlyFlow, true)}
          </span>
        </div>
        <div className={styles.insightCard}>
          <span className={styles.insightLabel}>Confidence Level</span>
          <span className={styles.insightValue}>
            {data.filter(d => d.confidence_level === 'high').length}/{data.length} High
          </span>
        </div>
        <div className={styles.insightCard}>
          <span className={styles.insightLabel}>Total Volume</span>
          <span className={styles.insightValue}>
            {(totalTransactions / 1000000).toFixed(1)}M txns
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowForecast;