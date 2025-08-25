const path = require('path');

// Get the project root directory using process.cwd()
const PROJECT_ROOT = process.cwd();

// Database configuration
const DATABASE = {
  path: path.resolve(PROJECT_ROOT, 'Sales', 'database', 'sales_agent.db')
};

// Logging configuration
const LOGGING = {
  level: 'INFO',
  format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
  stream: process.stderr  // Use stderr for all logging
};

// Analysis Configuration
const ANALYSIS = {
  default_timeframe: 'last_30_days',
  supported_timeframes: ['last_7_days', 'last_30_days', 'last_90_days', 'last_year'],
  min_data_points: 10,
  confidence_interval: 0.95
};

// Visualization configuration
const VISUALIZATION = {
  default_figure_size: [12, 6],
  style: 'seaborn'
};

module.exports = {
  DATABASE,
  LOGGING,
  ANALYSIS,
  VISUALIZATION
}; 