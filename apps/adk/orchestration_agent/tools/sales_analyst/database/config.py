"""
Configuration settings for the Sales Analytics Multi-Agent System.
"""

import os
from pathlib import Path

# Database configuration
DATABASE = {
    'path': os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        'database',
        'sales_agent.db'
    )
}

# Logging configuration
LOGGING = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        'logs',
        'sales_analyst.log'
    )
}

# Ensure log directory exists
log_dir = os.path.dirname(LOGGING['file'])
os.makedirs(log_dir, exist_ok=True) 