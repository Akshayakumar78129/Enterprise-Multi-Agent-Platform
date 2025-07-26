from json import tool
import os
import pandas as pd
import numpy as np
import sqlite3
from pathlib import Path
import plotly.graph_objects as go
import plotly.express as px
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from xgboost import XGBRegressor
import json
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, List, Any
# from google.adk.tools import tool
from pydantic import BaseModel, Field
import sys
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error

# Import the DatabaseConnector
try:
    from ...database.connector import DatabaseConnector
except (ImportError, ValueError):
    # When running as script or in test from local directory
    # Add the project root to path
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from Finance.database.connector import DatabaseConnector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("financial_tools.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("FinancialTools")

# Define the fixed database path - use the one that works as shown in the logs
FIXED_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "financial_agent.db")

# Configure database path
def setup_database_path():
    """Configure database path for the application"""
    try:
        # Set database path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "financial_agent.db")
        
        # Set environment variables
        os.environ["DB_TYPE"] = "sqlite"
        os.environ["DB_NAME"] = db_path
        
        logger.info(f"Database path set to: {db_path}")
        return True
    except Exception as e:
        logger.error(f"Error setting up database path: {e}")
        return False

# Initialize database
db_configured = setup_database_path()

def get_db_connection():
    """Get a database connection using the DatabaseConnector"""
    try:
        # Get the database path
        db_path = get_db_path()
        
        # Create a direct connection - more reliable for testing
        conn = sqlite3.connect(db_path)
        return conn
    except Exception as e:
        logger.error(f"Error getting database connection: {str(e)}")
        return None

def get_db_path():
    """Get the database path from environment or use default"""
    # Get the database path from the environment variables
    db_path = os.environ.get("DB_NAME")
    if not db_path:
        # Fallback to the fixed path
        db_path = FIXED_DB_PATH
    
    logger.info(f"Using database path: {db_path}")
    return db_path

def print_db_info():
    """Print database information for debugging"""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        
        print("📋 Tables in the database:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for table in tables:
            print(f" - {table[0]}")
            
            # For each table, check if there's data and print the structure
            try:
                cursor.execute(f"SELECT COUNT(*) FROM [{table[0]}]")
                count = cursor.fetchone()[0]
                print(f"   - Row count: {count}")
                
                cursor.execute(f"PRAGMA table_info([{table[0]}])")
                columns = cursor.fetchall()
                if columns:
                    print(f"   - First few column names: {[col[1] for col in columns[:3]]}")
            except sqlite3.Error as e:
                print(f"   - Error accessing table: {str(e)}")
                
        conn.close()
        
    except Exception as e:
        print(f"Error getting database info: {str(e)}")

def test_table_query(table_name):
    """Test if we can query a specific table"""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        
        print(f"Testing query for table: {table_name}")
        # Try different quoting styles
        for query in [
            f"SELECT * FROM {table_name} LIMIT 1",
            f"SELECT * FROM [{table_name}] LIMIT 1",
            f"SELECT * FROM \"{table_name}\" LIMIT 1",
            f"SELECT * FROM '{table_name}' LIMIT 1"
        ]:
            try:
                print(f"Trying query: {query}")
                cursor.execute(query)
                result = cursor.fetchone()
                print(f"Success! Result: {result}")
                return query.split("FROM ")[1].split(" LIMIT")[0]  # Return the successful table reference style
            except sqlite3.Error as e:
                print(f"Error with query: {str(e)}")
                
        conn.close()
        return None
        
    except Exception as e:
        print(f"Error testing table query: {str(e)}")
        return None

# @tool
def cash_flow_analysis(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
) -> str:
    """
    Analyze cash flow patterns and trends over a specific time period.
    Identifies inflows, outflows, seasonal patterns and potential anomalies.
    
    Args:
        start_date: Optional start date in YYYY-MM-DD format. If not provided, defaults to 3 months before the latest data.
        end_date: Optional end date in YYYY-MM-DD format. If not provided, uses the latest data available.
    
    Returns:
        JSON string with cash flow analysis results including metrics, seasonal patterns, and anomalies.
    """
    try:
        db_path = get_db_path()
        logger.info(f"Cash flow analysis with db_path={db_path}, start_date={start_date}, end_date={end_date}")
        
        # Connect to database using the connector
        conn = get_db_connection()
        
        # Construct date filters if provided
        date_filter = ""
        params = {}
        
        # If no dates provided, use the last 3 months by default
        if not start_date and not end_date:
            logger.info("No date range specified, defaulting to last 3 months")
            query = """
            SELECT MIN("Posting Date") as earliest_date, MAX("Posting Date") as latest_date
            FROM \"\"\"dbo_F_GL_Transaction\"\"\"
            """
            try:
                date_range = pd.read_sql_query(query, conn)
                if not date_range.empty:
                    latest_date = pd.to_datetime(date_range['latest_date'].iloc[0])
                    # Default to 3 months before the latest date
                    earliest_date = latest_date - pd.DateOffset(months=3)
                    start_date = earliest_date.strftime('%Y-%m-%d')
                    logger.info(f"Using default date range: {start_date} to {latest_date.strftime('%Y-%m-%d')}")
            except Exception as e:
                logger.error(f"Error determining default date range: {str(e)}")
        
        if start_date:
            date_filter += " AND \"Posting Date\" >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            date_filter += " AND \"Posting Date\" <= :end_date"
            params['end_date'] = end_date
        
        # Query GL transactions
        query = f"""
        SELECT * FROM \"\"\"dbo_F_GL_Transaction\"\"\"
        WHERE 1=1 {date_filter}
        """
        
        logger.info(f"Executing cash flow query with filter: {date_filter}")
        
        gl_transactions = pd.read_sql_query(query, conn, params=params)
        
        if len(gl_transactions) == 0:
            logger.warning(f"No cash flow data found for the specified period (start_date={start_date}, end_date={end_date})")
            return json.dumps({"error": f"No data found for the specified period. Please try a different date range."})
        
        logger.info(f"Found {len(gl_transactions)} transactions for cash flow analysis")
        
        # Convert posting date to datetime
        gl_transactions['Posting Date'] = pd.to_datetime(gl_transactions['Posting Date'])
        
        # Calculate daily cash flows
        cash_flows = gl_transactions.groupby('Posting Date')['Txn Amount'].sum().reset_index()
        cash_flows['Cumulative Cash Flow'] = cash_flows['Txn Amount'].cumsum()
        
        # Calculate key metrics
        metrics = {
            'total_inflow': float(gl_transactions[gl_transactions['Txn Amount'] > 0]['Txn Amount'].sum()),
            'total_outflow': float(gl_transactions[gl_transactions['Txn Amount'] < 0]['Txn Amount'].sum()),
            'net_cash_flow': float(gl_transactions['Txn Amount'].sum()),
            'daily_average': float(cash_flows['Txn Amount'].mean()),
            'daily_volatility': float(cash_flows['Txn Amount'].std())
        }
        
        # Identify seasonal patterns
        cash_flows['Month'] = cash_flows['Posting Date'].dt.month
        seasonal_patterns_df = cash_flows.groupby('Month')['Txn Amount'].agg(['mean', 'std'])
        
        # Convert seasonal patterns to JSON-serializable format
        seasonal_patterns = {}
        for month, row in seasonal_patterns_df.iterrows():
            seasonal_patterns[int(month)] = {
                'mean': float(row['mean']),
                'std': float(row['std'])
            }
        
        # Detect anomalies (only if we have enough data)
        anomalies = []
        if len(cash_flows) > 10:
            isolation_forest = IsolationForest(contamination=0.1, random_state=42)
            cash_flows['is_anomaly'] = isolation_forest.fit_predict(cash_flows[['Txn Amount']])
            anomalies_df = cash_flows[cash_flows['is_anomaly'] == -1]
            
            # Convert anomalies to JSON-serializable format
            for _, row in anomalies_df.iterrows():
                anomalies.append({
                    'Posting Date': row['Posting Date'].strftime('%Y-%m-%d'),
                    'Txn Amount': float(row['Txn Amount']),
                    'Cumulative Cash Flow': float(row['Cumulative Cash Flow'])
                })
        
        # Generate visualization
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=cash_flows['Posting Date'],
            y=cash_flows['Cumulative Cash Flow'],
            name='Cumulative Cash Flow'
        ))
        
        if anomalies:
            anomalies_dates = [pd.to_datetime(anomaly['Posting Date']) for anomaly in anomalies]
            anomalies_amounts = [anomaly['Txn Amount'] for anomaly in anomalies]
            
            fig.add_trace(go.Scatter(
                x=anomalies_dates,
                y=anomalies_amounts,
                mode='markers',
                name='Anomalies',
                marker=dict(color='red', size=10)
            ))
        
        fig.update_layout(title='Cash Flow Analysis')
        
        # Save visualization
        reports_path = Path(os.path.join(os.path.dirname(__file__), "reports"))
        reports_path.mkdir(parents=True, exist_ok=True)
        viz_path = str(reports_path / f'cash_flow_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html')
        fig.write_html(viz_path)
        
        result = {
            'metrics': metrics,
            'seasonal_patterns': seasonal_patterns,
            'anomalies': anomalies,
            'visualization_path': viz_path
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        error_msg = f"Error during cash flow analysis: {str(e)}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg})
    finally:
        if 'conn' in locals() and conn:
            conn.close()


# @tool
def revenue_forecast(days_ahead: int = 30) -> str:
    """
    Forecast revenue for future periods using machine learning models.
    
    Args:
        days_ahead: Number of days to forecast into the future (default is 30)
    
    Returns:
        JSON string with revenue forecast results including predicted values, accuracy metrics, and model importance.
    """
    try:
        db_path = get_db_path()
        logger.info(f"Revenue forecast requested for {days_ahead} days ahead using db_path={db_path}")
        
        # Connect to database using the connector
        conn = get_db_connection()
        
        # Query GL transactions (only positive amounts represent revenue)
        query = """
            SELECT * FROM \"\"\"dbo_F_GL_Transaction\"\"\"
            WHERE "Txn Amount" > 0
            """
        
        gl_transactions = pd.read_sql_query(query, conn)
        
        if len(gl_transactions) == 0:
            logger.warning("No revenue data found for forecasting")
            return json.dumps({"error": "No revenue data found"})
        
        # Convert posting date to datetime
        gl_transactions['Posting Date'] = pd.to_datetime(gl_transactions['Posting Date'])
        
        # Aggregate by posting date to get daily revenue
        daily_revenue = gl_transactions.groupby('Posting Date')['Txn Amount'].sum().reset_index()
        logger.info(f"Aggregated {len(gl_transactions)} transactions into {len(daily_revenue)} daily revenue entries")
        
        if len(daily_revenue) < 30:
            logger.warning(f"Insufficient data for forecasting: only {len(daily_revenue)} days available")
            return json.dumps({"error": "Insufficient data for forecasting (need at least 30 days)"})
        
        # Handle outliers (clip values above 3 std dev from mean to reduce their impact)
        revenue_mean = daily_revenue['Txn Amount'].mean()
        revenue_std = daily_revenue['Txn Amount'].std()
        outlier_threshold = revenue_mean + 3 * revenue_std
        
        original_max = daily_revenue['Txn Amount'].max()
        outlier_count = len(daily_revenue[daily_revenue['Txn Amount'] > outlier_threshold])
        
        if outlier_count > 0:
            logger.info(f"Detected {outlier_count} outliers above {outlier_threshold:.2f} (max value: {original_max:.2f})")
            daily_revenue.loc[daily_revenue['Txn Amount'] > outlier_threshold, 'Txn Amount'] = outlier_threshold
            logger.info(f"Clipped outliers to max value of {outlier_threshold:.2f}")
        
        # Create features based on the posting date
        daily_revenue['day_of_week'] = daily_revenue['Posting Date'].dt.dayofweek
        daily_revenue['month'] = daily_revenue['Posting Date'].dt.month
        daily_revenue['year'] = daily_revenue['Posting Date'].dt.year
        daily_revenue['day_of_month'] = daily_revenue['Posting Date'].dt.day
        daily_revenue['day_of_year'] = daily_revenue['Posting Date'].dt.dayofyear
        
        # Add lag features
        daily_revenue = daily_revenue.sort_values('Posting Date')
        daily_revenue['lag_1'] = daily_revenue['Txn Amount'].shift(1)
        daily_revenue['lag_7'] = daily_revenue['Txn Amount'].shift(7)
        daily_revenue['lag_14'] = daily_revenue['Txn Amount'].shift(14)
        
        # Drop rows with NaN values
        daily_revenue = daily_revenue.dropna()
        logger.info(f"Created features with lag values, {len(daily_revenue)} days after dropping NaN values")
        
        # Prepare data for training
        X = daily_revenue[['day_of_week', 'month', 'year', 'day_of_month', 'day_of_year', 'lag_1', 'lag_7', 'lag_14']]
        y = daily_revenue['Txn Amount']
        
        # Initialize models
        models = {
            'rf': RandomForestRegressor(n_estimators=100, random_state=42),
            'xgb': XGBRegressor(n_estimators=100, random_state=42)
        }
        
        # Cross-validation
        cv_results = {model_name: {'mape': [], 'rmse': []} for model_name in models}
        
        for train_idx, test_idx in TimeSeriesSplit(n_splits=5).split(X):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            for model_name, model in models.items():
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                mape = mean_absolute_percentage_error(y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                
                cv_results[model_name]['mape'].append(mape)
                cv_results[model_name]['rmse'].append(rmse)
        
        # Calculate average metrics
        for model_name in models:
            cv_results[model_name]['mape'] = float(np.mean(cv_results[model_name]['mape']))
            cv_results[model_name]['rmse'] = float(np.mean(cv_results[model_name]['rmse']))
        
        logger.info(f"Cross-validation results: {cv_results}")
        
        # Train final models on all data
        for model_name, model in models.items():
            models[model_name].fit(X, y)
        
        # Get feature importance
        feature_importance = {}
        for model_name, model in models.items():
            if hasattr(model, 'feature_importances_'):
                importances = {}
                for i, feature in enumerate(X.columns):
                    # Convert numpy float32 to Python float
                    importances[feature] = float(model.feature_importances_[i])
                feature_importance[model_name] = importances
        
        # Calculate accuracy metrics based on the in-sample performance
        y_pred_rf = models['rf'].predict(X)
        mape = mean_absolute_percentage_error(y, y_pred_rf) * 100
        rmse = np.sqrt(mean_squared_error(y, y_pred_rf))
        
        logger.info(f"Final model accuracy - MAPE: {mape:.2f}%, RMSE: {rmse:.2f}")
        
        # Generate future dates for prediction
        last_date = daily_revenue['Posting Date'].max()
        future_dates = [last_date + pd.DateOffset(days=i) for i in range(1, days_ahead + 1)]
        
        # Create future features
        future_data = []
        for i, date in enumerate(future_dates):
            # For the very first prediction, use actual values from the data
            if i == 0:
                lag_1 = daily_revenue.iloc[-1]['Txn Amount']
                lag_7 = daily_revenue.iloc[-7]['Txn Amount'] if len(daily_revenue) > 7 else daily_revenue['Txn Amount'].mean()
                lag_14 = daily_revenue.iloc[-14]['Txn Amount'] if len(daily_revenue) > 14 else daily_revenue['Txn Amount'].mean()
            else:
                # For subsequent predictions, use predicted values
                lag_1 = future_data[i-1]['predicted']
                lag_7 = daily_revenue.iloc[-7+i]['Txn Amount'] if i < 7 else future_data[i-7]['predicted']
                lag_14 = daily_revenue.iloc[-14+i]['Txn Amount'] if i < 14 else future_data[i-14]['predicted']
            
            future_data.append({
                'Posting Date': date,
                'day_of_week': date.dayofweek,
                'month': date.month,
                'year': date.year,
                'day_of_month': date.day,
                'day_of_year': date.dayofyear,
                'lag_1': lag_1,
                'lag_7': lag_7,
                'lag_14': lag_14,
                'predicted': 0.0  # Initialize with 0.0
            })
        
        # Convert to DataFrame
        future_df = pd.DataFrame(future_data)
        
        # Make predictions
        X_future = future_df[['day_of_week', 'month', 'year', 'day_of_month', 'day_of_year', 'lag_1', 'lag_7', 'lag_14']]
        
        predictions = {}
        for model_name, model in models.items():
            predictions[model_name] = model.predict(X_future)
        
        # Ensemble predictions (average of models)
        future_df['predicted'] = 0
        for model_name in models:
            # Convert numpy float32 to Python float for each prediction
            future_df['predicted'] += np.array([float(x) for x in predictions[model_name]]) / len(models)
        
        # Generate visualization
        # Combine historical data with forecast
        historical = daily_revenue[['Posting Date', 'Txn Amount']].rename(columns={'Txn Amount': 'actual'})
        forecast = future_df[['Posting Date', 'predicted']]
        
        # Create fitted values for historical data
        historical['fitted'] = np.nan
        for model_name, model in models.items():
            historical['fitted'] += model.predict(X) / len(models)
        
        fig = go.Figure()
        
        # Plot historical data
        fig.add_trace(go.Scatter(
            x=historical['Posting Date'],
            y=historical['actual'],
            mode='lines',
            name='Actual Revenue'
        ))
        
        # Plot fitted values
        fig.add_trace(go.Scatter(
            x=historical['Posting Date'],
            y=historical['fitted'],
            mode='lines',
            name='Fitted Values',
            line=dict(dash='dot')
        ))
        
        # Plot forecast
        fig.add_trace(go.Scatter(
            x=forecast['Posting Date'],
            y=forecast['predicted'],
            mode='lines',
            name='Forecast',
            line=dict(dash='dash')
        ))
        
        fig.update_layout(title='Revenue Forecast', showlegend=True)
        
        # Save visualization
        reports_path = Path(os.path.join(os.path.dirname(__file__), "reports"))
        reports_path.mkdir(parents=True, exist_ok=True)
        viz_path = str(reports_path / f'revenue_forecast_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html')
        fig.write_html(viz_path)
        
        # Prepare forecast results
        forecast_data = []
        for _, row in future_df.iterrows():
            forecast_data.append({
                'Posting Date': row['Posting Date'].strftime('%Y-%m-%d'),
                'predicted': float(row['predicted'])
            })
        
        result = {
            'forecast': forecast_data,
            'forecast_total': float(future_df['predicted'].sum()),
            'accuracy_metrics': {
                'mape': float(mape),
                'rmse': float(rmse)
            },
            'model_importance': feature_importance,
            'visualization_path': viz_path
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        error_msg = f"Error during revenue forecasting: {str(e)}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg})
    finally:
        if 'conn' in locals() and conn:
            conn.close()


# @tool
def analyze_ar_aging(
    aging_buckets: Optional[Dict[str, tuple]] = None,
    include_visualization: bool = True
) -> str:
    """
    Analyzes accounts receivable aging to understand payment patterns 
    and overdue amounts across different aging buckets.
    
    Args:
        aging_buckets: Optional dictionary defining aging buckets for categorizing receivables. 
                      Default is {'current': (0, 30), '31-60_days': (31, 60), '61-90_days': (61, 90), 
                                 '91-120_days': (91, 120), 'over_120_days': (121, inf)}
        include_visualization: Whether to include visualizations in the analysis
    
    Returns:
        Formatted analysis results as a string with AR aging metrics.
    """
    try:
        # Use default buckets if none provided
        if aging_buckets is None:
            aging_buckets = {
                'current': (0, 30),
                '31-60_days': (31, 60),
                '61-90_days': (61, 90),
                '91-120_days': (91, 120),
                'over_120_days': (121, float('inf'))
            }
            
        db_path = get_db_path()
        logger.info(f"AR aging analysis requested using db_path={db_path}")
        
        # Connect to database using the connector
        conn = get_db_connection()
        
        # Since we don't have an AR table, we'll use Sales Transaction data as a proxy
        # This is not ideal but will work for demonstration purposes
        query = """
        SELECT 
            "Customer Key", 
            "Sales Txn Number" as "Invoice Number", 
            "Txn Date" as "Posting Date", 
            "Txn Date" as "Due Date",
            "Net Sales Amount" as "Balance Due Amount"
        FROM \"\"\"dbo_F_Sales_Transaction\"\"\"
        WHERE "Sales Txn Type" = 'Sales Invoice'
        """
        
        ar_data = pd.read_sql_query(query, conn)
        
        if len(ar_data) == 0:
            return json.dumps({"error": "No sales invoice data found to use as accounts receivable proxy"})
        
        # Make sure 'Posting Date' and 'Due Date' are datetime
        ar_data['Posting Date'] = pd.to_datetime(ar_data['Posting Date'])
        ar_data['Due Date'] = pd.to_datetime(ar_data['Due Date'])
        
        # For demonstration purposes, we'll assume invoices are due 30 days after posting
        # And we'll use current date as reference point for aging
        today = datetime.now().date()
        
        # Convert to Python datetime.date objects for calculation
        ar_data['Due Date'] = ar_data['Posting Date'] + pd.DateOffset(days=30)
        ar_data['Due Date'] = ar_data['Due Date'].dt.date
        
        # Calculate days overdue (as of today)
        ar_data['Days Overdue'] = [(today - due_date).days if due_date is not None else 0 for due_date in ar_data['Due Date']]
        ar_data.loc[ar_data['Days Overdue'] < 0, 'Days Overdue'] = 0
        
        # Calculate totals for each bucket
        bucket_totals = {}
        for bucket, (min_days, max_days) in aging_buckets.items():
            bucket_data = ar_data[(ar_data['Days Overdue'] >= min_days) & (ar_data['Days Overdue'] <= max_days)]
            bucket_totals[bucket] = {
                'count': int(len(bucket_data)),
                'amount': float(bucket_data['Balance Due Amount'].sum()),
                'percentage': float(bucket_data['Balance Due Amount'].sum() / ar_data['Balance Due Amount'].sum()) if ar_data['Balance Due Amount'].sum() > 0 else 0
            }
        
        # Calculate overall metrics
        total_overdue = float(ar_data[ar_data['Days Overdue'] > 30]['Balance Due Amount'].sum())
        total_current = float(ar_data[ar_data['Days Overdue'] <= 30]['Balance Due Amount'].sum())
        total_ar = float(ar_data['Balance Due Amount'].sum())
        percent_overdue = (total_overdue / total_ar) * 100 if total_ar > 0 else 0
        
        avg_days_outstanding = float(ar_data['Days Overdue'].mean())
        weighted_avg_days = float((ar_data['Days Overdue'] * ar_data['Balance Due Amount']).sum() / total_ar) if total_ar > 0 else 0
        
        # Calculate customer metrics
        customer_counts = ar_data.groupby('Customer Key').size().reset_index(name='count')
        customers_with_overdue = ar_data[ar_data['Days Overdue'] > 30]['Customer Key'].nunique()
        total_customers = ar_data['Customer Key'].nunique()
        percent_customers_overdue = (customers_with_overdue / total_customers) * 100 if total_customers > 0 else 0
        
        # Identify high-value overdue accounts
        high_value_threshold = total_ar * 0.1  # 10% of total AR
        high_value_overdue = ar_data[(ar_data['Days Overdue'] > 30) & (ar_data['Balance Due Amount'] > high_value_threshold)]
        high_value_accounts = high_value_overdue.groupby('Customer Key')['Balance Due Amount'].sum().reset_index()
        high_value_accounts = high_value_accounts.sort_values('Balance Due Amount', ascending=False)
        
        # Create visualizations if requested
        visualizations = {}
        if include_visualization:
            # Bucket distribution
            bucket_keys = list(bucket_totals.keys())
            bucket_values = [bucket_totals[b]['amount'] for b in bucket_keys]
            bucket_percentages = [bucket_totals[b]['percentage'] * 100 for b in bucket_keys]
            
            # Create textual representation of chart
            chart_data = []
            chart_data.append("AR Aging Distribution:")
            chart_data.append("-" * 50)
            max_value = max(bucket_values) if bucket_values else 0
            scale_factor = 40 / max_value if max_value > 0 else 0
            
            for i, bucket in enumerate(bucket_keys):
                bar_length = int(bucket_values[i] * scale_factor)
                bar = "#" * bar_length
                chart_data.append(f"{bucket.ljust(15)} | {bar} ${bucket_values[i]:,.2f} ({bucket_percentages[i]:.1f}%)")
            
            visualizations['aging_distribution'] = "\n".join(chart_data)
        
        # Format results as text
        result = []
        result.append("=" * 80)
        result.append("ACCOUNTS RECEIVABLE AGING ANALYSIS")
        result.append("=" * 80)
        result.append(f"Report Date: {today.strftime('%Y-%m-%d')}")
        result.append("=" * 80)
        
        result.append("\nOVERALL METRICS")
        result.append("-" * 40)
        result.append(f"Total AR Balance: ${total_ar:,.2f}")
        result.append(f"Current Balance (0-30 days): ${total_current:,.2f} ({(total_current/total_ar)*100:.1f}%)")
        result.append(f"Overdue Balance (>30 days): ${total_overdue:,.2f} ({percent_overdue:.1f}%)")
        result.append(f"Average Days Outstanding: {avg_days_outstanding:.1f} days")
        result.append(f"Weighted Average Days Outstanding: {weighted_avg_days:.1f} days")
        
        result.append("\nAGING BUCKETS")
        result.append("-" * 40)
        for bucket, data in bucket_totals.items():
            result.append(f"{bucket}: ${data['amount']:,.2f} ({data['percentage']*100:.1f}%) - {data['count']} invoices")
        
        result.append("\nCUSTOMER METRICS")
        result.append("-" * 40)
        result.append(f"Total Customers with AR: {total_customers}")
        result.append(f"Customers with Overdue Balances: {customers_with_overdue} ({percent_customers_overdue:.1f}%)")
        
        if len(high_value_accounts) > 0:
            result.append("\nHIGH-VALUE OVERDUE ACCOUNTS (Top 5)")
            result.append("-" * 40)
            for idx, row in high_value_accounts.head(5).iterrows():
                result.append(f"Customer ID {row['Customer Key']}: ${row['Balance Due Amount']:,.2f}")
        
        # Add visualizations if available
        if visualizations:
            result.append("\nVISUALIZATIONS")
            result.append("-" * 40)
            for viz_type, viz_data in visualizations.items():
                result.append(f"\n{viz_type.replace('_', ' ').title()}:")
                result.append(viz_data)
        
        # Close the connection
        conn.close()
        
        return "\n".join(result)
        
    except Exception as e:
        logger.error(f"Error in AR aging analysis: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return f"Error performing AR aging analysis: {str(e)}"


# Helper function to get all available financial analysis tools
def get_financial_tools():
    """
    Returns a list of all financial analysis tools
    """
    # Function-based tools don't need instantiation
    return [
        cash_flow_analysis,
        revenue_forecast,
        analyze_ar_aging
    ]


# Example usage
# if __name__ == "__main__":
#     # First check the database structure and access
#     print("Checking database structure and accessibility...")
#     print_db_info()
    
#     # Test table queries to find the correct syntax
#     print("\nTesting table query syntax...")
#     tables_to_test = ["\"\"dbo_F_GL_Transaction_Detail\"\"","\"\"dbo_F_AR_Header\"\""]
#     for table in tables_to_test:
#         test_table_query(table)
    
#     # Test the tools
#     print("\nTesting Cash Flow Analysis...")
#     cf_result = cash_flow_analysis(start_date="2023-01-01", end_date="2023-03-31")
#     print(cf_result[:500] + "..." if len(cf_result) > 500 else cf_result)
    
#     print("\nTesting Revenue Forecast...")
#     rf_result = revenue_forecast(days_ahead=30)
#     print(rf_result[:500] + "..." if len(rf_result) > 500 else rf_result)
    
#     print("\nTesting AR Aging Analysis...")
#     ar_result = analyze_ar_aging()
#     print(ar_result[:500] + "..." if len(ar_result) > 500 else ar_result)

def analyze_cash_flows(gl_transactions: pd.DataFrame) -> Dict[str, Any]:
    """Analyze cash flows from general ledger transactions."""
    try:
        if gl_transactions is None or gl_transactions.empty:
            logger.warning("No data provided for cash flow analysis")
            return {"error": "No data available for analysis"}

        # Ensure required columns exist
        required_columns = ['Posting Date', 'Txn Amount']
        missing_columns = [col for col in required_columns if col not in gl_transactions.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return {"error": f"Missing required columns: {missing_columns}"}

        # Convert date column to datetime
        gl_transactions = gl_transactions.copy()
        gl_transactions['Posting Date'] = pd.to_datetime(gl_transactions['Posting Date'])

        # Calculate cash flows
        cash_flows = gl_transactions.copy()
        cash_flows['Cumulative Cash Flow'] = cash_flows['Txn Amount'].cumsum()

        # Calculate total inflow and outflow using proper boolean indexing
        total_inflow = float(cash_flows.loc[cash_flows['Txn Amount'] > 0, 'Txn Amount'].sum())
        total_outflow = float(cash_flows.loc[cash_flows['Txn Amount'] < 0, 'Txn Amount'].sum())

        # Calculate seasonal patterns
        cash_flows['Month'] = cash_flows['Posting Date'].dt.month
        seasonal_patterns_df = cash_flows.groupby('Month', as_index=False)['Txn Amount'].agg(['mean', 'std'])

        # Detect anomalies
        cash_flows['is_anomaly'] = isolation_forest.fit_predict(cash_flows[['Txn Amount']])

        return {
            'total_inflow': total_inflow,
            'total_outflow': total_outflow,
            'net_cash_flow': total_inflow + total_outflow,
            'seasonal_patterns': seasonal_patterns_df.to_dict('records'),
            'anomalies': cash_flows.loc[cash_flows['is_anomaly'] == -1].to_dict('records')
        }

    except Exception as e:
        logger.error(f"Error analyzing cash flows: {str(e)}")
        return {"error": str(e)}

def analyze_revenue_trends(daily_revenue: pd.DataFrame) -> Dict[str, Any]:
    """Analyze revenue trends and patterns."""
    try:
        if daily_revenue is None or daily_revenue.empty:
            logger.warning("No data provided for revenue trend analysis")
            return {"error": "No data available for analysis"}

        # Ensure required columns exist
        required_columns = ['Posting Date', 'Txn Amount']
        missing_columns = [col for col in required_columns if col not in daily_revenue.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return {"error": f"Missing required columns: {missing_columns}"}

        # Convert date column to datetime
        daily_revenue = daily_revenue.copy()
        daily_revenue['Posting Date'] = pd.to_datetime(daily_revenue['Posting Date'])

        # Add time-based features
        daily_revenue['day_of_week'] = daily_revenue['Posting Date'].dt.dayofweek
        daily_revenue['month'] = daily_revenue['Posting Date'].dt.month
        daily_revenue['year'] = daily_revenue['Posting Date'].dt.year
        daily_revenue['day_of_month'] = daily_revenue['Posting Date'].dt.day
        daily_revenue['day_of_year'] = daily_revenue['Posting Date'].dt.dayofyear

        # Calculate lags
        daily_revenue['lag_1'] = daily_revenue['Txn Amount'].shift(1)
        daily_revenue['lag_7'] = daily_revenue['Txn Amount'].shift(7)
        daily_revenue['lag_14'] = daily_revenue['Txn Amount'].shift(14)

        # Prepare features for modeling
        X = daily_revenue[['day_of_week', 'month', 'day_of_month', 'lag_1', 'lag_7', 'lag_14']]
        y = daily_revenue['Txn Amount']

        # Remove rows with NaN values
        valid_idx = X.notna().all(axis=1)
        X = X.loc[valid_idx]
        y = y.loc[valid_idx]

        # Cross-validation
        cv_results = {model_name: {'mape': [], 'rmse': []} for model_name in models}
        
        for train_idx, test_idx in TimeSeriesSplit(n_splits=5).split(X):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            for model_name, model in models.items():
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                mape = mean_absolute_percentage_error(y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                
                cv_results[model_name]['mape'].append(mape)
                cv_results[model_name]['rmse'].append(rmse)

        # Calculate average metrics
        for model_name in models:
            cv_results[model_name]['mape'] = float(np.mean(cv_results[model_name]['mape']))
            cv_results[model_name]['rmse'] = float(np.mean(cv_results[model_name]['rmse']))

        # Get feature importances
        best_model = min(models.items(), key=lambda x: cv_results[x[0]]['mape'])[1]
        importances = {}
        for i, feature in enumerate(X.columns):
            importances[feature] = float(best_model.feature_importances_[i])

        # Get latest values for forecasting
        latest_values = {
            'lag_1': float(daily_revenue.iloc[-1]['Txn Amount']),
            'lag_7': float(daily_revenue.iloc[-7]['Txn Amount']) if len(daily_revenue) > 7 else float(daily_revenue['Txn Amount'].mean()),
            'lag_14': float(daily_revenue.iloc[-14]['Txn Amount']) if len(daily_revenue) > 14 else float(daily_revenue['Txn Amount'].mean())
        }

        return {
            'cv_results': cv_results,
            'feature_importances': importances,
            'latest_values': latest_values
        }

    except Exception as e:
        logger.error(f"Error analyzing revenue trends: {str(e)}")
        return {"error": str(e)}