import os
import sys

# Add the project root to the path consistently at the beginning
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../../../"))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Standard library imports
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Union, Optional, Tuple
import io
import base64

# Third-party imports
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Local absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from orchestration_agent.database.column_mapping import get_db_column
from orchestration_agent.database.connector import DatabaseConnector
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Setup logger
logger = logging.getLogger(__name__)

# Initialize the database connector
db_connector = DatabaseConnector()

def get_dimension_column(dimension: str) -> str:
    """
    Map the dimension parameter to the actual column name in the data.
    """
    dimension_mapping = {
        'product': 'product_name',
        'product_code': 'product_code',
        'category': 'category',
        'subcategory': 'subcategory',
        'channel': 'channel_name',
        'channel_type': 'channel_type',
        'region': 'region_name',
        'country': 'country',
        'state_province': 'state_province',
        'customer': 'customer_id',
        'customer_type': 'customer_type',
        'segment': 'segment_id'
    }
    
    return dimension_mapping.get(dimension, 'product_name')

def get_time_grouper(data: pd.DataFrame) -> pd.Grouper:
    """
    Create appropriate time grouper based on the data range.
    """
    date_col = pd.to_datetime(data['transaction_date'])
    min_date = date_col.min()
    max_date = date_col.max()
    date_range = (max_date - min_date).days
    
    # Choose appropriate grouping based on date range
    if date_range <= 7:
        return pd.Grouper(key='transaction_date', freq='D')
    elif date_range <= 31:
        return pd.Grouper(key='transaction_date', freq='W')
    elif date_range <= 90:
        return pd.Grouper(key='transaction_date', freq='W')
    elif date_range <= 365:
        return pd.Grouper(key='transaction_date', freq='M')
    elif date_range <= 365 * 2:
        return pd.Grouper(key='transaction_date', freq='Q')
    else:
        return pd.Grouper(key='transaction_date', freq='Y')

def parse_time_period(time_period: str) -> Tuple[datetime, datetime]:
    """
    Parses a time period string into start and end dates.
    
    Args:
        time_period: String describing a time period ('quarterly', 'annual', 'monthly', 
                    or a specific date range in format 'YYYY-MM-DD:YYYY-MM-DD')
    
    Returns:
        Tuple of (start_date, end_date) as datetime objects
    """
    today = datetime.today()
    
    if ':' in time_period:
        # Format is 'YYYY-MM-DD:YYYY-MM-DD'
        start_str, end_str = time_period.split(':')
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_str, '%Y-%m-%d')
            return start_date, end_date
        except ValueError:
            # Fall back to default if date parsing fails
            pass
    
    # Handle standard time periods
    if time_period.lower() == 'quarterly':
        end_date = today
        start_date = end_date - timedelta(days=90)
    elif time_period.lower() == 'annual' or time_period.lower() == 'yearly':
        end_date = today
        start_date = end_date - timedelta(days=365)
    elif time_period.lower() == 'monthly':
        end_date = today
        start_date = end_date - timedelta(days=30)
    elif time_period.lower() == 'weekly':
        end_date = today
        start_date = end_date - timedelta(days=7)
    elif time_period.lower() == 'ytd':
        end_date = today
        start_date = datetime(today.year, 1, 1)
    else:
        # Default to last 30 days
        end_date = today
        start_date = end_date - timedelta(days=30)
    
    return start_date, end_date

def get_date_clause(time_period: str) -> str:
    """
    Generate the date filtering clause based on time_period.
    """
    if ":" in time_period:
        start_date, end_date = time_period.split(":")
        return f"s.transaction_date BETWEEN '{start_date}' AND '{end_date}'"
    elif time_period == "annual":
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)"
    elif time_period == "quarterly":
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)"
    elif time_period == "monthly":
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)"
    elif time_period == "weekly":
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)"
    elif time_period == "daily":
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
    else:
        # Default to last 90 days if not specified
        return f"s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)"

def get_filter_clause(filters: Dict[str, Any]) -> str:
    """
    Generate SQL filter clause from the filters dictionary.
    """
    if not filters:
        return ""
    
    clauses = []
    
    # Map filter keys to table columns
    column_mapping = {
        'product_code': 'p.product_code',
        'product_name': 'p.name',
        'product_category': 'p.category',
        'product_subcategory': 'p.subcategory',
        'channel_code': 'c.channel_code',
        'channel_name': 'c.name',
        'channel_type': 'c.channel_type',
        'region_code': 'r.region_code',
        'region_name': 'r.name',
        'country': 'r.country',
        'state_province': 'r.state_province',
        'customer_id': 'cu.customer_id',
        'customer_type': 'cu.customer_type',
        'segment_id': 'cu.segment_id'
    }
    
    for key, value in filters.items():
        if key in column_mapping:
            if isinstance(value, list):
                placeholders = ', '.join([f"'{v}'" for v in value])
                clauses.append(f"{column_mapping[key]} IN ({placeholders})")
            else:
                clauses.append(f"{column_mapping[key]} = '{value}'")
    
    return " AND ".join(clauses)

def apply_filters(data: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
    """
    Apply filters to a DataFrame.
    
    Args:
        data: Input DataFrame
        filters: Dictionary of column:value pairs to filter by
        
    Returns:
        Filtered DataFrame
    """
    if not filters:
        return data
    
    filtered_data = data.copy()
    
    for column, value in filters.items():
        if column in filtered_data.columns:
            if isinstance(value, list):
                filtered_data = filtered_data[filtered_data[column].isin(value)]
            else:
                filtered_data = filtered_data[filtered_data[column] == value]
    
    return filtered_data

def build_query(time_period: str, filters: Optional[Dict[str, Any]] = None) -> str:
    """
    Build the SQL query based on time period and filters.
    """
    # Parse time period for date filtering
    date_clause = get_date_clause(time_period)
    
    # Base query with all potential joins
    base_query = """
    SELECT 
        s.[Sales Txn Key] as transaction_id, s.[Txn Date] as transaction_date, 
        s.[Sales Quantity] as quantity, 
        s.[Sales Amount] / NULLIF(s.[Sales Quantity], 0) as unit_price,
        s.[Discount Amount] as discount_amount, 0 as tax_amount, 0 as shipping_amount, 
        s.[Sales Amount] as total_amount,
        p.[Item Number] as product_code, p.[Item] as product_name, 
        p.[Item Category] as category, p.[Item Subcategory] as subcategory, 
        s.[Cost Amount] / NULLIF(s.[Sales Quantity], 0) as base_cost,
        so.[Sales Organization Key] as channel_code, so.[Sales Organization] as channel_name, 
        'Direct' as channel_type,
        l.[Location Key] as region_code, l.[Location] as region_name, 
        l.[Country] as country, l.[State/Province] as state_province,
        c.[Customer Key] as customer_id, c.[Customer Type] as customer_type, 
        c.[Customer Category] as segment_id
    FROM 
        dbo_F_Sales_Transaction s
    LEFT JOIN 
        dbo_D_Item p ON s.[Item Key] = p.[Item Key]
    LEFT JOIN 
        dbo_D_Sales_Organization so ON s.[Sales Organization Key] = so.[Sales Organization Key]
    LEFT JOIN 
        dbo_D_Location l ON s.[Location Key] = l.[Location Key]
    LEFT JOIN 
        dbo_D_Customer c ON s.[Customer Key] = c.[Customer Key]
    WHERE 
        {date_clause}
    """
    
    # Add filter clauses if any
    filter_clause = get_filter_clause(filters) if filters else ""
    if filter_clause:
        base_query += f" AND {filter_clause}"
    
    return base_query.format(date_clause=date_clause)

def generate_sample_sales_data(time_period: str) -> pd.DataFrame:
    """
    Generates sample sales data for demonstration purposes.
    
    Args:
        time_period: Time period to generate data for
        
    Returns:
        DataFrame with sample sales data
    """
    start_date, end_date = parse_time_period(time_period)
    
    # Calculate number of days in the period
    days = (end_date - start_date).days
    
    # Generate a reasonable number of transactions
    n_transactions = min(days * 20, 5000)  # Maximum 5000 transactions to keep it manageable
    
    # Product information
    products = [
        {'id': 'P001', 'name': 'Premium Laptop', 'category': 'Electronics', 'price': 1200},
        {'id': 'P002', 'name': 'Budget Laptop', 'category': 'Electronics', 'price': 600},
        {'id': 'P003', 'name': 'Smartphone Pro', 'category': 'Electronics', 'price': 900},
        {'id': 'P004', 'name': 'Budget Phone', 'category': 'Electronics', 'price': 300},
        {'id': 'P005', 'name': 'Wireless Headphones', 'category': 'Electronics', 'price': 150},
        {'id': 'P006', 'name': 'Smart Watch', 'category': 'Electronics', 'price': 250},
        {'id': 'P007', 'name': 'Office Chair', 'category': 'Furniture', 'price': 200},
        {'id': 'P008', 'name': 'Standing Desk', 'category': 'Furniture', 'price': 350},
        {'id': 'P009', 'name': 'Ergonomic Keyboard', 'category': 'Computer Accessories', 'price': 80},
        {'id': 'P010', 'name': 'Wireless Mouse', 'category': 'Computer Accessories', 'price': 50},
    ]
    
    # Regions
    regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa']
    
    # Channels
    channels = ['Online', 'Retail Store', 'Partner', 'Direct Sales']
    
    # Customer segments
    segments = ['Enterprise', 'SMB', 'Consumer', 'Government', 'Education']
    
    # Generate random transaction data
    data = {
        'transaction_id': [f'T{i:06d}' for i in range(1, n_transactions + 1)],
        'transaction_date': [start_date + timedelta(days=np.random.randint(0, days + 1)) for _ in range(n_transactions)],
        'customer_id': [f'C{np.random.randint(1, 501):04d}' for _ in range(n_transactions)],
        'customer_segment': np.random.choice(segments, n_transactions),
        'region': np.random.choice(regions, n_transactions),
        'channel': np.random.choice(channels, n_transactions),
    }
    
    # Add product information
    product_indices = np.random.choice(len(products), n_transactions)
    data['product_id'] = [products[i]['id'] for i in product_indices]
    data['product_name'] = [products[i]['name'] for i in product_indices]
    data['product_category'] = [products[i]['category'] for i in product_indices]
    data['unit_price'] = [products[i]['price'] for i in product_indices]
    
    # Add quantity and total amount
    data['quantity'] = np.random.randint(1, 6, n_transactions)
    data['transaction_amount'] = [data['unit_price'][i] * data['quantity'][i] for i in range(n_transactions)]
    
    # Add some date-derived fields
    df = pd.DataFrame(data)
    df['year'] = df['transaction_date'].dt.year
    df['quarter'] = df['transaction_date'].dt.quarter
    df['month'] = df['transaction_date'].dt.month
    df['month_name'] = df['transaction_date'].dt.month_name()
    
    return df

def fetch_sales_data(start_date=None, end_date=None, product_id=None, customer_id=None, region=None):
    """
    Fetch sales data from the database
    """
    try:
        print(f"Fetching sales data from {start_date} to {end_date}")
        
        # Import the database connector directly to avoid relative import issues
        try:
            from orchestration_agent.database.connector import get_db_connector
        except ImportError:
            # Error handling for import
            import sys
            import os
            sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
            from orchestration_agent.database.connector import get_db_connector
            
        # Get database connector
        db_connector = get_db_connector()
        
        # Try a simple query first to verify database connection
        print("Executing simple query to test connection")
        simple_query = """
        SELECT * FROM dbo_F_Sales_Transaction
        LIMIT 10
        """
        
        result = db_connector.execute_query(None, simple_query)
        
        if not result:
            print(f"No data found with simple query")
            # Try a different approach using direct sqlite3
            try:
                import sqlite3
                import os
                
                db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "sales_agent.db")
                print(f"Trying direct SQLite connection to {db_path}")
                
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM dbo_F_Sales_Transaction LIMIT 10")
                rows = cursor.fetchall()
                
                if rows:
                    print(f"Direct SQLite query found {len(rows)} rows")
                    # Convert to list of dictionaries
                    cursor.execute("PRAGMA table_info(dbo_F_Sales_Transaction)")
                    columns = [col[1] for col in cursor.fetchall()]
                    result = [dict(zip(columns, row)) for row in rows]
                else:
                    print("No data found with direct SQLite query")
                    return []
            except Exception as e:
                print(f"Error with direct SQLite approach: {str(e)}")
                return []
        else:
            print(f"Found {len(result)} rows with simple query")
        
        # If the simple query worked and we have specific filters, try the more complex one
        if (start_date or end_date or product_id or customer_id or region):
            # Build the complex query with proper parameters
            query = """
            SELECT s.* 
            FROM dbo_F_Sales_Transaction s
            """
            
            params = {}
            where_clauses = []
            
            # Add JOIN clauses if needed
            join_item = False
            join_customer = False
            
            if product_id:
                join_item = True
                
            if customer_id or region:
                join_customer = True
                
            if join_item:
                query += ' LEFT JOIN dbo_D_Item i ON s."Item Key" = i."Item Key"'
                
            if join_customer:
                query += ' LEFT JOIN dbo_D_Customer c ON s."Customer Key" = c."Customer Key"'
            
            # Add WHERE conditions
            if start_date and end_date:
                where_clauses.append('s."Txn Date" BETWEEN :start_date AND :end_date')
                params["start_date"] = start_date
                params["end_date"] = end_date
                
            if product_id:
                where_clauses.append('i."Item Number" = :product_id')
                params["product_id"] = product_id
                
            if customer_id:
                where_clauses.append('c."Customer Key" = :customer_id')
                params["customer_id"] = customer_id
                
            if region:
                where_clauses.append('c."Customer State/Prov" = :region')
                params["region"] = region
                
            if where_clauses:
                query += ' WHERE ' + ' AND '.join(where_clauses)
                
            print(f"Complex query: {query}")
            print(f"Params: {params}")
            
            try:
                complex_result = db_connector.execute_query(None, query, params)
                
                if complex_result and len(complex_result) > 0:
                    print(f"Found {len(complex_result)} rows with complex query")
                    result = complex_result
            except Exception as e:
                print(f"Error executing complex query: {str(e)}")
                print("Continuing with simple query results")
        
        return result
            
    except Exception as e:
        print(f"Error fetching sales data: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def prepare_sales_data(sales_data):
    """
    Prepare sales data for analysis by converting to DataFrame and adding calculated fields.
    
    Args:
        sales_data (list): List of dictionaries containing sales data
        
    Returns:
        DataFrame: Prepared sales data
    """
    try:
        # Convert to DataFrame if it's not already
        if not isinstance(sales_data, pd.DataFrame):
            df = pd.DataFrame(sales_data)
        else:
            df = sales_data.copy()
            
        # Convert date columns to datetime
        date_columns = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
        for col in date_columns:
            try:
                df = safe_datetime_conversion(df, [col])

            except:
                pass
                
        # Add calculated fields if they don't exist
        if 'Net Sales Amount' in df.columns and 'Cost Amount' in df.columns and 'Gross Profit Amount' not in df.columns:
            df['Gross Profit Amount'] = df['Net Sales Amount'] - df['Cost Amount']
            
        if 'Net Sales Amount' in df.columns and 'Net Sales Quantity' in df.columns and 'Average Price' not in df.columns:
            # Avoid division by zero
            df['Average Price'] = df.apply(
                lambda row: row['Net Sales Amount'] / row['Net Sales Quantity'] if row['Net Sales Quantity'] > 0 else 0, 
                axis=1
            )
            
        if 'Gross Profit Amount' in df.columns and 'Net Sales Amount' in df.columns and 'Profit Margin' not in df.columns:
            # Avoid division by zero
            df['Profit Margin'] = df.apply(
                lambda row: row['Gross Profit Amount'] / row['Net Sales Amount'] * 100 if row['Net Sales Amount'] > 0 else 0,
                axis=1
            )
            
        return df
    except Exception as e:
        logging.error(f"Error preparing sales data: {str(e)}")
        return pd.DataFrame()

def format_sales_results(result, metric, time_period):
    """
    Format sales analysis results for output.
    
    Args:
        result (dict): Analysis results
        metric (str): Metric being analyzed (revenue, volume, profit)
        time_period (str): Time period string
        
    Returns:
        str: Formatted results
    """
    try:
        if 'error' in result:
            return f"Error analyzing {metric}: {result['error']}"
            
        # Format the time period for display
        if time_period == 'last_7_days':
            period_display = 'the last 7 days'
        elif time_period == 'last_30_days':
            period_display = 'the last 30 days'
        elif time_period == 'last_90_days':
            period_display = 'the last 90 days'
        elif time_period == 'last_quarter':
            period_display = 'the last quarter'
        elif time_period == 'last_year':
            period_display = 'the last year'
        elif time_period == 'year_to_date':
            period_display = 'year to date'
        elif time_period == 'all_time':
            period_display = 'all time'
        elif ':' in time_period:
            start_str, end_str = time_period.split(':')
            period_display = f'{start_str} to {end_str}'
        else:
            period_display = time_period
            
        # Format the metric for display
        metric_display = metric.lower()
        
        # Format the results based on the metric
        if metric_display == 'revenue':
            total = result.get('total_revenue', 0)
            prev_total = result.get('previous_period_revenue', 0)
            growth = result.get('growth_percentage', 0)
            top_items = result.get('top_products', [])
            top_customers = result.get('top_customers', [])
            
            output = f"## Sales Revenue Analysis for {period_display}\n\n"
            output += f"**Total Revenue:** ${total:,.2f}\n"
            output += f"**Previous Period Revenue:** ${prev_total:,.2f}\n"
            output += f"**Growth:** {growth:,.2f}%\n\n"
            
            output += "### Top Products by Revenue\n"
            for item in top_items:
                output += f"- {item['product']}: ${item['revenue']:,.2f}\n"
            
            output += "\n### Top Customers by Revenue\n"
            for customer in top_customers:
                output += f"- {customer['customer']}: ${customer['revenue']:,.2f}\n"
                
        elif metric_display == 'volume':
            total = result.get('total_volume', 0)
            prev_total = result.get('previous_period_volume', 0)
            growth = result.get('growth_percentage', 0)
            top_items = result.get('top_products', [])
            top_customers = result.get('top_customers', [])
            
            output = f"## Sales Volume Analysis for {period_display}\n\n"
            output += f"**Total Units Sold:** {total:,.0f}\n"
            output += f"**Previous Period Units Sold:** {prev_total:,.0f}\n"
            output += f"**Growth:** {growth:,.2f}%\n\n"
            
            output += "### Top Products by Volume\n"
            for item in top_items:
                output += f"- {item['product']}: {item['volume']:,.0f} units\n"
            
            output += "\n### Top Customers by Volume\n"
            for customer in top_customers:
                output += f"- {customer['customer']}: {customer['volume']:,.0f} units\n"
                
        elif metric_display == 'profit':
            total = result.get('total_profit', 0)
            prev_total = result.get('previous_period_profit', 0)
            growth = result.get('growth_percentage', 0)
            top_items = result.get('top_products', [])
            top_customers = result.get('top_customers', [])
            
            output = f"## Profit Analysis for {period_display}\n\n"
            output += f"**Total Profit:** ${total:,.2f}\n"
            output += f"**Previous Period Profit:** ${prev_total:,.2f}\n"
            output += f"**Growth:** {growth:,.2f}%\n\n"
            
            output += "### Top Products by Profit\n"
            for item in top_items:
                output += f"- {item['product']}: ${item['profit']:,.2f}\n"
            
            output += "\n### Top Customers by Profit\n"
            for customer in top_customers:
                output += f"- {customer['customer']}: ${customer['profit']:,.2f}\n"
        else:
            output = f"Unsupported metric: {metric_display}"
            
        # Add visualization if available
        if 'plot' in result:
            output += "\n\n### Visualization\n"
            output += f"![{metric_display.capitalize()} Over Time]({result['plot']})\n"
            
        return output
    except Exception as e:
        logging.error(f"Error formatting sales results: {str(e)}")
        return f"Error formatting {metric} results: {str(e)}"

def get_comparison_data(df, date_col, value_col, time_period):
    """
    Get comparison data for the previous period.
    
    Args:
        df (DataFrame): Sales data
        date_col (str): Date column name
        value_col (str): Value column name
        time_period (str): Time period string
        
    Returns:
        DataFrame: Comparison data
    """
    try:
        # Convert date column to datetime if it's not already
        if df[date_col].dtype != 'datetime64[ns]':
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            
        # Get the date range of the current data
        min_date = df[date_col].min()
        max_date = df[date_col].max()
        
        if pd.isnull(min_date) or pd.isnull(max_date):
            return None
            
        # Calculate the date range for the previous period
        date_range = (max_date - min_date).days
        
        prev_end_date = min_date - timedelta(days=1)
        prev_start_date = prev_end_date - timedelta(days=date_range)
        
        # Create a DataFrame for the previous period
        prev_data = pd.DataFrame({
            'Date': pd.date_range(start=prev_start_date, end=prev_end_date),
            'Value': 0
        })
        prev_data.columns = ['Date', value_col]
        
        return prev_data
    except Exception as e:
        logging.error(f"Error getting comparison data: {str(e)}")
        return None

def plot_to_base64(df, x, y, title='', xlabel='', ylabel=''):
    """
    Create a plot and convert it to base64 for embedding in markdown.
    
    Args:
        df (DataFrame): Data to plot
        x (str): Column name for x-axis
        y (str): Column name for y-axis
        title (str): Plot title
        xlabel (str): X-axis label
        ylabel (str): Y-axis label
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    try:
        plt.figure(figsize=(10, 6))
        plt.plot(df[x], df[y])
        plt.title(title)
        plt.xlabel(xlabel)
        plt.ylabel(ylabel)
        plt.grid(True)
        plt.tight_layout()
        
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        
        # Close the plot to free memory
        plt.close()
        
        # Print the base64 URL instead of returning it
        base64_url = f"data:image/png;base64,{img_str}"
        print(f"Base64 Image URL: {base64_url}")
        return ""
    except Exception as e:
        logging.error(f"Error creating plot: {str(e)}")
        return ""

# Unit test function
if __name__ == "__main__":
    print("Testing sales_analytics_utils.py")
    
    # Test generate_sample_sales_data
    sample_data = generate_sample_sales_data("monthly")
    print(f"Generated {len(sample_data)} sample transactions")
    
    # Test prepare_sales_data
    prepared_data = prepare_sales_data(sample_data)
    print(f"Prepared data has {len(prepared_data.columns)} columns including calculated fields")
    
    # Test format_sales_results
    simple_result = pd.DataFrame({
        'category': ['ELECTRONICS', 'APPAREL', 'HOME_GOODS'],
        'revenue': [10000, 5000, 3000],
        'margin': [4000, 2500, 1200]
    })
    formatted = format_sales_results(simple_result, "Sales by Category", "monthly")
    print("Formatted results sample:")
    print(formatted[:200] + "...")
    
    print("All tests completed") 
 
 
def safe_datetime_conversion(df, columns):
    """
    Safely convert columns to datetime format without using deprecated parameters.
    
    Args:
        df (pandas.DataFrame): The dataframe to modify
        columns (list): List of column names to attempt conversion on
    
    Returns:
        pandas.DataFrame: The modified dataframe
    """
    for col in columns:
        if col in df.columns:
            try:
                df[col] = pd.to_datetime(df[col])
            except (ValueError, TypeError):
                # Keep column as is if conversion fails
                pass
    
    return df