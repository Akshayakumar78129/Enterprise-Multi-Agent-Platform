import os
import sys

# Add the project root to the path consistently at the beginning
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../../../"))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, Any, Optional, List, Union, Tuple

# Attempt to import database connector
try:
    from Sales.database.connector import DatabaseConnector, get_db_connector
    db_connector = get_db_connector()
    logger = logging.getLogger(__name__)
    logger.info("Successfully imported database connector in regional_data_utils")
    HAS_DB_CONNECTOR = True
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Failed to import database connector: {e}. Using fallback data generation.")
    HAS_DB_CONNECTOR = False
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Error initializing database connector: {e}. Using fallback data generation.")
    HAS_DB_CONNECTOR = False

def prepare_regional_data(data: pd.DataFrame, include_sub_regions: bool = False) -> pd.DataFrame:
    """Prepare regional data for analysis."""
    try:
        if data is None or data.empty:
            logger.warning("No data provided to prepare_regional_data")
            return None
            
        # Convert date column to datetime
        if 'Txn Date' in data.columns:
            data['Txn Date'] = pd.to_datetime(data['Txn Date'])
        
        # Verify required columns exist
        required_columns = ['revenue', 'units', 'margin', 'region_name']
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return None
        
        # Calculate additional metrics if not already present
        try:
            if 'margin_pct' not in data.columns:
                data['margin_pct'] = (data['margin'] / data['revenue'].replace(0, np.nan)) * 100
            if 'revenue_per_unit' not in data.columns:
                data['revenue_per_unit'] = data['revenue'] / data['units'].replace(0, np.nan)
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return None
        
        # Group by region and optionally sub-region
        group_cols = ['region_name']
        if include_sub_regions and 'sub_region_name' in data.columns:
            group_cols.append('sub_region_name')
        
        # Calculate aggregated metrics
        agg_data = data.groupby(group_cols, as_index=False).agg({
            'revenue': 'sum',
            'units': 'sum',
            'margin': 'sum',
            'margin_pct': 'mean',
            'revenue_per_unit': 'mean'
        })
        
        # Ensure numeric columns are float type
        numeric_cols = ['revenue', 'units', 'margin', 'margin_pct', 'revenue_per_unit']
        for col in numeric_cols:
            if col in agg_data.columns:
                agg_data[col] = agg_data[col].astype(float)
        
        return agg_data
        
    except Exception as e:
        logger.error(f"Error preparing regional data: {str(e)}")
        return None

def get_regional_filters(region_codes: Optional[List[str]] = None,
                       country_codes: Optional[List[str]] = None,
                       min_revenue: Optional[float] = None) -> Dict[str, Any]:
    """Get regional filters for query."""
    filters = {}
    
    if region_codes:
        filters['[Customer Geography Hrchy L1 Code]'] = region_codes
    
    if country_codes:
        filters['[Customer Geography Hrchy L1 Name]'] = country_codes
    
    if min_revenue:
        filters['[Net Sales Amount]'] = min_revenue
    
    return filters

def apply_regional_filters(data: pd.DataFrame,
                       region_codes: List[str] = None,
                       country_codes: List[str] = None,
                       sub_region_codes: List[str] = None) -> pd.DataFrame:
    """Apply regional filters to the data."""
    try:
        if data is None or data.empty:
            logger.warning("Input data is None or empty")
            return None
            
        # Work with a copy of the data
        filtered_data = data.copy()
        
        # Apply filters using proper boolean indexing
        if region_codes:
            mask = filtered_data['region_code'].isin(region_codes)
            filtered_data = filtered_data.loc[mask]
            logger.info(f"Applied region codes filter, {len(filtered_data)} rows remaining")
            
        if country_codes:
            mask = filtered_data['region_name'].isin(country_codes)
            filtered_data = filtered_data.loc[mask]
            logger.info(f"Applied country codes filter, {len(filtered_data)} rows remaining")
            
        if sub_region_codes:
            mask = filtered_data['sub_region_code'].isin(sub_region_codes)
            filtered_data = filtered_data.loc[mask]
            logger.info(f"Applied sub-region codes filter, {len(filtered_data)} rows remaining")
            
        if filtered_data.empty:
            logger.warning("No data remains after applying filters")
            return None
            
        return filtered_data
        
    except Exception as e:
        logger.error(f"Error applying regional filters: {str(e)}")
        return None

def create_geo_hierarchy(data: pd.DataFrame) -> Dict[str, List[str]]:
    """Create geographical hierarchy from data."""
    hierarchy = {}
    
    # Get unique regions
    regions = data['region_name'].unique()
    
    for region in regions:
        # Get sub-regions for this region
        sub_regions = data[data['region_name'] == region]['sub_region_name'].unique()
        hierarchy[region] = list(sub_regions)
    
    return hierarchy

def get_dimension_column(dimension: str) -> str:
    """Get the column name for a dimension."""
    dimension_map = {
        'product': 'product_id',
        'customer': 'customer_id',
        'region': 'region',
        'date': 'date'
    }
    
    return dimension_map.get(dimension.lower(), dimension)

def apply_filters(data: pd.DataFrame, filters: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """Apply filters to a DataFrame."""
    if filters is None or data is None or data.empty:
        return data
    
    filtered_data = data.copy()
    
    for column, value in filters.items():
        if column in filtered_data.columns:
            if isinstance(value, list):
                filtered_data = filtered_data[filtered_data[column].isin(value)]
            else:
                filtered_data = filtered_data[filtered_data[column] == value]
                
    return filtered_data

class RegionalDataUtils:
    """Utility class for handling regional sales data operations."""
    
    def __init__(self, db_path: str, logger: Optional[logging.Logger] = None):
        """Initialize the regional data utilities.
        
        Args:
            db_path: Path to the SQLite database
            logger: Optional logger instance
        """
        self.db_path = db_path
        self.logger = logger or logging.getLogger(__name__)
        
    def fetch_sales_data(self, start_date=None, end_date=None, product_id=None, 
                        customer_id=None, region=None) -> pd.DataFrame:
        """Fetch sales data from the database based on filters."""
        return fetch_sales_data(start_date, end_date, product_id, customer_id, region)
        
    def prepare_sales_data(self, data: pd.DataFrame, aggregation_level=None, 
                          dimensions=None) -> pd.DataFrame:
        """Prepare sales data for analysis."""
        return prepare_sales_data(data, aggregation_level, dimensions)
        
    def apply_filters(self, data: pd.DataFrame, filters=None) -> pd.DataFrame:
        """Apply filters to the data."""
        return apply_filters(data, filters)
        
    def get_dimension_column(self, dimension: str) -> str:
        """Get the column name for a dimension."""
        return get_dimension_column(dimension)
        
    def prepare_regional_data(self, data: pd.DataFrame, include_sub_regions: bool = False) -> pd.DataFrame:
        """Prepare regional data for analysis."""
        return prepare_regional_data(data, include_sub_regions)
        
    def get_regional_filters(self, region_codes: Optional[List[str]] = None,
                           country_codes: Optional[List[str]] = None,
                           min_revenue: Optional[float] = None) -> Dict[str, Any]:
        """Get regional filters for query."""
        return get_regional_filters(region_codes, country_codes, min_revenue)
        
    def apply_regional_filters(self, data: pd.DataFrame,
                             region_codes: Optional[List[str]] = None,
                             country_codes: Optional[List[str]] = None,
                             sub_region_codes: Optional[List[str]] = None) -> pd.DataFrame:
        """Apply regional filters to data."""
        return apply_regional_filters(data, region_codes, country_codes, sub_region_codes)
        
    def create_geo_hierarchy(self, data: pd.DataFrame) -> Dict[str, List[str]]:
        """Create geographical hierarchy from data."""
        return create_geo_hierarchy(data)
        
    def generate_sample_data(self) -> pd.DataFrame:
        """Generate sample regional data for testing."""
        return generate_sample_region_data()

# Define functions locally to avoid circular imports
def fetch_sales_data(start_date=None, end_date=None, product_id=None, customer_id=None, region=None):
    """
    Fetch sales data from the database based on filters.
    
    Args:
        start_date: Optional start date filter
        end_date: Optional end date filter
        product_id: Optional product ID filter
        customer_id: Optional customer ID filter
        region: Optional region filter
        
    Returns:
        pd.DataFrame: Sales data
    """
    # Try to use the database connector if available
    if HAS_DB_CONNECTOR and db_connector:
        try:
            logger.info(f"Fetching sales data from database with filters: start_date={start_date}, end_date={end_date}, product_id={product_id}, customer_id={customer_id}, region={region}")
            
            # Build query conditions
            conditions = []
            params = {}
            
            if start_date:
                conditions.append("date >= :start_date")
                params['start_date'] = start_date
            
            if end_date:
                conditions.append("date <= :end_date")
                params['end_date'] = end_date
                
            if product_id:
                conditions.append("product_id = :product_id")
                params['product_id'] = product_id
                
            if customer_id:
                conditions.append("customer_id = :customer_id")
                params['customer_id'] = customer_id
                
            if region:
                conditions.append("region = :region")
                params['region'] = region
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            query = f"""
            SELECT * FROM sales 
            WHERE {where_clause}
            ORDER BY date
            """
            
            # Execute query
            result = db_connector.execute_query(query, params)
            logger.info(f"Query executed successfully, returned {len(result)} rows")
            return pd.DataFrame(result)
        
        except Exception as e:
            logger.error(f"Error fetching data from database: {e}. Falling back to sample data generation.")
            # Fall back to sample data generation
    
    # Sample data generation for fallback/testing purposes
    logger.info("Generating sample sales data (fallback mode)")
    date_range = pd.date_range(
        start=start_date or '2022-01-01',
        end=end_date or datetime.now().strftime('%Y-%m-%d'),
        freq='D'
    )
    
    n_records = len(date_range)
    
    data = {
        'date': date_range,
        'product_id': np.random.choice(['P001', 'P002', 'P003', 'P004', 'P005'], n_records),
        'customer_id': np.random.choice(['C001', 'C002', 'C003', 'C004', 'C005'], n_records),
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_records),
        'quantity': np.random.randint(1, 100, n_records),
        'unit_price': np.random.uniform(10, 1000, n_records),
        'discount': np.random.uniform(0, 0.3, n_records)
    }
    
    df = pd.DataFrame(data)
    df['revenue'] = df['quantity'] * df['unit_price'] * (1 - df['discount'])
    
    # Apply filters to the generated data
    if product_id:
        df = df[df['product_id'] == product_id]
    if customer_id:
        df = df[df['customer_id'] == customer_id]
    if region:
        df = df[df['region'] == region]
        
    return df

def prepare_sales_data(data, aggregation_level=None, dimensions=None):
    """
    Prepare sales data for analysis by aggregating and calculating metrics.
    
    Args:
        data: DataFrame with raw sales data
        aggregation_level: Time period to aggregate by ('day', 'week', 'month', 'quarter', 'year')
        dimensions: Additional dimensions to group by
        
    Returns:
        Prepared DataFrame with calculated metrics
    """
    if data is None or data.empty:
        return pd.DataFrame()
    
    # Ensure date column is datetime
    if 'date' in data.columns and not pd.api.types.is_datetime64_any_dtype(data['date']):
        data['date'] = pd.to_datetime(data['date'])
    
    # Add time period columns
    if 'date' in data.columns:
        data['year'] = data['date'].dt.year
        data['quarter'] = data['date'].dt.quarter
        data['month'] = data['date'].dt.month
        data['week'] = data['date'].dt.isocalendar().week
        data['day_of_week'] = data['date'].dt.dayofweek
    
    # Default dimensions if none provided
    dimensions = dimensions or []
    
    # Include time dimensions based on aggregation level
    time_dimensions = []
    if aggregation_level == 'day':
        time_dimensions = ['year', 'month', 'day']
    elif aggregation_level == 'week':
        time_dimensions = ['year', 'week']
    elif aggregation_level == 'month':
        time_dimensions = ['year', 'month']
    elif aggregation_level == 'quarter':
        time_dimensions = ['year', 'quarter']
    elif aggregation_level == 'year':
        time_dimensions = ['year']
    
    # Combine all dimensions
    all_dimensions = time_dimensions + [dim for dim in dimensions if dim not in time_dimensions]
    
    if not all_dimensions:
        return data
    
    # Calculate metrics
    agg_funcs = {
        'quantity': 'sum',
        'revenue': 'sum',
        'unit_price': 'mean',
        'discount': 'mean'
    }
    
    # Only include columns that exist in the data
    valid_aggs = {col: func for col, func in agg_funcs.items() if col in data.columns}
    
    # Group by dimensions and aggregate
    result = data.groupby(all_dimensions, as_index=False).agg(valid_aggs)
    
    # Calculate additional metrics if possible
    if 'quantity' in result.columns and 'revenue' in result.columns:
        result['avg_price'] = result['revenue'] / result['quantity']
    
    return result

logger = logging.getLogger(__name__)

def generate_sample_region_data() -> pd.DataFrame:
    """
    Generates sample regional sales data for development and testing.
    
    Returns:
        DataFrame with sample regional sales data
    """
    # Define regions
    regions = [
        {'region_code': 'NAM', 'region_name': 'North America', 'country_code': 'US', 'country_name': 'United States'},
        {'region_code': 'WEU', 'region_name': 'Western Europe', 'country_code': 'FR', 'country_name': 'France'},
        {'region_code': 'EEU', 'region_name': 'Eastern Europe', 'country_code': 'PL', 'country_name': 'Poland'},
        {'region_code': 'APAC', 'region_name': 'Asia Pacific', 'country_code': 'JP', 'country_name': 'Japan'},
        {'region_code': 'LATAM', 'region_name': 'Latin America', 'country_code': 'BR', 'country_name': 'Brazil'},
        {'region_code': 'MEA', 'region_name': 'Middle East & Africa', 'country_code': 'ZA', 'country_name': 'South Africa'},
    ]
    
    # Create base sales dataset
    sample_data = pd.DataFrame(columns=[
        'date', 'region_code', 'region_name', 'country_code', 'country_name',
        'product_id', 'product_name', 'category', 'quantity', 'unit_price',
        'revenue', 'cost', 'margin'
    ])
    
    # Generate random sales data for each region
    np.random.seed(42)  # For reproducibility
    
    # Generate data for the last 12 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Product categories and sample products
    categories = ['Electronics', 'Apparel', 'Home Goods', 'Food & Beverage']
    products = {
        'Electronics': ['Smartphone', 'Laptop', 'Tablet', 'Headphones'],
        'Apparel': ['T-shirt', 'Jeans', 'Shoes', 'Jacket'],
        'Home Goods': ['Furniture', 'Kitchenware', 'Bedding', 'Decor'],
        'Food & Beverage': ['Snacks', 'Beverages', 'Prepared Meals', 'Ingredients']
    }
    
    # Generate transactions
    transactions = []
    for _ in range(5000):  # Generate 5000 transactions
        # Pick a random date
        date = np.random.choice(dates)
        
        # Pick a random region
        region = np.random.choice(regions)
        
        # Pick a random category and product
        category = np.random.choice(categories)
        product_name = np.random.choice(products[category])
        product_id = f"{category[:3]}-{product_name[:3]}-{np.random.randint(100, 999)}"
        
        # Generate sales data
        quantity = np.random.randint(1, 20)
        unit_price = np.random.uniform(10, 1000) if category == 'Electronics' else np.random.uniform(5, 200)
        revenue = quantity * unit_price
        cost = revenue * np.random.uniform(0.4, 0.7)  # 40-70% cost
        margin = revenue - cost
        
        # Create transaction record
        transaction = {
            'date': date,
            'region_code': region['region_code'],
            'region_name': region['region_name'],
            'country_code': region['country_code'],
            'country_name': region['country_name'],
            'product_id': product_id,
            'product_name': product_name,
            'category': category,
            'quantity': quantity,
            'unit_price': unit_price,
            'revenue': revenue,
            'cost': cost,
            'margin': margin
        }
        transactions.append(transaction)
    
    # Create DataFrame from transactions
    sample_data = pd.DataFrame(transactions)
    
    # Add region population (for per-capita analysis)
    region_populations = {
        'NAM': 350000000,
        'WEU': 200000000,
        'EEU': 100000000,
        'APAC': 650000000,
        'LATAM': 400000000,
        'MEA': 300000000
    }
    sample_data['region_population'] = sample_data['region_code'].map(region_populations)
    
    # Add customer counts (for market penetration analysis)
    region_customers = {
        'NAM': 20000000,
        'WEU': 10000000,
        'EEU': 5000000,
        'APAC': 25000000,
        'LATAM': 12000000,
        'MEA': 8000000
    }
    sample_data['customer_count'] = sample_data['region_code'].map(region_customers)
    
    return sample_data

# For testing
if __name__ == "__main__":
    # Generate sample data
    sample_data = generate_sample_region_data()
    
    # Test preparing regional data
    prepared_data = prepare_regional_data(sample_data)
    
    # Test regional filters
    filters = get_regional_filters(
        region_codes=['NAM', 'APAC'],
        min_revenue=10000
    )
    filtered_data = apply_regional_filters(prepared_data, filters)
    
    # Test geo hierarchy creation
    hierarchy = create_geo_hierarchy(filtered_data)
    
    print(f"Sample data shape: {sample_data.shape}")
    print(f"Prepared data shape: {prepared_data.shape}")
    print(f"Filtered data shape: {filtered_data.shape}")
    print(f"Hierarchy top level: {hierarchy['name']} with {len(hierarchy['children'])} children") 
 
 
 