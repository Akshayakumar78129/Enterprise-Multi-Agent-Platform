/**
 * Global Recharts Setup
 * Centralized imports for Recharts to avoid repeated imports across dashboards
 *
 * Import chart components from here instead of directly from 'recharts'
 */

'use client';

// Export all commonly used Recharts components
export {
  // Chart containers
  ResponsiveContainer,

  // Chart types
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  RadarChart,
  ScatterChart,
  ComposedChart,

  // Chart elements
  Line,
  Bar,
  Area,
  Pie,
  Radar,
  Scatter,

  // Axes
  XAxis,
  YAxis,
  ZAxis,

  // Grid and reference
  CartesianGrid,
  PolarGrid,
  RadialBar,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,

  // Interactions
  Tooltip,
  Legend,
  Brush,

  // Composition
  Cell,
  Label,
  LabelList,

  // Polar
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// Export types
export type { TooltipProps } from 'recharts';
