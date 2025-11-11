/**
 * Global Chart.js Setup
 * Registers all Chart.js components once to avoid repeated registration across dashboards
 *
 * Import this file in components that use Chart.js instead of registering separately
 */

'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  LogarithmicScale,
} from 'chart.js';

// Register all Chart.js components globally (only runs once)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  LogarithmicScale
);

// Export Chart.js instance for use in components
export { ChartJS };

// Export chart components for convenience
export { Line, Bar, Pie, Doughnut, Radar, PolarArea, Scatter, Bubble } from 'react-chartjs-2';

// Export types
export type { ChartOptions } from 'chart.js';
