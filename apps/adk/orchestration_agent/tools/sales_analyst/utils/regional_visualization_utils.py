"""
Utilities for creating visualizations of regional sales data.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def create_regional_map_visualization(data: Dict[str, Any], include_sub_regions: bool = False) -> str:
    """
    Create a map visualization of regional performance.
    
    Args:
        data (Dict[str, Any]): Analysis results containing regional performance data
        include_sub_regions (bool): Whether to include sub-regions in the visualization
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data['top_regions'])
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        if include_sub_regions and 'sub_region_name' in df.columns:
            # Create grouped bar chart for sub-regions
            df = df.sort_values(['region_name', 'revenue'], ascending=[True, False])
            ax = df.plot(kind='bar', x='sub_region_name', y='revenue', 
                        color=plt.cm.tab20(np.arange(len(df))))
            plt.title('Regional Performance by Sub-Region')
            plt.xlabel('Sub-Region')
            plt.ylabel('Revenue')
            plt.xticks(rotation=45)
        else:
            # Create bar chart for regions
            df = df.sort_values('revenue', ascending=False)
            ax = df.plot(kind='bar', x='region_name', y='revenue')
            plt.title('Regional Performance')
            plt.xlabel('Region')
            plt.ylabel('Revenue')
            plt.xticks(rotation=45)
            
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        
        # Close the plot
        plt.close()
        
        return ""
    except Exception as e:
        logger.error(f"Error creating regional map visualization: {str(e)}")
        return ""

def create_region_time_series_chart(data: Dict[str, Any], include_sub_regions: bool = False) -> str:
    """
    Create a time series chart of regional performance.
    
    Args:
        data (Dict[str, Any]): Analysis results containing regional performance data
        include_sub_regions (bool): Whether to include sub-regions in the visualization
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data['time_series_data'])
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        if include_sub_regions and 'sub_region_name' in df.columns:
            # Create line plot for sub-regions
            for sub_region in df['sub_region_name'].unique():
                sub_df = df[df['sub_region_name'] == sub_region]
                plt.plot(sub_df['date'], sub_df['revenue'], label=sub_region)
        else:
            # Create line plot for regions
            for region in df['region_name'].unique():
                region_df = df[df['region_name'] == region]
                plt.plot(region_df['date'], region_df['revenue'], label=region)
        
        plt.title('Regional Performance Over Time')
        plt.xlabel('Date')
        plt.ylabel('Revenue')
        plt.legend()
        plt.grid(True)
        
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        
        # Close the plot
        plt.close()
        
        return ""
    except Exception as e:
        logger.error(f"Error creating time series chart: {str(e)}")
        return ""

def create_region_comparison_chart(data: Dict[str, Any], include_sub_regions: bool = False) -> str:
    """
    Create a comparison chart of regional performance metrics.
    
    Args:
        data (Dict[str, Any]): Analysis results containing regional performance data
        include_sub_regions (bool): Whether to include sub-regions in the visualization
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data['comparison_data'])
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        if include_sub_regions and 'sub_region_name' in df.columns:
            # Create grouped bar chart for sub-regions
            df = df.sort_values(['region_name', 'metric_value'], ascending=[True, False])
            ax = df.plot(kind='bar', x='sub_region_name', y='metric_value', 
                        color=plt.cm.tab20(np.arange(len(df))))
            plt.title('Regional Metrics Comparison by Sub-Region')
            plt.xlabel('Sub-Region')
            plt.ylabel('Metric Value')
            plt.xticks(rotation=45)
        else:
            # Create bar chart for regions
            df = df.sort_values('metric_value', ascending=False)
            ax = df.plot(kind='bar', x='region_name', y='metric_value')
            plt.title('Regional Metrics Comparison')
            plt.xlabel('Region')
            plt.ylabel('Metric Value')
            plt.xticks(rotation=45)
            
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        
        # Close the plot
        plt.close()
        
        return ""
    except Exception as e:
        logger.error(f"Error creating comparison chart: {str(e)}")
        return ""

def create_region_growth_chart(data: Dict[str, Any], include_sub_regions: bool = False) -> str:
    """
    Create a growth chart showing regional performance changes.
    
    Args:
        data (Dict[str, Any]): Analysis results containing regional performance data
        include_sub_regions (bool): Whether to include sub-regions in the visualization
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data['growth_data'])
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        if include_sub_regions and 'sub_region_name' in df.columns:
            # Create line plot for sub-regions
            for sub_region in df['sub_region_name'].unique():
                sub_df = df[df['sub_region_name'] == sub_region]
                plt.plot(sub_df['period'], sub_df['growth_rate'], label=sub_region)
        else:
            # Create line plot for regions
            for region in df['region_name'].unique():
                region_df = df[df['region_name'] == region]
                plt.plot(region_df['period'], region_df['growth_rate'], label=region)
        
        plt.title('Regional Growth Rates Over Time')
        plt.xlabel('Period')
        plt.ylabel('Growth Rate (%)')
        plt.legend()
        plt.grid(True)
        
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        
        # Close the plot
        plt.close()
        
        return ""
    except Exception as e:
        logger.error(f"Error creating growth chart: {str(e)}")
        return ""

def create_region_treemap_visualization(data: Dict[str, Any], include_sub_regions: bool = False) -> str:
    """
    Create a treemap visualization of regional performance.
    
    Args:
        data (Dict[str, Any]): Analysis results containing regional performance data
        include_sub_regions (bool): Whether to include sub-regions in the visualization
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data['treemap_data'])
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        if include_sub_regions and 'sub_region_name' in df.columns:
            # Create treemap for sub-regions
            sizes = df['value'].values
            labels = df['sub_region_name'].values
            colors = plt.cm.tab20(np.arange(len(df)))
        else:
            # Create treemap for regions
            sizes = df['value'].values
            labels = df['region_name'].values
            colors = plt.cm.tab20(np.arange(len(df)))
        
        plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%')
        plt.title('Regional Performance Distribution')
        
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        
        # Close the plot
        plt.close()
        
        return ""
    except Exception as e:
        logger.error(f"Error creating treemap visualization: {str(e)}")
        return "" 