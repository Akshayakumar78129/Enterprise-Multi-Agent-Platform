import React, { useState, useEffect } from 'react';
import styles from './HealthMatrix.module.css';

interface HealthData {
  category: string;
  warehouse: string;
  health_score: number;
  item_count: number;
  total_value: number;
  stock_coverage_ratio: number;
  stockout_risk_count: number;
  avg_holding_cost: number;
}

interface HealthMatrixProps {
  data: HealthData[];
  onCellClick: (data: any, type: string) => void;
}

const HealthMatrix: React.FC<HealthMatrixProps> = ({ data, onCellClick }) => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No health matrix data available</p>
      </div>
    );
  }

  // Get unique categories and warehouses
  const categories = [...new Set(data.map(d => d.category))].sort();
  const warehouses = [...new Set(data.map(d => d.warehouse))].sort();

  // Create matrix map for easy lookup
  const matrixMap = new Map();
  data.forEach(item => {
    matrixMap.set(`${item.category}-${item.warehouse}`, item);
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    if (score >= 40) return styles.average;
    if (score >= 20) return styles.poor;
    return styles.critical;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  const handleCellClick = (cellData: HealthData) => {
    setSelectedCell(`${cellData.category}-${cellData.warehouse}`);
    onCellClick(cellData, 'health_matrix');
  };

  return (
    <div className={styles.matrixContainer}>
      <div className={styles.matrixWrapper}>
        <table className={styles.matrix}>
          <thead>
            <tr>
              <th className={styles.cornerCell}>Category / Warehouse</th>
              {warehouses.map(warehouse => (
                <th key={warehouse} className={styles.headerCell}>
                  {warehouse}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category}>
                <td className={styles.rowHeader}>{category}</td>
                {warehouses.map(warehouse => {
                  const cellKey = `${category}-${warehouse}`;
                  const cellData = matrixMap.get(cellKey);
                  
                  if (!cellData) {
                    return <td key={warehouse} className={styles.emptyCell}>-</td>;
                  }

                  return (
                    <td
                      key={warehouse}
                      className={`${styles.cell} ${getHealthColor(cellData.health_score)} ${
                        selectedCell === cellKey ? styles.selected : ''
                      } ${hoveredCell === cellKey ? styles.hovered : ''}`}
                      onClick={() => handleCellClick(cellData)}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${category} - ${warehouse}\nHealth Score: ${cellData.health_score.toFixed(1)}%\nItems: ${cellData.item_count}\nValue: $${(cellData.total_value / 1000).toFixed(1)}K\nClick for insights`}
                    >
                      <div className={styles.cellContent}>
                        <div className={styles.scoreValue}>
                          {cellData.health_score.toFixed(0)}
                        </div>
                        <div className={styles.scoreLabel}>
                          {getHealthLabel(cellData.health_score)}
                        </div>
                        {cellData.stockout_risk_count > 0 && (
                          <div className={styles.riskIndicator} title={`${cellData.stockout_risk_count} items at risk`}>
                            ⚠️
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>Health Score Legend</div>
        <div className={styles.legendItems}>
          <div className={`${styles.legendItem} ${styles.excellent}`}>
            <span className={styles.legendColor}></span>
            <span>Excellent (80-100)</span>
          </div>
          <div className={`${styles.legendItem} ${styles.good}`}>
            <span className={styles.legendColor}></span>
            <span>Good (60-79)</span>
          </div>
          <div className={`${styles.legendItem} ${styles.average}`}>
            <span className={styles.legendColor}></span>
            <span>Average (40-59)</span>
          </div>
          <div className={`${styles.legendItem} ${styles.poor}`}>
            <span className={styles.legendColor}></span>
            <span>Poor (20-39)</span>
          </div>
          <div className={`${styles.legendItem} ${styles.critical}`}>
            <span className={styles.legendColor}></span>
            <span>Critical (0-19)</span>
          </div>
        </div>
      </div>

      <div className={styles.hint}>
        💡 Click any cell for AI insights
      </div>
    </div>
  );
};

export default HealthMatrix;