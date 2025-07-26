import pandas as pd
import numpy as np
from typing import List, Dict, Any, Union
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from datetime import datetime, timedelta
import seaborn as sns
import logging
import io

# Setup logger
logger = logging.getLogger(__name__)

def preprocess_behavioral_data(
    customer_data: pd.DataFrame, 
    transaction_data: pd.DataFrame,
    min_transactions: int = 2
) -> pd.DataFrame:
    """
    Preprocesses customer and transaction data for behavior analysis.
    
    Args:
        customer_data: DataFrame containing customer information
        transaction_data: DataFrame containing transaction information
        min_transactions: Minimum number of transactions required for a customer
        
    Returns:
        DataFrame with preprocessed data
    """
    try:
        # Convert dates if they're strings
        if not transaction_data.empty:
            transaction_data['transaction_date'] = pd.to_datetime(transaction_data['transaction_date'], errors='coerce')
            transaction_data['sales_amount'] = pd.to_numeric(transaction_data['sales_amount'], errors='coerce')
            transaction_data['quantity'] = pd.to_numeric(transaction_data['quantity'], errors='coerce')
            
            # Remove any rows with invalid dates or amounts
            transaction_data = transaction_data.dropna(subset=['transaction_date', 'sales_amount', 'quantity'])
            
        if not customer_data.empty:
            for col in ['customer_since', 'last_activity_date']:
                if col in customer_data.columns:
                    customer_data[col] = pd.to_datetime(customer_data[col], errors='coerce')
        
        # Calculate customer metrics
        customer_metrics = transaction_data.groupby("customer_id").agg({
            "transaction_date": ["count", "min", "max"],
            "sales_amount": ["sum", "mean", "std"],
            "quantity": ["sum", "mean"]
        })
        
        # Flatten the multi-index columns
        customer_metrics.columns = ["_".join(col).strip() for col in customer_metrics.columns.values]
        customer_metrics.reset_index(inplace=True)
        
        # Calculate days between first and last purchase
        customer_metrics["days_between_purchases"] = (
            customer_metrics["transaction_date_max"] - customer_metrics["transaction_date_min"]
        ).dt.days
        
        # Calculate purchase frequency (transactions per month)
        customer_metrics["purchase_frequency"] = (
            customer_metrics["transaction_date_count"] / 
            (customer_metrics["days_between_purchases"] / 30)
        ).fillna(0)
        
        # Define frequency categories
        if customer_metrics["purchase_frequency"].max() > 0:
            customer_metrics["frequency_category"] = pd.cut(
                customer_metrics["purchase_frequency"],
                bins=[0, 0.5, 1, 2, float('inf')],
                labels=["Low", "Medium", "High", "Very High"]
            ).astype(str)
        else:
            customer_metrics["frequency_category"] = "Low"
        
        # Filter customers with minimum transactions
        filtered_metrics = customer_metrics[customer_metrics["transaction_date_count"] >= min_transactions]
        
        # Merge with customer data
        if not customer_data.empty:
            result = pd.merge(filtered_metrics, customer_data, on="customer_id", how="left")
        else:
            result = filtered_metrics
            
        # Calculate recency (days since last purchase)
        now = pd.Timestamp.now()
        if "last_activity_date" in result.columns:
            result["recency"] = (now - result["last_activity_date"]).dt.days
        else:
            result["recency"] = (now - result["transaction_date_max"]).dt.days
            
        # Calculate CLV (simple version: avg order value * purchase frequency * customer lifetime in months)
        if "customer_since" in result.columns:
            result["customer_lifetime_months"] = (
                (now - result["customer_since"]).dt.days / 30
            )
            result["estimated_clv"] = (
                result["sales_amount_mean"] * 
                result["purchase_frequency"] * 
                result["customer_lifetime_months"]
            )
        
        # Get product preferences per customer
        product_preferences = _get_product_preferences(transaction_data)
        if not product_preferences.empty:
            result = pd.merge(result, product_preferences, on="customer_id", how="left")
            
        # Get channel preferences per customer
        channel_preferences = _get_channel_preferences(transaction_data)
        if not channel_preferences.empty:
            result = pd.merge(result, channel_preferences, on="customer_id", how="left")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in preprocess_behavioral_data: {str(e)}")
        # Return at least the original customer data
        return customer_data

def _get_product_preferences(transaction_data: pd.DataFrame) -> pd.DataFrame:
    """
    Analyzes product preferences for each customer.
    """
    if "product_category" not in transaction_data.columns:
        return pd.DataFrame()
        
    # Get top product category per customer
    top_categories = (
        transaction_data.groupby(["customer_id", "product_category"])
        .agg({"sales_amount": "sum"})
        .reset_index()
    )
    
    # Find preferred category (highest sales amount)
    preferred_categories = (
        top_categories.loc[
            top_categories.groupby("customer_id")["sales_amount"].idxmax()
        ]
        [["customer_id", "product_category"]]
        .rename(columns={"product_category": "preferred_category"})
    )
    
    return preferred_categories

def _get_channel_preferences(transaction_data: pd.DataFrame) -> pd.DataFrame:
    """
    Analyzes sales channel preferences for each customer.
    """
    if "sales_channel" not in transaction_data.columns:
        return pd.DataFrame()
        
    # Get top channel per customer
    top_channels = (
        transaction_data.groupby(["customer_id", "sales_channel"])
        .agg({"transaction_date": "count"})
        .reset_index()
        .rename(columns={"transaction_date": "transactions"})
    )
    
    # Find preferred channel (highest number of transactions)
    preferred_channels = (
        top_channels.loc[
            top_channels.groupby("customer_id")["transactions"].idxmax()
        ]
        [["customer_id", "sales_channel"]]
        .rename(columns={"sales_channel": "preferred_channel"})
    )
    
    return preferred_channels

def analyze_purchase_patterns(data: pd.DataFrame, time_period: str) -> Dict[str, Any]:
    """
    Analyzes purchase patterns from the processed data.
    
    Args:
        data: Preprocessed customer and transaction data
        time_period: Time period for the analysis
        
    Returns:
        Dictionary with purchase pattern insights
    """
    try:
        # Calculate frequency distribution
        frequency_distribution = data["frequency_category"].value_counts(normalize=True).to_dict()
        
        # Calculate average time between purchases
        avg_time_between_purchases = data["days_between_purchases"].mean()
        
        # Calculate purchasing cycles
        purchasing_cycles = {}
        if time_period in ["monthly", "quarterly", "annual"]:
            # This would require more transaction data with timestamps
            # Here we use a placeholder
            purchasing_cycles = {
                "weekly_shoppers_pct": round(data[data["purchase_frequency"] >= 4].shape[0] / data.shape[0] * 100, 2),
                "monthly_shoppers_pct": round(data[(data["purchase_frequency"] >= 1) & (data["purchase_frequency"] < 4)].shape[0] / data.shape[0] * 100, 2),
                "quarterly_shoppers_pct": round(data[(data["purchase_frequency"] >= 0.3) & (data["purchase_frequency"] < 1)].shape[0] / data.shape[0] * 100, 2),
                "irregular_shoppers_pct": round(data[data["purchase_frequency"] < 0.3].shape[0] / data.shape[0] * 100, 2)
            }
        
        # Calculate spend patterns
        spend_patterns = {
            "avg_order_value": round(data["sales_amount_mean"].mean(), 2),
            "median_order_value": round(data["sales_amount_mean"].median(), 2),
            "avg_items_per_order": round(data["quantity_mean"].mean(), 2)
        }
        
        # Combine all purchase pattern insights
        return {
            "frequency_distribution": {k: round(v * 100, 2) for k, v in frequency_distribution.items()},
            "avg_days_between_purchases": round(avg_time_between_purchases, 2),
            "purchasing_cycles": purchasing_cycles,
            "spend_patterns": spend_patterns
        }
    
    except Exception as e:
        logger.error(f"Error in analyze_purchase_patterns: {str(e)}")
        return {"error": f"Failed to analyze purchase patterns: {str(e)}"}

def calculate_behavioral_metrics(data: pd.DataFrame, behavior_types: List[str]) -> Dict[str, Any]:
    """Calculate behavioral metrics for customers."""
    try:
        if data is None or data.empty:
            logger.warning("No data provided for behavioral metrics calculation")
            return {"error": "No data available for analysis"}

        # Ensure required columns exist
        required_columns = ['customer_id', 'transaction_date', 'sales_amount', 'quantity']
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return {"error": f"Missing required columns: {missing_columns}"}

        # Convert columns to proper types
        data = data.copy()
        data['transaction_date'] = pd.to_datetime(data['transaction_date'], errors='coerce')
        data['sales_amount'] = pd.to_numeric(data['sales_amount'], errors='coerce')
        data['quantity'] = pd.to_numeric(data['quantity'], errors='coerce')

        # Calculate basic metrics
        metrics = data.groupby('customer_id', as_index=False).agg({
            'transaction_date': ['min', 'max', 'count'],
            'sales_amount': ['sum', 'mean', 'std'],
            'quantity': ['sum', 'mean', 'std']
        })

        # Flatten column names
        metrics.columns = ['_'.join(col).strip('_') for col in metrics.columns.values]

        # Calculate derived metrics
        metrics['purchase_frequency'] = metrics['transaction_date_count'] / (
            (metrics['transaction_date_max'] - metrics['transaction_date_min']).dt.days / 365
        ).replace(0, np.nan)

        # Calculate shopper categories using proper boolean indexing
        weekly_shoppers = metrics.loc[metrics['purchase_frequency'] >= 4].shape[0]
        monthly_shoppers = metrics.loc[(metrics['purchase_frequency'] >= 1) & (metrics['purchase_frequency'] < 4)].shape[0]
        quarterly_shoppers = metrics.loc[(metrics['purchase_frequency'] >= 0.3) & (metrics['purchase_frequency'] < 1)].shape[0]
        irregular_shoppers = metrics.loc[metrics['purchase_frequency'] < 0.3].shape[0]
        total_customers = metrics.shape[0]

        results = {
            "weekly_shoppers_pct": round(weekly_shoppers / total_customers * 100, 2),
            "monthly_shoppers_pct": round(monthly_shoppers / total_customers * 100, 2),
            "quarterly_shoppers_pct": round(quarterly_shoppers / total_customers * 100, 2),
            "irregular_shoppers_pct": round(irregular_shoppers / total_customers * 100, 2)
        }

        # Calculate product preferences
        if 'product_preferences' in behavior_types:
            product_data = data.groupby(['customer_id', 'product_id'], as_index=False).agg({
                'quantity': 'sum',
                'sales_amount': 'sum'
            })
            
            # Get top products for each customer
            top_products = product_data.sort_values(['customer_id', 'sales_amount'], ascending=[True, False])
            top_products = top_products.groupby('customer_id', as_index=False).head(5)
            
            results["product_preferences"] = {
                "top_products": top_products.to_dict('records')
            }

        # Calculate channel usage
        if 'channel_usage' in behavior_types:
            channel_data = data.groupby(['customer_id', 'channel'], as_index=False).agg({
                'sales_amount': 'sum',
                'quantity': 'sum'
            })
            
            results["channel_usage"] = {
                "channel_distribution": channel_data.to_dict('records')
            }

        # Calculate engagement metrics
        if 'engagement_metrics' in behavior_types:
            now = pd.Timestamp.now()
            metrics['recency'] = (now - metrics['transaction_date_max']).dt.days
            
            # Calculate churn risk
            churn_risk = metrics.loc[metrics['recency'] > 90].shape[0]
            results["engagement_metrics"] = {
                "churn_risk_percentage": round(churn_risk / total_customers * 100, 2)
            }

        return results

    except Exception as e:
        logger.error(f"Error calculating behavioral metrics: {str(e)}")
        return {"error": str(e)}

def visualize_behavior_patterns(data: pd.DataFrame, behavior_types: List[str]) -> Dict[str, str]:
    """
    Creates visualizations for the behavior analysis.
    
    Args:
        data: Preprocessed customer data
        behavior_types: List of behavior types to visualize
        
    Returns:
        Dictionary with visualization descriptions
    """
    visualizations = {}
    
    try:
        # Create a function to convert matplotlib figures to base64 strings
        def fig_to_base64(fig):
            buf = BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight")
            buf.seek(0)
            img_str = base64.b64encode(buf.read()).decode('utf-8')
            base64_url = f"data:image/png;base64,{img_str}"
            print(f"Base64 Image URL: {base64_url}")
            return ""
        
        # Purchase patterns visualization
        if "purchase_patterns" in behavior_types and "frequency_category" in data.columns:
            fig, ax = plt.subplots(figsize=(10, 6))
            data["frequency_category"].value_counts().plot(kind="bar", ax=ax)
            ax.set_title("Purchase Frequency Distribution")
            ax.set_xlabel("Frequency Category")
            ax.set_ylabel("Number of Customers")
            
            visualizations["purchase_frequency"] = fig_to_base64(fig)
            plt.close(fig)
            
            # Create a histogram of average order values
            fig, ax = plt.subplots(figsize=(10, 6))
            data["sales_amount_mean"].hist(bins=20, ax=ax)
            ax.set_title("Distribution of Average Order Values")
            ax.set_xlabel("Average Order Value")
            ax.set_ylabel("Number of Customers")
            
            visualizations["order_value_distribution"] = fig_to_base64(fig)
            plt.close(fig)
        
        # Product preferences visualization
        if "product_preferences" in behavior_types and "product_category" in data.columns:
            fig, ax = plt.subplots(figsize=(10, 6))
            data["product_category"].value_counts().plot(kind="pie", autopct="%1.1f%%", ax=ax)
            ax.set_title("Preferred Product Categories")
            ax.set_ylabel("")
            
            visualizations["product_categories"] = fig_to_base64(fig)
            plt.close(fig)
        
        # Channel usage visualization
        if "channel_usage" in behavior_types and "sales_channel" in data.columns:
            fig, ax = plt.subplots(figsize=(10, 6))
            data["sales_channel"].value_counts().plot(kind="bar", ax=ax)
            ax.set_title("Preferred Sales Channels")
            ax.set_xlabel("Sales Channel")
            ax.set_ylabel("Number of Customers")
            
            visualizations["sales_channels"] = fig_to_base64(fig)
            plt.close(fig)
            
            # Compare average spend by channel
            if len(data["sales_channel"].unique()) > 1:
                fig, ax = plt.subplots(figsize=(10, 6))
                sns.barplot(x="sales_channel", y="sales_amount_mean", data=data, ax=ax)
                ax.set_title("Average Order Value by Preferred Channel")
                ax.set_xlabel("Sales Channel")
                ax.set_ylabel("Average Order Value")
                
                visualizations["channel_order_value"] = fig_to_base64(fig)
                plt.close(fig)
        
        # Engagement metrics visualization
        if "engagement_metrics" in behavior_types and "recency_category" in data.columns:
            fig, ax = plt.subplots(figsize=(10, 6))
            data["recency_category"].value_counts().plot(kind="bar", ax=ax)
            ax.set_title("Customer Recency Distribution")
            ax.set_xlabel("Recency Category")
            ax.set_ylabel("Number of Customers")
            
            visualizations["customer_recency"] = fig_to_base64(fig)
            plt.close(fig)
            
            # Engagement score distribution
            if "engagement_score" in data.columns:
                fig, ax = plt.subplots(figsize=(10, 6))
                data["engagement_score"].hist(bins=20, ax=ax)
                ax.set_title("Customer Engagement Score Distribution")
                ax.set_xlabel("Engagement Score")
                ax.set_ylabel("Number of Customers")
                
                visualizations["engagement_scores"] = fig_to_base64(fig)
                plt.close(fig)
    
    except Exception as e:
        logger.error(f"Error in visualize_behavior_patterns: {str(e)}")
        visualizations["error"] = f"Failed to generate some visualizations: {str(e)}"
    
    return visualizations 