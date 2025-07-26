"""
Configuration settings for the Sales Analytics Multi-Agent System.
"""

import os
import sys
from pathlib import Path

# Get the project root directory (two levels up from this file)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))

# Database configuration
DATABASE = {
    'path': os.path.join(PROJECT_ROOT, 'Sales', 'database', 'sales_agent.db')
}

# Ensure database directory exists
db_dir = os.path.dirname(DATABASE['path'])
os.makedirs(db_dir, exist_ok=True)

# Logging configuration
LOGGING = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'stream': sys.stderr  # Use stderr for all logging
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
