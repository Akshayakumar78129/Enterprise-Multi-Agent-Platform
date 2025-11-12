"""
Utility functions for creating and saving visualizations.
"""

import os
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.io as pio
from datetime import datetime
import sys
import os
from pathlib import Path

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)
import logging
import pathlib
logger = logging.getLogger(__name__)

# Set the visualization output directory
VISUALIZATION_DIR = Path(__file__).parent.parent.parent.parent.joinpath('output', 'visualizations')

def ensure_visualization_dir():
    """Ensure the visualization directory exists."""
    if not os.path.exists(VISUALIZATION_DIR):
        os.makedirs(VISUALIZATION_DIR)
        logger.info(f"Created visualization directory at {VISUALIZATION_DIR}")

def save_matplotlib_plot(fig, filename, dpi=300):
    """
    Save a matplotlib figure to the visualization directory.
    
    Args:
        fig: matplotlib figure object
        filename: name of the file (without extension)
        dpi: dots per inch for the saved image
    """
    try:
        ensure_visualization_dir()
        filepath = os.path.join(VISUALIZATION_DIR, f"{filename}.png")
        fig.savefig(filepath, dpi=dpi, bbox_inches='tight')
        plt.close(fig)
        logger.info(f"Saved matplotlib plot to {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Error saving matplotlib plot: {str(e)}")
        raise

def save_plotly_plot(fig, filename):
    """
    Save a plotly figure to the visualization directory.
    
    Args:
        fig: plotly figure object
        filename: name of the file (without extension)
    """
    try:
        ensure_visualization_dir()
        filepath = os.path.join(VISUALIZATION_DIR, f"{filename}.html")
        pio.write_html(fig, filepath)
        
        # Also save as PNG
        png_path = os.path.join(VISUALIZATION_DIR, f"{filename}.png")
        pio.write_image(fig, png_path)
        
        logger.info(f"Saved plotly plot to {filepath} and {png_path}")
        return filepath, png_path
    except Exception as e:
        logger.error(f"Error saving plotly plot: {str(e)}")
        raise

def create_performance_plot(data, title, x_label, y_label, plot_type="bar", query_params=None):
    """
    Create a performance visualization based on query parameters.
    
    Args:
        data: DataFrame containing the data to plot
        title: Title of the plot
        x_label: Label for x-axis
        y_label: Label for y-axis
        plot_type: Type of plot ('bar', 'line', 'area')
        query_params: Dictionary containing query parameters that influence visualization
        
    Returns:
        Tuple of (matplotlib figure, plotly figure)
    """
    try:
        # Create matplotlib figure
        plt.figure(figsize=(12, 6))
        
        # Apply query-based transformations if provided
        if query_params:
            if 'group_by' in query_params:
                data = data.groupby(query_params['group_by']).agg(query_params.get('agg_func', 'sum')).reset_index()
            if 'sort_by' in query_params:
                data = data.sort_values(query_params['sort_by'], ascending=query_params.get('ascending', False))
            if 'filter' in query_params:
                data = data.query(query_params['filter'])
            if 'limit' in query_params:
                data = data.head(query_params['limit'])
        
        if plot_type == "bar":
            sns.barplot(data=data, x=data.columns[0], y=data.columns[1])
        elif plot_type == "line":
            sns.lineplot(data=data, x=data.columns[0], y=data.columns[1])
        elif plot_type == "area":
            plt.fill_between(data[data.columns[0]], data[data.columns[1]], alpha=0.3)
            sns.lineplot(data=data, x=data.columns[0], y=data.columns[1])
        
        plt.title(title)
        plt.xlabel(x_label)
        plt.ylabel(y_label)
        plt.xticks(rotation=45)
        plt.tight_layout()
        mpl_fig = plt.gcf()
        
        # Create plotly figure
        if plot_type == "bar":
            plotly_fig = go.Figure(data=[go.Bar(x=data[data.columns[0]], y=data[data.columns[1]])])
        elif plot_type == "line":
            plotly_fig = go.Figure(data=[go.Scatter(x=data[data.columns[0]], y=data[data.columns[1]], mode='lines')])
        elif plot_type == "area":
            plotly_fig = go.Figure(data=[go.Scatter(x=data[data.columns[0]], y=data[data.columns[1]], 
                                                   fill='tozeroy', mode='lines')])
        
        plotly_fig.update_layout(
            title=title,
            xaxis_title=x_label,
            yaxis_title=y_label,
            template="plotly_white"
        )
        
        return mpl_fig, plotly_fig
        
    except Exception as e:
        logger.error(f"Error creating performance plot: {str(e)}")
        raise

def generate_filename(prefix, suffix=""):
    """
    Generate a unique filename for a visualization.
    
    Args:
        prefix: Prefix for the filename
        suffix: Optional suffix for the filename
        
    Returns:
        Generated filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}{suffix}" 