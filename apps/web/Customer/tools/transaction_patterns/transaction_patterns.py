import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3
import logging
import os
from typing import Dict, List, Optional
from mlxtend.frequent_patterns import apriori, association_rules
from sklearn.ensemble import IsolationForest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TransactionPatternAnalyzer:
    """Analyzes transaction patterns and identifies anomalies."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        
    def _fetch_transaction_data(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        try:
            conn = sqlite3.connect(self.db_path)
            date_filter = ""
            if start_date and end_date:
                date_filter = f"WHERE t.\"Txn Date\" BETWEEN '{start_date}' AND '{end_date}'"
            
            query = f"""
            WITH TransactionDetails AS (
                SELECT 
                    t."Sales Txn Key" as transaction_id,
                    t."Customer Key" as customer_id,
                    t."Txn Date" as timestamp,
                    t."Net Sales Amount" as total_value,
                    t."Unit of Measure" as payment_method,
                    GROUP_CONCAT(i."Item Category Hrchy Key", ';') as product_categories,
                    t."Location Code" as location,
                    t."Discount Reason" as promotion_applied
                FROM 
                    dbo_F_Sales_Transaction t
                LEFT JOIN 
                    dbo_F_Sales_Transaction i ON t."Item Category Hrchy Key" = i."Item Category Hrchy Key"
                {date_filter}
                GROUP BY 
                    t."Sales Txn Key"
            )
            SELECT * FROM TransactionDetails
            """
            
            data = pd.read_sql_query(query, conn)
            
            if data.empty:
                logger.warning("No transaction data found")
                return pd.DataFrame()
            
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            data['product_categories'] = data['product_categories'].fillna('').str.split(';')
            
            return data
            
        except Exception as e:
            logger.error(f"Error fetching transaction data: {str(e)}")
            return pd.DataFrame()

    def _create_basket_matrix(self, transactions: pd.DataFrame) -> pd.DataFrame:
        basket_data = transactions.explode('product_categories')
        basket_matrix = pd.crosstab(
            basket_data['transaction_id'],
            basket_data['product_categories']
        ).astype(bool)
        return basket_matrix

    def _detect_anomalies(self, transactions: pd.DataFrame) -> np.ndarray:
        features = pd.DataFrame({
            'total_value': transactions['total_value'],
            'hour': transactions['timestamp'].dt.hour,
            'day_of_week': transactions['timestamp'].dt.dayofweek,
            'products_count': transactions['product_categories'].str.len()
        })
        
        self.anomaly_detector.fit(features)
        return self.anomaly_detector.predict(features)

    def analyze_patterns(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> str:
        """Analyze transaction patterns and return insights in markdown format."""
        data = self._fetch_transaction_data(start_date, end_date)
        if data.empty:
            return "No transaction data available for analysis."
        
        basket_matrix = self._create_basket_matrix(data)
        
        try:
            frequent_itemsets = apriori(
                basket_matrix,
                min_support=0.01,
                use_colnames=True
            )
            
            if len(frequent_itemsets) > 0:
                rules = association_rules(
                    frequent_itemsets,
                    metric="lift",
                    min_threshold=1.0
                )
                rules['antecedents'] = rules['antecedents'].apply(list)
                rules['consequents'] = rules['consequents'].apply(list)
            else:
                rules = pd.DataFrame()
        except Exception as e:
            logger.error(f"Error in association rule mining: {str(e)}")
            rules = pd.DataFrame()
        
        anomaly_labels = self._detect_anomalies(data)
        anomaly_rate = float((anomaly_labels == -1).mean())
        
        # Generate text-based insights
        insights = []
        
        # Transaction Overview
        insights.append("# Transaction Pattern Analysis\n")
        insights.append(f"Total Transactions Analyzed: {len(data):,}")
        insights.append(f"Analysis Period: {data['timestamp'].min().date()} to {data['timestamp'].max().date()}\n")
        
        # Temporal Patterns
        insights.append("## Temporal Patterns")
        
        # Hourly patterns
        hourly_dist = data['timestamp'].dt.hour.value_counts(normalize=True)
        peak_hours = hourly_dist.nlargest(3)
        insights.append("\n### Peak Transaction Hours")
        for hour, pct in peak_hours.items():
            insights.append(f"- {hour:02d}:00: {pct:.1%} of transactions")
        
        # Daily patterns
        daily_dist = data['timestamp'].dt.day_name().value_counts(normalize=True)
        insights.append("\n### Daily Distribution")
        for day, pct in daily_dist.items():
            insights.append(f"- {day}: {pct:.1%}")
        
        # Payment Methods
        insights.append("\n## Payment Method Distribution")
        payment_dist = data['payment_method'].value_counts(normalize=True)
        for method, pct in payment_dist.items():
            insights.append(f"- {method}: {pct:.1%}")
        
        # Product Combinations
        if not rules.empty:
            insights.append("\n## Top Product Combinations")
            top_rules = rules.nlargest(5, 'lift')
            for _, rule in top_rules.iterrows():
                antecedents = ' + '.join(rule['antecedents'])
                consequents = ' + '.join(rule['consequents'])
                insights.append(f"- When customers buy {antecedents}, they are {rule['lift']:.1f}x more likely to also buy {consequents}")
        
        # Anomaly Detection
        insights.append(f"\n## Anomaly Detection")
        insights.append(f"- {anomaly_rate:.1%} of transactions flagged as potentially anomalous")
        insights.append(f"- Based on patterns in transaction value, timing, and basket size")
        
        return "\n".join(insights)

def analyze_transaction_patterns(start_date: Optional[str] = None, end_date: Optional[str] = None) -> str:
    """
    Analyze transaction patterns and return insights in markdown format.
    
    Args:
        start_date (str, optional): Start date for analysis (YYYY-MM-DD). Defaults to 30 days ago.
        end_date (str, optional): End date for analysis (YYYY-MM-DD). Defaults to today.
    
    Returns:
        str: Markdown formatted analysis results
    """
    # Set default date range to cover known data period if no dates provided
    if not start_date or not end_date:
        # For testing purposes, we're using a period where we know data exists
        end_date = "2019-12-31"
        start_date = "2019-01-01"
    
    db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    analyzer = TransactionPatternAnalyzer(db_path)
    return analyzer.analyze_patterns(start_date, end_date) 