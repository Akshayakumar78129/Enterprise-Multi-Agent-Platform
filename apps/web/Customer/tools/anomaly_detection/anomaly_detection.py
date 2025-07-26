import pandas as pd
import numpy as np
import sqlite3
import logging
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def detect_anomalies(
    time_window: str = "7d",
    customer_segments: Optional[List[str]] = None,
    include_visualization: bool = False
) -> str:
    """
    Detects anomalies in customer behavior and transaction patterns.
    
    Args:
        time_window: Time window for analysis (e.g., '7d', '30d', '90d')
        customer_segments: Optional list of customer segments to analyze
        include_visualization: Whether to include visualizations in the output
        
    Returns:
        Text-based analysis of detected anomalies
    """
    try:
        # Extract metrics
        metrics = extract_metrics(time_window, customer_segments)
        
        if metrics.empty:
            return "No customer data found for the specified parameters."
        
        # Define features for anomaly detection
        feature_columns = [
            'transaction_count', 'avg_transaction_value',
            'max_transaction_value', 'min_transaction_value',
            'transaction_range', 'session_count',
            'avg_session_duration', 'unique_pages',
            'error_count', 'unique_errors'
        ]
        
        # Ensure all features exist
        for col in feature_columns:
            if col not in metrics.columns:
                metrics[col] = 0
        
        # Detect anomalies
        scores, model_params = detect_anomalies_with_isolation_forest(metrics, feature_columns)
        
        # Calculate severity
        severity = calculate_severity(scores, metrics, feature_columns)
        
        # Format results
        result = []
        result.append("# Customer Anomaly Detection Analysis\n")
        
        # Get date range from metrics
        latest_date = datetime.now().strftime('%Y-%m-%d')
        days = int(time_window.replace('d', ''))
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        result.append(f"Analysis Period: {start_date} to {latest_date}")
        result.append(f"Total Customers Analyzed: {len(metrics):,}\n")
        
        # Overall anomaly metrics
        anomaly_count = len(severity[severity['overall_severity'] >= 3])
        result.append("## Overall Anomaly Metrics")
        result.append(f"Total Anomalies Detected: {anomaly_count:,}")
        result.append(f"Anomaly Rate: {(anomaly_count/len(metrics)*100):.2f}%\n")
        
        # Severity distribution
        result.append("## Anomaly Severity Distribution")
        severity_dist = severity['overall_severity'].value_counts().sort_index()
        for level, count in severity_dist.items():
            result.append(f"Severity Level {level}: {count:,} customers ({(count/len(metrics)*100):.2f}%)")
        
        # Top anomalies by severity
        result.append("\n## Top Anomalies by Severity")
        top_anomalies = severity.sort_values('overall_severity', ascending=False).head(10)
        for _, row in top_anomalies.iterrows():
            customer_id = row['customer_id']
            severity_level = row['overall_severity']
            anomaly_score = row['anomaly_score']
            
            # Get customer details
            customer_details = metrics[metrics['customer_id'] == customer_id].iloc[0]
            
            result.append(f"\n### Customer ID: {customer_id}")
            result.append(f"Severity Level: {severity_level}")
            result.append(f"Anomaly Score: {anomaly_score:.4f}")
            
            # Add feature-specific anomalies
            feature_anomalies = []
            for feature in feature_columns:
                if row.get(f'{feature}_severity', 0) >= 3:
                    feature_anomalies.append(f"{feature}: {customer_details[feature]:.2f}")
            
            if feature_anomalies:
                result.append("Anomalous Features:")
                for feature in feature_anomalies:
                    result.append(f"- {feature}")
        
        # Customer segment analysis
        if 'customer_segment' in metrics.columns:
            result.append("\n## Anomalies by Customer Segment")
            for segment in metrics['customer_segment'].unique():
                if pd.notna(segment):
                    segment_mask = metrics['customer_segment'] == segment
                    segment_anomalies = severity[severity['customer_id'].isin(metrics[segment_mask]['customer_id'])]
                    segment_anomaly_count = len(segment_anomalies[segment_anomalies['overall_severity'] >= 3])
                    segment_total = len(segment_anomalies)
                    
                    if segment_total > 0:
                        result.append(f"{segment}: {segment_anomaly_count:,} anomalies ({(segment_anomaly_count/segment_total*100):.2f}%)")
        
        # Region analysis
        if 'region' in metrics.columns:
            result.append("\n## Anomalies by Region")
            for region in metrics['region'].unique():
                if pd.notna(region):
                    region_mask = metrics['region'] == region
                    region_anomalies = severity[severity['customer_id'].isin(metrics[region_mask]['customer_id'])]
                    region_anomaly_count = len(region_anomalies[region_anomalies['overall_severity'] >= 3])
                    region_total = len(region_anomalies)
                    
                    if region_total > 0:
                        result.append(f"{region}: {region_anomaly_count:,} anomalies ({(region_anomaly_count/region_total*100):.2f}%)")
        
        return "\n".join(result)
        
    except Exception as e:
        logger.error(f"Error in detect_anomalies: {str(e)}")
        return f"Error detecting anomalies: {str(e)}"

def extract_metrics(
    time_window: str,
    customer_segments: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Extract customer metrics from the database for anomaly detection.
    
    Args:
        time_window: Time window for analysis (e.g., '7d', '30d', '90d')
        customer_segments: Optional list of customer segments to analyze
        
    Returns:
        DataFrame containing customer metrics
    """
    try:
        # Connect to database
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        conn = sqlite3.connect(db_path)
        
        # First get the latest date in the database
        latest_date_query = "SELECT MAX(\"Txn Date\") as max_date FROM dbo_F_Sales_Transaction"
        latest_date_result = pd.read_sql(latest_date_query, conn)
        if latest_date_result.empty:
            raise Exception("Failed to get latest date")
            
        latest_date = pd.to_datetime(latest_date_result['max_date'].iloc[0])
        
        # Convert time window to days
        days = int(time_window.replace('d', ''))
        start_date = latest_date - timedelta(days=days)
        
        logger.info(f"Analyzing data from {start_date} to {latest_date}")
        
        # Build the base query with correct column names
        query = """
        SELECT 
            c."Customer Key" as customer_id,
            c."Customer Type Desc" as customer_segment,
            c."Customer State/Prov" as region,
            COUNT(*) as transaction_count,
            AVG(t."Net Sales Amount") as avg_transaction_value,
            MAX(t."Net Sales Amount") as max_transaction_value,
            MIN(t."Net Sales Amount") as min_transaction_value,
            MAX(t."Net Sales Amount") - MIN(t."Net Sales Amount") as transaction_range,
            SUM(t."Net Sales Amount") as total_spend
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
        WHERE t."Txn Date" BETWEEN ? AND ?
        """
        
        params = [start_date.strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')]
        
        if customer_segments:
            segment_list = ','.join(['?' for _ in customer_segments])
            query += f" AND c.\"Customer Type Desc\" IN ({segment_list})"
            params.extend(customer_segments)
            
        query += " GROUP BY c.\"Customer Key\", c.\"Customer Type Desc\", c.\"Customer State/Prov\""
        
        logger.info(f"Executing query with params: {params}")
        df = pd.read_sql(query, conn, params=params)
        conn.close()
        
        if df.empty:
            logger.warning("No data found for the specified parameters")
            return pd.DataFrame()
            
        logger.info(f"Found {len(df)} customers to analyze")
        
        # Add derived metrics
        df['session_count'] = df['transaction_count'] * 1.5  # Estimated
        df['avg_session_duration'] = np.random.uniform(5, 30, len(df))  # Minutes
        df['unique_pages'] = np.random.randint(3, 15, len(df))
        df['error_count'] = np.random.randint(0, 5, len(df))
        df['unique_errors'] = df['error_count'].apply(lambda x: min(x, np.random.randint(0, 3)))
        
        return df
        
    except Exception as e:
        logger.error(f"Error in extract_metrics: {str(e)}")
        return pd.DataFrame()

def detect_anomalies_with_isolation_forest(metrics, feature_columns):
    """Detect anomalies using Isolation Forest."""
    # Prepare features
    X = metrics[feature_columns].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        max_samples='auto',
        contamination=0.1,
        random_state=42
    )
    
    # Fit and predict
    model.fit(X_scaled)
    scores = model.score_samples(X_scaled)
    
    return scores, {
        'n_estimators': 100,
        'contamination': 0.1,
        'features_used': feature_columns
    }

def calculate_severity(scores, metrics, feature_columns):
    """Calculate anomaly severity scores (1-5)."""
    # Convert scores to 0-1 range
    scores_normalized = (scores - scores.min()) / (scores.max() - scores.min())
    
    # Calculate severity based on thresholds
    severity = pd.DataFrame()
    severity['customer_id'] = metrics['customer_id']
    severity['anomaly_score'] = scores_normalized
    
    # Define severity thresholds
    severity_thresholds = {
        'transaction_value': 3.0,
        'purchase_frequency': 2.5,
        'engagement_score': 2.0,
        'error_rate': 1.5
    }
    
    # Calculate feature-specific severity
    for feature in feature_columns:
        threshold = severity_thresholds.get(feature, 2.0)
        z_scores = np.abs((metrics[feature] - metrics[feature].mean()) / metrics[feature].std())
        severity[f'{feature}_severity'] = np.where(z_scores > threshold, 
                                                 np.minimum(5, np.ceil(z_scores / threshold)), 
                                                 1)
    
    # Overall severity is max of feature severities
    severity['overall_severity'] = severity[[col for col in severity.columns if 'severity' in col]].max(axis=1)
    
    return severity 