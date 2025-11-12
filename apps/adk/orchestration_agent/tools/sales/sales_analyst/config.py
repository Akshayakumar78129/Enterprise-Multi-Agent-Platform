"""
Configuration settings for the Sales Analyst tools.
"""

import os
from pathlib import Path

# Database configuration
DATABASE = {
    'path': str(Path(__file__).parent.parent.parent / 'database' / 'sales_agent.db'),
    'type': 'sqlite'
}

# Logging configuration
LOGGING = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': None  # Set to None for console logging
}

# Analysis Configuration
ANALYSIS = {
    'default_timeframe': 'last_30_days',
    'supported_timeframes': ['last_7_days', 'last_30_days', 'last_90_days', 'last_year'],
    'min_data_points': 10,
    'confidence_interval': 0.95
}

# Visualization configuration
VISUALIZATION = {
    'default_figure_size': (12, 6),
    'style': 'seaborn'
}

# Alert Configuration
ALERTS = {
    'anomaly_threshold': 2.0,  # Standard deviations from mean
    'min_confidence': 0.8,
    'notification_channels': ['email', 'slack']
}

# Tool Configuration
TOOLS = {
    'enabled_tools': [
        'SalesPerformanceAnalyzer',
        'SalesForecastGenerator',
        'SalesTrendAnalyzer',
        'ProductPerformanceAnalyzer',
        'RegionalSalesAnalyzer'
    ],
    'batch_size': 1000,
    'max_workers': 4
}
