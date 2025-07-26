from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
import logging
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import io
import base64
import sqlite3

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomerSegmentIdentifierInput(BaseModel):
    """Input parameters for customer segmentation"""
    segmentation_method: str = Field(
        ..., description="Method for customer segmentation: 'rfm' (Recency, Frequency, Monetary), 'behavioral', 'demographic', 'value_based', 'lifecycle', 'needs_based', or 'custom'."
    )
    
    time_period: str = Field(
        ..., description="Time period to analyze, such as 'quarterly', 'annual', 'monthly', or a specific date range in format 'YYYY-MM-DD:YYYY-MM-DD'"
    )
    
    num_segments: Optional[int] = Field(
        None, description="Target number of segments to create. If not provided, optimal number will be determined automatically."
    )
    
    include_attributes: Optional[List[str]] = Field(
        None, description="Specific customer attributes to include in the segmentation analysis, e.g., ['purchase_frequency', 'avg_order_value', 'customer_age']"
    )
    
    filters: Optional[Dict[str, Any]] = Field(
        None, description="Optional filters to narrow down the analysis, e.g., {'customer_type': 'business', 'region': 'North America'}"
    )

def identify_customer_segments(
    segmentation_method: str = "rfm",
    time_period: str = "quarterly",
    num_segments: Optional[int] = None,
    include_attributes: Optional[List[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
    include_visualization: bool = True
) -> str:
    """
    Identifies and defines customer segments based on specified attributes and segmentation method.
    Uses clustering techniques to group similar customers and provides visualization of the segments.
    
    Args:
        segmentation_method: Method for customer segmentation
        time_period: Time period to analyze
        num_segments: Target number of segments (optional)
        include_attributes: Specific attributes to include (optional)
        filters: Filters to narrow analysis (optional)
        include_visualization: Whether to include visualizations in the analysis
        
    Returns:
        Formatted segmentation results as a string.
    """
    try:
        # Set database path
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        logger.info(f"Starting customer segmentation with parameters: method={segmentation_method}, "
                   f"time_period={time_period}, num_segments={num_segments}")
        
        # Connect to the local SQLite database
        customer_data = _fetch_customer_data(db_path, filters, time_period)
        
        if customer_data is None or customer_data.empty:
            return "No customer data found for the specified parameters."
        
        # Preprocess the data for segmentation
        processed_data = _preprocess_data(customer_data, segmentation_method, include_attributes)
        
        # Apply the selected segmentation method
        segments = _apply_segmentation(processed_data, num_segments)
        
        # Generate visualization of segments
        plot_data = _generate_segment_visualization(segments) if include_visualization else None
        
        # Format the results
        return _format_result(segments, customer_data, plot_data, segmentation_method)
            
    except Exception as e:
        logger.error(f"Error in customer segmentation: {str(e)}")
        return f"Error performing customer segmentation: {str(e)}"

def _fetch_customer_data(db_path: str, filters: Optional[Dict[str, Any]] = None, time_period: str = None) -> pd.DataFrame:
    """
    Fetch the required customer data from the database.
    """
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        
        # Build and execute query
        query = _build_query(filters, time_period)
        logger.info(f"Executing query: {query}")
        
        try:
            data = pd.read_sql_query(query, conn)
            
            if data.empty:
                logger.warning("Query returned no data")
                return pd.DataFrame()
            
            logger.info(f"Retrieved {len(data)} customer records from database")
            return data
            
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return pd.DataFrame()
            
    except Exception as e:
        logger.error(f"Error fetching customer data: {str(e)}")
        return pd.DataFrame()
        
    finally:
        if conn:
            conn.close()

def _build_query(filters: Optional[Dict[str, Any]] = None, time_period: str = None) -> str:
    """
    Build the query to fetch customer data based on the segmentation method and time period.
    """
    # Parse time period
    start_date = None
    end_date = None
    if time_period:
        if ':' in time_period:
            start_date, end_date = time_period.split(':')
        else:
            end_date = datetime.now().strftime('%Y-%m-%d')
            if time_period == 'monthly':
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            elif time_period == 'quarterly':
                start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
            elif time_period == 'annual':
                start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
            else:
                start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')  # Default to quarterly

    # Base query to get customer data with proper table joins and field names
    query = """
    SELECT DISTINCT
        c.[Customer Key] as customer_id,
        c.[Customer Type Desc] as Customer_Type,
        c.[Customer Status] as Status,
        c.[Customer State/Prov] as Region,
        c.[Industry Code] as Industry,
        COUNT(DISTINCT t.[Sales Txn Key]) as transaction_count,
        ROUND(AVG(t.[Net Sales Amount]), 2) as avg_order_value,
        ROUND(SUM(t.[Net Sales Amount]), 2) as total_spend,
        MAX(t.[Txn Date]) as last_purchase_date,
        ROUND(AVG(c.[Credit Limit Amount]), 2) as Credit_Limit,
        cl.[RFM Score] as Loyalty_Score,
        cl.[Number Sales Txns] as Interaction_Count
    FROM dbo_D_Customer c
    LEFT JOIN dbo_F_Sales_Transaction t 
        ON c.[Customer Key] = t.[Customer Key]
        AND t.[Txn Date] BETWEEN '{}' AND '{}'
    LEFT JOIN dbo_F_Customer_Loyalty cl 
        ON c.[Customer Key] = cl.[Entity Key]
    WHERE c.[Customer Key] > 0
    """.format(start_date, end_date)

    # Add other filters if provided
    if filters:
        for key, value in filters.items():
            if isinstance(value, str):
                query += f"\n    AND c.[{key}] = '{value}'"
            else:
                query += f"\n    AND c.[{key}] = {value}"

    # Add group by clause with proper field names
    query += """
    GROUP BY 
        c.[Customer Key],
        c.[Customer Type Desc],
        c.[Customer Status],
        c.[Customer State/Prov],
        c.[Industry Code],
        c.[Credit Limit Amount],
        cl.[RFM Score],
        cl.[Number Sales Txns]
    HAVING COUNT(DISTINCT t.[Sales Txn Key]) > 0
    """

    return query

def _preprocess_data(data: pd.DataFrame, segmentation_method: str, include_attributes: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Preprocess the customer data for segmentation analysis.
    """
    # Calculate recency based on last purchase date
    data['last_purchase_date'] = pd.to_datetime(data['last_purchase_date'], errors='coerce')
    data['recency'] = (pd.Timestamp.now() - data['last_purchase_date']).dt.days
    data['recency'] = data['recency'].fillna(365)  # Default to 1 year for customers with no purchases
    
    # Handle missing values and convert to numeric
    numeric_columns = ['transaction_count', 'avg_order_value', 'total_spend', 
                      'Credit_Limit', 'Outstanding_Balance', 'Loyalty_Score',
                      'Interaction_Count', 'recency']
    
    for col in numeric_columns:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors='coerce')
            data[col] = data[col].fillna(0)
    
    # Select features based on segmentation method
    if segmentation_method == 'rfm':
        features = ['recency', 'transaction_count', 'total_spend']
    elif segmentation_method == 'behavioral':
        features = ['transaction_count', 'avg_order_value', 'total_spend', 'Interaction_Count']
    elif segmentation_method == 'value':
        features = ['total_spend', 'avg_order_value', 'Credit_Limit']
    elif segmentation_method == 'lifecycle':
        features = ['recency', 'transaction_count', 'total_spend', 'Status']
    elif segmentation_method == 'custom':
        features = include_attributes if include_attributes else ['recency', 'transaction_count', 'total_spend']
    else:
        features = ['recency', 'transaction_count', 'total_spend']
    
    # Ensure all features exist
    features = [f for f in features if f in data.columns]
    
    # Normalize numeric data
    scaler = StandardScaler()
    numeric_data = data[features].copy()
    
    # Handle infinite values
    numeric_data = numeric_data.replace([np.inf, -np.inf], np.nan)
    numeric_data = numeric_data.fillna(0)
    
    # Check for zero variance columns
    non_zero_var_cols = numeric_data.columns[numeric_data.var() != 0]
    if len(non_zero_var_cols) > 0:
        numeric_data[non_zero_var_cols] = scaler.fit_transform(numeric_data[non_zero_var_cols])
    
    return numeric_data

def _apply_segmentation(data: pd.DataFrame, num_segments: Optional[int] = None) -> pd.DataFrame:
    """
    Apply the selected segmentation method to the preprocessed data.
    """
    # If data has no columns, return an empty dataframe with a cluster column
    if data.empty or data.shape[1] == 0:
        logger.error("No data available for segmentation")
        return pd.DataFrame({'cluster': []})
    
    # If data has more than 2 dimensions, apply PCA for visualization
    if data.shape[1] > 2:
        pca = PCA(n_components=min(data.shape[1], 2))
        data_2d = pca.fit_transform(data)
        data_for_clustering = data.values
    else:
        data_2d = data.values
        data_for_clustering = data.values
    
    # Determine the optimal number of clusters if not specified
    n_clusters = num_segments or _determine_optimal_clusters(data_for_clustering)
    
    # Apply KMeans clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(data_for_clustering)
    
    # Combine original data with cluster labels and PCA components
    result = pd.DataFrame(data.values, columns=data.columns)
    result['cluster'] = cluster_labels
    
    if data.shape[1] > 2:
        result['pca1'] = data_2d[:, 0]
        result['pca2'] = data_2d[:, 1]
    
    return result

def _determine_optimal_clusters(data: np.ndarray, max_clusters: int = 10) -> int:
    """
    Determine the optimal number of clusters using the elbow method.
    """
    # Use the elbow method to find the optimal number of clusters
    inertia = []
    
    # Handle edge cases
    if data.shape[0] < 10:  # If very few data points
        return min(2, data.shape[0])
    
    for k in range(2, min(11, max_clusters + 1, data.shape[0] + 1)):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(data)
        inertia.append(kmeans.inertia_)
    
    # If we have fewer data points than the minimum clusters
    if len(inertia) < 2:
        return 2
    
    # Calculate the rate of change in inertia
    inertia_changes = np.diff(inertia) / np.array(inertia[:-1])
    
    # Find the "elbow" point where the rate of change stabilizes
    # Simple heuristic: find where the rate of change is less than the median
    median_change = np.median(inertia_changes)
    elbow_point = np.where(inertia_changes < median_change)[0]
    
    # If no clear elbow is found, return a default value
    if len(elbow_point) == 0:
        return min(3, data.shape[0])  # Default to 3 clusters if no clear elbow is found
    
    # Return the optimal number of clusters (add 2 because we started from k=2)
    return elbow_point[0] + 2

def _generate_segment_visualization(segmented_data: pd.DataFrame) -> str:
    """
    Generate visualization of the segments and encode as base64 string.
    """
    plt.figure(figsize=(10, 8))
    
    # Check if we have enough data for visualization
    if segmented_data.empty or 'cluster' not in segmented_data.columns:
        plt.text(0.5, 0.5, "Not enough data for segmentation", 
                 horizontalalignment='center', verticalalignment='center')
        plt.title("Segmentation Error")
        plt.axis('off')
    else:
        # Use PCA components if available, otherwise first two features
        if 'pca1' in segmented_data.columns and 'pca2' in segmented_data.columns:
            x = 'pca1'
            y = 'pca2'
        else:
            columns = [col for col in segmented_data.columns if col != 'cluster']
            x = columns[0] if len(columns) > 0 else 'cluster'
            y = columns[1] if len(columns) > 1 else x  # Use x as y if only one column
        
        # Plot each cluster with a different color
        for cluster_id in segmented_data['cluster'].unique():
            cluster_data = segmented_data[segmented_data['cluster'] == cluster_id]
            plt.scatter(
                cluster_data[x], 
                cluster_data[y], 
                alpha=0.7, 
                label=f'Segment {cluster_id}'
            )
        
        plt.title(f'Customer Segments Analysis')
        plt.xlabel(x)
        plt.ylabel(y)
        plt.legend()
        plt.grid(True, alpha=0.3)
    
    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    
    # Convert to base64
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    
    return f"data:image/png;base64,{img_str}"

def _format_result(segmented_data: pd.DataFrame, original_data: pd.DataFrame, visualization: str, segmentation_method: str) -> str:
    """
    Format the segmentation results for display.
    """
    # Count customers in each segment
    segment_counts = segmented_data['cluster'].value_counts().to_dict()
    total_customers = len(segmented_data)
    
    # Create a nice formatted report
    report = [
        f"# Customer Segment Identification - {segmentation_method.upper()} Method\n",
        f"## {len(segment_counts)} Customer Segments Identified\n",
        "### Segment Distribution"
    ]
    
    # Add segment distribution details
    for segment_id, count in segment_counts.items():
        percentage = (count / total_customers) * 100
        report.append(f"- Segment {segment_id}: {count} customers ({percentage:.2f}%)")
    
    # Add visualization section
    if visualization:
        report.append("\n### Segment Visualization")
        report.append("The visualization shows the customer segments plotted in two dimensions.")
        report.append("Each color represents a different customer segment.")
        report.append(f"\n![Customer Segments Visualization]({visualization})")
    
    # Add segment characteristics if we have the original data
    if not original_data.empty and 'cluster' in segmented_data.columns:
        report.append("\n### Segment Characteristics")
        
        # Add cluster labels to the original data
        if len(original_data) == len(segmented_data):
            original_data = original_data.copy()
            original_data['cluster'] = segmented_data['cluster'].values
            
            # Calculate summary statistics for each cluster
            for cluster_id in original_data['cluster'].unique():
                cluster_data = original_data[original_data['cluster'] == cluster_id]
                report.append(f"\n#### Segment {cluster_id} ({len(cluster_data)} customers)")
                
                # Calculate customer type distribution
                if 'Customer_Type' in cluster_data.columns:
                    customer_types = cluster_data['Customer_Type'].value_counts()
                    report.append("**Customer Types:**")
                    for ct, count in customer_types.items():
                        report.append(f"- {ct}: {count} ({count/len(cluster_data)*100:.1f}%)")
                
                # Calculate region distribution
                if 'Region' in cluster_data.columns:
                    regions = cluster_data['Region'].value_counts()
                    report.append("\n**Regions:**")
                    for region, count in regions.head(3).items():
                        report.append(f"- {region}: {count} ({count/len(cluster_data)*100:.1f}%)")
                
                # Calculate key metrics
                report.append("\n**Key Metrics:**")
                if 'avg_order_value' in cluster_data.columns:
                    avg_order = cluster_data['avg_order_value'].mean()
                    report.append(f"- Avg Order Value: ${avg_order:.2f}")
                if 'transaction_count' in cluster_data.columns:
                    avg_trans = cluster_data['transaction_count'].mean()
                    report.append(f"- Avg Transactions: {avg_trans:.1f}")
                if 'total_spend' in cluster_data.columns:
                    avg_spend = cluster_data['total_spend'].mean()
                    report.append(f"- Avg Total Spend: ${avg_spend:.2f}")
                if 'Loyalty_Score' in cluster_data.columns:
                    avg_loyalty = cluster_data['Loyalty_Score'].mean()
                    report.append(f"- Avg Loyalty Score: {avg_loyalty:.1f}")
                if 'recency' in cluster_data.columns:
                    avg_recency = cluster_data['recency'].mean()
                    report.append(f"- Avg Days Since Last Purchase: {avg_recency:.1f}")
    
    # Add next steps section
    report.append("\n### Next Steps")
    report.append("To further analyze these segments, consider:")
    report.append("- Creating targeted marketing campaigns for each segment")
    report.append("- Analyzing product preferences by segment")
    report.append("- Tracking segment performance over time")
    report.append("- Developing segment-specific retention strategies")
    
    return '\n'.join(report) 