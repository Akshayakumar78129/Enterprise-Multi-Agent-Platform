import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any, List
import matplotlib.pyplot as plt
import io
import base64
import sqlite3
# Use the proper import path for the centralized database connector
import sys

# Handle imports whether run as module or script
try:
    from ...database.connector import DatabaseConnector
except (ImportError, ValueError):
    # When running as script or in test from local directory
    # Add the project root to path
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from Inventory.database.connector import DatabaseConnector

# Setup logger
logger = logging.getLogger(__name__)

# Configure database path
def setup_database_path():
    """Configure database path for the application"""
    try:
        # Set database path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "inventory.db")
        
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

def test_db_connection():
    """Test the database connection"""
    try:
        db_path = os.environ.get("DB_NAME")
        conn = sqlite3.connect(db_path)
        conn.execute("SELECT 1")
        conn.close()
        logger.info("Database connected successfully.")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

test_db_connection()

def analyze_slow_moving_inventory(
    time_period: str = "last_quarter",
    turnover_threshold: float = 1.0,
    aging_threshold_days: int = 180,
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes inventory to identify slow-moving and obsolete items.
    Calculates inventory turnover ratios and provides recommendations
    for managing slow-moving inventory.
    
    Args:
        time_period: Time period for analysis, such as 'last_quarter', 'last_6_months', 'last_year', 
                    or a specific date range in format 'YYYY-MM-DD:YYYY-MM-DD'
        turnover_threshold: Threshold for inventory turnover ratio below which items are considered slow-moving.
                          Default is 1.0 (less than once per year).
        aging_threshold_days: Threshold in days beyond which inventory is considered aged.
                            Default is 180 days (6 months).
        category: Product category to filter the analysis. If not provided, will analyze all categories.
        warehouse_id: Warehouse ID to filter the analysis. If not provided, will analyze all warehouses.
    
    Returns:
        Dict containing analysis results and visualizations
    """
    try:
        # Get a database connector instance
        db_connector = DatabaseConnector.get_instance()
        
        # Fetch inventory and sales data
        inventory_data = fetch_inventory_data(db_connector, time_period, category, warehouse_id)
        sales_data = fetch_sales_data(db_connector, time_period, category, warehouse_id)
        
        if inventory_data.empty or sales_data.empty:
            logger.error("No data found in the database for the specified parameters.")
            return {
                "error": "No data found in the database for the specified parameters.",
                "recommendations": {},
                "raw_data": []
            }
        
        analysis_result = "Using actual data from the database.\n\n"
        
        # Calculate turnover ratios and aging
        analysis_data = calculate_turnover_and_aging(inventory_data, sales_data, turnover_threshold, aging_threshold_days)
        
        # Generate recommendations
        recommendations = generate_recommendations(analysis_data)
        
        # Generate visualizations
        visualizations = generate_visualizations(analysis_data)
        
        # Format the result as a detailed text report
        text_result = format_result(analysis_data, recommendations)
        
        # Add the analysis result to the beginning of the text report
        text_result = analysis_result + text_result
        
        return {
            "text_report": text_result,
            # "visualizations": visualizations,
            "recommendations": recommendations,
            "raw_data": analysis_data.to_dict(orient='records')
        }
        
    except Exception as e:
        logger.error(f"Error in slow-moving inventory analysis: {str(e)}")
        return {
            "error": f"An error occurred while analyzing slow-moving inventory: {str(e)}",
            # "visualizations": {},
            "recommendations": {},
            "raw_data": []
        }

def fetch_inventory_data(db_connector, time_period: str, category: Optional[str], warehouse_id: Optional[str]) -> pd.DataFrame:
    """Fetch inventory data from the database"""
    try:
        query = """
        SELECT 
            i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, 
            i.Unit_Cost, w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name,
            ist.Current_Stock, ist.Snapshot_Date
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
        JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
        WHERE ist.Snapshot_Date = (SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot)
        """
        
        # Add category filter if provided
        if category:
            query += f" AND i.Item_Category = '{category}'"
        
        # Add warehouse filter if provided
        if warehouse_id:
            query += f" AND w.Warehouse_ID = '{warehouse_id}'"
        
        result = db_connector.execute_query(query)
        
        if not result:
            logger.warning("No inventory data found in the database.")
            return pd.DataFrame()
        
        # Create DataFrame with proper column names
        df = pd.DataFrame(result, columns=[
            'Item_Key', 'Item_Number', 'Item_Name', 'Item_Category',
            'Unit_Cost', 'Warehouse_Key', 'Warehouse_ID', 'Warehouse_Name',
            'Current_Stock', 'Snapshot_Date'
        ])
        
        return df
    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
        return pd.DataFrame()

def fetch_sales_data(db_connector, time_period: str, category: Optional[str], warehouse_id: Optional[str]) -> pd.DataFrame:
    """Fetch sales data from the database"""
    try:
        # Parse the time period
        start_date, end_date = parse_time_period(time_period)
        
        query = """
        SELECT 
            i.Item_Key, i.Item_Number, i.Item_Category, w.Warehouse_Key,
            s.Transaction_Date, SUM(s.Quantity) as Quantity
        FROM dbo_F_Sales_Transaction s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        WHERE s.Transaction_Date BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY i.Item_Key, i.Item_Number, i.Item_Category, w.Warehouse_Key, s.Transaction_Date
        """.format(start_date=start_date, end_date=end_date)
        
        # Add category filter if provided
        if category:
            query += f" AND i.Item_Category = '{category}'"
        
        # Add warehouse filter if provided
        if warehouse_id:
            query += f" AND w.Warehouse_ID = '{warehouse_id}'"
        
        result = db_connector.execute_query(query)
        
        if not result:
            logger.warning("No sales data found in the database for the specified time period.")
            return pd.DataFrame()
        
        # Create DataFrame with proper column names
        df = pd.DataFrame(result, columns=[
            'Item_Key', 'Item_Number', 'Item_Category', 'Warehouse_Key',
            'Transaction_Date', 'Quantity'
        ])
        
        return df
    except Exception as e:
        logger.error(f"Error fetching sales data: {str(e)}")
        return pd.DataFrame()

def parse_time_period(time_period: str) -> tuple:
    """Parse the time period string into start and end dates"""
    today = datetime.now().date()
    
    if time_period == "last_quarter":
        start_date = today - timedelta(days=90)
    elif time_period == "last_6_months":
        start_date = today - timedelta(days=180)
    elif time_period == "last_year":
        start_date = today - timedelta(days=365)
    elif ":" in time_period:  # Custom date range
        start_date_str, end_date_str = time_period.split(":")
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        return start_date, end_date
    else:
        raise ValueError(f"Invalid time period: {time_period}")
    
    return start_date, today



def calculate_turnover_and_aging(data: pd.DataFrame, sales_data: pd.DataFrame, turnover_threshold: float, aging_threshold_days: int) -> pd.DataFrame:
    """Calculate inventory turnover ratios and aging metrics"""
    # Group sales data by item and warehouse to calculate annual sales
    sales_stats = sales_data.groupby(["Item_Key", "Warehouse_Key"]).agg({
        "Quantity": "sum"
    }).reset_index()
    sales_stats.columns = ["Item_Key", "Warehouse_Key", "Annual Sales"]
    
    # Merge with inventory data
    merged_data = pd.merge(
        data, 
        sales_stats, 
        on=["Item_Key", "Warehouse_Key"], 
        how="left"
    )
    
    # Fill missing values for items with no sales
    merged_data["Annual Sales"] = merged_data["Annual Sales"].fillna(0)
    
    # Calculate inventory turnover ratio
    merged_data["Turnover Ratio"] = merged_data["Annual Sales"] / merged_data["Current_Stock"]
    
    # Calculate days of supply
    merged_data["Days of Supply"] = (merged_data["Current_Stock"] / merged_data["Annual Sales"]) * 365
    
    # Identify slow-moving items
    merged_data["Is Slow Moving"] = merged_data["Turnover Ratio"] < turnover_threshold
    
    # Identify aged items
    merged_data["Is Aged"] = merged_data["Days of Supply"] > aging_threshold_days
    
    # Calculate inventory value
    merged_data["Inventory Value"] = merged_data["Current_Stock"] * merged_data["Unit_Cost"]
    
    return merged_data

def generate_visualizations(data: pd.DataFrame) -> Dict[str, str]:
    """Generate visualizations for the analysis"""
    charts = {}
    
    try:
        # 1. Bar chart of turnover ratio by category
        plt.figure(figsize=(10, 6))
        category_stats = data.groupby("Item_Category").agg({
            "Turnover Ratio": "mean"
        }).reset_index()
        category_stats = category_stats.sort_values("Turnover Ratio", ascending=False)
        
        plt.bar(category_stats["Item_Category"], category_stats["Turnover Ratio"])
        plt.axhline(y=1.0, color='r', linestyle='--', label='Slow Moving Threshold')
        plt.xlabel('Product Category')
        plt.ylabel('Average Turnover Ratio')
        plt.title('Average Turnover Ratio by Product Category')
        plt.xticks(rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["turnover_ratio"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 2. Bar chart of aged inventory by warehouse
        plt.figure(figsize=(10, 6))
        warehouse_stats = data.groupby("Warehouse_Name").agg({
            "Is Aged": "mean"
        }).reset_index()
        warehouse_stats = warehouse_stats.sort_values("Is Aged", ascending=False)
        
        plt.bar(warehouse_stats["Warehouse_Name"], warehouse_stats["Is Aged"] * 100)
        plt.xlabel('Warehouse')
        plt.ylabel('Aged Inventory (%)')
        plt.title('Aged Inventory by Warehouse')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["aged_inventory"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 3. Scatter plot of inventory value vs. turnover ratio
        plt.figure(figsize=(10, 6))
        plt.scatter(
            data["Inventory Value"],
            data["Turnover Ratio"],
            alpha=0.5,
            c=data["Is Slow Moving"].map({True: "red", False: "blue"})
        )
        plt.xlabel('Inventory Value ($)')
        plt.ylabel('Turnover Ratio')
        plt.title('Inventory Value vs. Turnover Ratio')
        plt.grid(True, alpha=0.3)
        plt.xscale('log')  # Logarithmic scale for wide range of inventory values
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["value_vs_turnover"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
    except Exception as e:
        logger.error(f"Error generating visualizations: {str(e)}")
    
    return charts

def generate_recommendations(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate recommendations based on analysis results"""
    recommendations = {
        "summary": {
            "total_items": len(data),
            "slow_moving_items": len(data[data["Is Slow Moving"]]),
            "aged_items": len(data[data["Is Aged"]]),
            "slow_moving_value": data[data["Is Slow Moving"]]["Inventory Value"].sum(),
            "aged_value": data[data["Is Aged"]]["Inventory Value"].sum()
        },
        "by_category": {},
        "by_warehouse": {},
        "top_slow_moving": [],
        "top_aged": [],
        "action_plan": {}
    }
    
    # Analyze by category
    category_analysis = data.groupby("Item_Category").agg({
        "Inventory Value": "sum",
        "Is Slow Moving": "sum",
        "Is Aged": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in category_analysis.iterrows():
        category = row["Item_Category"]
        recommendations["by_category"][category] = {
            "items_count": int(row["Item_Key"]),
            "inventory_value": float(row["Inventory Value"]),
            "slow_moving_count": int(row["Is Slow Moving"]),
            "aged_count": int(row["Is Aged"])
        }
    
    # Analyze by warehouse
    warehouse_analysis = data.groupby(["Warehouse_ID", "Warehouse_Name"]).agg({
        "Inventory Value": "sum",
        "Is Slow Moving": "sum",
        "Is Aged": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in warehouse_analysis.iterrows():
        warehouse_id = row["Warehouse_ID"]
        recommendations["by_warehouse"][warehouse_id] = {
            "warehouse_name": row["Warehouse_Name"],
            "items_count": int(row["Item_Key"]),
            "inventory_value": float(row["Inventory Value"]),
            "slow_moving_count": int(row["Is Slow Moving"]),
            "aged_count": int(row["Is Aged"])
        }
    
    # Identify top slow-moving items
    slow_moving_items = data[data["Is Slow Moving"]].sort_values("Turnover Ratio")
    
    for _, row in slow_moving_items.head(10).iterrows():
        recommendations["top_slow_moving"].append({
            "item_number": row["Item_Number"],
            "item_name": row["Item_Name"],
            "category": row["Item_Category"],
            "warehouse_name": row["Warehouse_Name"],
            "current_stock": row["Current_Stock"],
            "turnover_ratio": row["Turnover Ratio"],
            "inventory_value": row["Inventory Value"]
        })
    
    # Identify top aged items
    aged_items = data[data["Is Aged"]].sort_values("Days of Supply", ascending=False)
    
    for _, row in aged_items.head(10).iterrows():
        recommendations["top_aged"].append({
            "item_number": row["Item_Number"],
            "item_name": row["Item_Name"],
            "category": row["Item_Category"],
            "warehouse_name": row["Warehouse_Name"],
            "current_stock": row["Current_Stock"],
            "days_of_supply": row["Days of Supply"],
            "inventory_value": row["Inventory Value"]
        })
    
    # Generate action plan
    recommendations["action_plan"] = {
        "immediate": [
            "Review and mark down slow-moving items",
            "Consider liquidation for aged inventory",
            "Implement special promotions for slow movers",
            "Review and adjust order quantities"
        ],
        "short_term": [
            "Develop slow-mover identification system",
            "Implement aging inventory alerts",
            "Review supplier agreements for returns",
            "Optimize inventory distribution"
        ],
        "long_term": [
            "Implement advanced demand forecasting",
            "Develop vendor-managed inventory program",
            "Establish automated replenishment system",
            "Implement real-time inventory tracking"
        ]
    }
    
    return recommendations

def format_result(data: pd.DataFrame, recommendations: Dict[str, Any]) -> str:
    """Format the analysis results as a detailed text report"""
    result = "# Slow-Moving Inventory Analysis Report\n\n"
    
    # Add summary statistics
    result += "## Summary Statistics\n\n"
    result += f"Total Items Analyzed: {recommendations['summary']['total_items']}\n"
    result += f"Slow-Moving Items: {recommendations['summary']['slow_moving_items']}\n"
    result += f"Aged Items: {recommendations['summary']['aged_items']}\n"
    result += f"Value of Slow-Moving Items: ${recommendations['summary']['slow_moving_value']:,.2f}\n"
    result += f"Value of Aged Items: ${recommendations['summary']['aged_value']:,.2f}\n\n"
    
    # Add category analysis
    result += "## Analysis by Category\n\n"
    for category, stats in recommendations["by_category"].items():
        result += f"### {category}\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Slow-Moving Items: {stats['slow_moving_count']}\n"
        result += f"- Aged Items: {stats['aged_count']}\n\n"
    
    # Add warehouse analysis
    result += "## Analysis by Warehouse\n\n"
    for warehouse_id, stats in recommendations["by_warehouse"].items():
        result += f"### {stats['warehouse_name']} ({warehouse_id})\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Slow-Moving Items: {stats['slow_moving_count']}\n"
        result += f"- Aged Items: {stats['aged_count']}\n\n"
    
    # Add slow-moving items
    result += "## Top Slow-Moving Items\n\n"
    for item in recommendations["top_slow_moving"]:
        result += f"- {item['item_number']} - {item['item_name']} ({item['warehouse_name']})\n"
        result += f"  - Current Stock: {item['current_stock']}\n"
        result += f"  - Turnover Ratio: {item['turnover_ratio']:.2f}\n"
        result += f"  - Inventory Value: ${item['inventory_value']:,.2f}\n\n"
    
    # Add aged items
    result += "## Top Aged Items\n\n"
    for item in recommendations["top_aged"]:
        result += f"- {item['item_number']} - {item['item_name']} ({item['warehouse_name']})\n"
        result += f"  - Current Stock: {item['current_stock']}\n"
        result += f"  - Days of Supply: {item['days_of_supply']:.1f}\n"
        result += f"  - Inventory Value: ${item['inventory_value']:,.2f}\n\n"
    
    # Add action plan
    result += "## Recommended Action Plan\n\n"
    result += "### Immediate Actions\n"
    for action in recommendations["action_plan"]["immediate"]:
        result += f"- {action}\n"
    
    result += "\n### Short-term Actions\n"
    for action in recommendations["action_plan"]["short_term"]:
        result += f"- {action}\n"
    
    result += "\n### Long-term Actions\n"
    for action in recommendations["action_plan"]["long_term"]:
        result += f"- {action}\n"
    
    return result

if __name__ == "__main__":
    # Test the tool
    result = analyze_slow_moving_inventory(
        time_period="last_quarter",
        turnover_threshold=1.0,
        aging_threshold_days=180
    )
    
    # Save text report
    with open("slow_moving_inventory_analysis.log", "w") as f:
        f.write(result["text_report"])
    
    # Save visualizations
    for chart_name, chart_data in result["visualizations"].items():
        # Remove the data:image/png;base64, prefix
        img_data = chart_data.split(',')[1]
        # Decode and save the image
        with open(f"inventory_analysis_{chart_name}.png", "wb") as f:
            f.write(base64.b64decode(img_data))
    
    print("Analysis complete. Check the following files:")
    print("- slow_moving_inventory_analysis.log (Text Report)")
    print("- inventory_analysis_turnover_ratio.png (Turnover Ratio by Category)")
    print("- inventory_analysis_aged_inventory.png (Aged Inventory by Warehouse)")
    print("- inventory_analysis_value_vs_turnover.png (Value vs Turnover Analysis)")
 
 
 