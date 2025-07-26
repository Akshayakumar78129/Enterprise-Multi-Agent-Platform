import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any, List
import sqlite3
import sys

# Use the proper import path for the centralized database connector
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

def analyze_holding_costs(
    time_period: str = "last_quarter",
    annual_holding_cost_percentage: float = 0.25,
    opportunity_cost_rate: float = 0.08,
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes inventory holding costs across products, categories, and warehouses.
    Calculates various cost metrics including carrying costs, opportunity costs,
    storage costs, and risk-related costs to help optimize inventory investment.
    
    Args:
        time_period: Time period for analysis, such as 'last_quarter', 'last_6_months', 'last_year', 
                    or a specific date range in format 'YYYY-MM-DD:YYYY-MM-DD'
        annual_holding_cost_percentage: Annual inventory holding cost as a percentage of inventory value. 
                                      Default is 0.25 (25%).
        opportunity_cost_rate: Annual opportunity cost rate (cost of capital). Default is 0.08 (8%).
        category: Product category to filter the analysis. If not provided, will analyze all categories.
        warehouse_id: Warehouse ID to filter the analysis. If not provided, will analyze all warehouses.
    
    Returns:
        Dict containing analysis results
    """
    try:
        # Get a database connector instance
        db_connector = DatabaseConnector.get_instance()
        
        # Fetch inventory data
        inventory_data = fetch_inventory_data(db_connector, time_period, category, warehouse_id)
        
        if inventory_data.empty:
            logger.error("No data found in the database for the specified parameters.")
            return {
                "error": "No data found in the database for the specified parameters.",
                "status": "failure"
            }
        
        analysis_result = "Using actual data from the database.\n\n"
        
        # Calculate holding costs and related metrics
        analysis_data = calculate_holding_costs(inventory_data, annual_holding_cost_percentage, opportunity_cost_rate)
        
        # Generate cost-saving recommendations
        recommendations = generate_recommendations(analysis_data)
        
        # Format the result as a detailed text report
        text_result = format_result(analysis_data, recommendations)
        
        # Add the analysis result to the beginning of the text report
        text_result = analysis_result + text_result
        
        return {
            "text_report": text_result,
            "recommendations": recommendations,
            "raw_data": analysis_data.to_dict(orient='records'),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error in holding cost analysis: {str(e)}")
        return {
            "error": f"An error occurred while analyzing inventory holding costs: {str(e)}",
            "status": "failure",
            "recommendations": {},
            "raw_data": []
        }

def fetch_inventory_data(db_connector, time_period: str, category: Optional[str], warehouse_id: Optional[str]) -> pd.DataFrame:
    """Fetch inventory data from the database"""
    try:
        # Parse the time period
        start_date, end_date = parse_time_period(time_period)
        
        query = """
        SELECT 
            i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, 
            i.Unit_Cost, w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name,
            w.Storage_Cost_Per_Unit, w.Warehouse_Type,
            ist.Current_Stock, ist.Average_Stock_Level, ist.Snapshot_Date,
            i.Lead_Time_Days, i.Obsolescence_Risk, i.Storage_Requirements
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
        JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
        WHERE ist.Snapshot_Date BETWEEN '{start_date}' AND '{end_date}'
        """.format(start_date=start_date, end_date=end_date)
        
        # Add category filter if provided
        if category:
            query += f" AND i.Item_Category = '{category}'"
            
        # Add warehouse filter if provided
        if warehouse_id:
            query += f" AND w.Warehouse_ID = '{warehouse_id}'"
        
        result = db_connector.execute_query(query)
        
        if not result:
            logger.warning("No inventory data found in the database for the specified time period.")
            return pd.DataFrame()
        
        # Create DataFrame with proper column names
        df = pd.DataFrame(result, columns=[
            'Item_Key', 'Item_Number', 'Item_Name', 'Item_Category',
            'Unit_Cost', 'Warehouse_Key', 'Warehouse_ID', 'Warehouse_Name',
            'Storage_Cost_Per_Unit', 'Warehouse_Type',
            'Current_Stock', 'Average_Stock_Level', 'Snapshot_Date',
            'Lead_Time_Days', 'Obsolescence_Risk', 'Storage_Requirements'
        ])
        
        return df
    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
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



def calculate_holding_costs(data: pd.DataFrame, annual_holding_cost_percentage: float, opportunity_cost_rate: float) -> pd.DataFrame:
    """Calculate holding costs and related metrics"""
    # Calculate average inventory value
    data["Average Inventory Value"] = data["Average_Stock_Level"] * data["Unit_Cost"]
    
    # Calculate annual holding costs
    data["Annual Holding Cost"] = data["Average Inventory Value"] * annual_holding_cost_percentage
    
    # Calculate opportunity cost
    data["Annual Opportunity Cost"] = data["Average Inventory Value"] * opportunity_cost_rate
    
    # Calculate storage cost
    data["Annual Storage Cost"] = data["Average_Stock_Level"] * data["Storage_Cost_Per_Unit"] * 365
    
    # Calculate risk cost (obsolescence)
    data["Annual Risk Cost"] = data["Average Inventory Value"] * data["Obsolescence_Risk"]
    
    # Calculate total holding cost
    data["Total Holding Cost"] = (
        data["Annual Holding Cost"] +
        data["Annual Opportunity Cost"] +
        data["Annual Storage Cost"] +
        data["Annual Risk Cost"]
    )
    
    # Calculate holding cost as percentage of inventory value
    data["Holding Cost %"] = data["Total Holding Cost"] / data["Average Inventory Value"]
    
    # Identify items with excessive holding costs (above 30% of inventory value)
    data["Excessive Holding Cost"] = data["Holding Cost %"] > 0.3
    
    # Calculate potential annual savings
    data["Potential Annual Savings"] = data["Excessive Holding Cost"] * (
        data["Total Holding Cost"] - (data["Average Inventory Value"] * 0.3)
    )
    
    return data

def generate_recommendations(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate recommendations based on analysis results"""
    recommendations = {
        "summary": {
            "total_items": len(data),
            "total_inventory_value": data["Average Inventory Value"].sum(),
            "total_holding_cost": data["Total Holding Cost"].sum(),
            "excessive_cost_items": len(data[data["Excessive Holding Cost"]]),
            "potential_savings": data["Potential Annual Savings"].sum()
        },
        "by_category": {},
        "by_warehouse": {},
        "top_high_cost": [],
        "action_plan": {}
    }
    
    # Analyze by category
    category_analysis = data.groupby("Item_Category").agg({
        "Average Inventory Value": "sum",
        "Total Holding Cost": "sum",
        "Item_Key": "count",
        "Excessive Holding Cost": "sum",
        "Potential Annual Savings": "sum"
    }).reset_index()
    
    category_analysis = category_analysis.rename(columns={"Item_Key": "Items Count"})
    
    for _, row in category_analysis.iterrows():
        category = row["Item_Category"]
        recommendations["by_category"][category] = {
            "items_count": int(row["Items Count"]),
            "inventory_value": float(row["Average Inventory Value"]),
            "holding_cost": float(row["Total Holding Cost"]),
            "high_cost_items": int(row["Excessive Holding Cost"]),
            "potential_savings": float(row["Potential Annual Savings"])
        }
    
    # Analyze by warehouse
    warehouse_analysis = data.groupby(["Warehouse_ID", "Warehouse_Name", "Warehouse_Type"]).agg({
        "Average Inventory Value": "sum",
        "Total Holding Cost": "sum",
        "Item_Key": "count",
        "Excessive Holding Cost": "sum",
        "Potential Annual Savings": "sum"
    }).reset_index()
    
    warehouse_analysis = warehouse_analysis.rename(columns={"Item_Key": "Items Count"})
    
    for _, row in warehouse_analysis.iterrows():
        warehouse_id = row["Warehouse_ID"]
        recommendations["by_warehouse"][warehouse_id] = {
            "warehouse_name": row["Warehouse_Name"],
            "warehouse_type": row["Warehouse_Type"],
            "items_count": int(row["Items Count"]),
            "inventory_value": float(row["Average Inventory Value"]),
            "holding_cost": float(row["Total Holding Cost"]),
            "high_cost_items": int(row["Excessive Holding Cost"]),
            "potential_savings": float(row["Potential Annual Savings"])
        }
    
    # Get top high-cost items
    high_cost_items = data[data["Excessive Holding Cost"]].sort_values(
        "Total Holding Cost", ascending=False
    ).head(10)
    
    for _, row in high_cost_items.iterrows():
        recommendations["top_high_cost"].append({
            "item_number": row["Item_Number"],
            "item_name": row["Item_Name"],
            "warehouse": row["Warehouse_Name"],
            "inventory_value": float(row["Average Inventory Value"]),
            "holding_cost": float(row["Total Holding Cost"]),
            "holding_cost_pct": float(row["Holding Cost %"]),
            "potential_savings": float(row["Potential Annual Savings"])
        })
    
    # Generate action plan
    recommendations["action_plan"] = {
        "immediate": [
            "Review and optimize top 10 high-cost items",
            "Implement just-in-time inventory for high-cost items",
            "Review and adjust safety stock levels",
            "Consider alternative storage options for high-cost items"
        ],
        "short_term": [
            "Implement inventory optimization program",
            "Review and update warehouse storage policies",
            "Establish regular holding cost review process",
            "Develop cost optimization dashboard"
        ],
        "long_term": [
            "Implement vendor-managed inventory for appropriate items",
            "Develop strategic partnerships with key suppliers",
            "Invest in warehouse automation",
            "Implement advanced inventory optimization system"
        ]
    }
    
    return recommendations

def format_result(data: pd.DataFrame, recommendations: Dict[str, Any]) -> str:
    """Format the analysis results as a detailed text report"""
    result = "# Inventory Holding Cost Analysis\n\n"
    
    # Add summary statistics
    result += "## Summary Statistics\n\n"
    result += f"Total Items Analyzed: {recommendations['summary']['total_items']}\n"
    result += f"Total Inventory Value: ${recommendations['summary']['total_inventory_value']:,.2f}\n"
    result += f"Total Annual Holding Cost: ${recommendations['summary']['total_holding_cost']:,.2f}\n"
    result += f"Items with Excessive Holding Costs: {recommendations['summary']['excessive_cost_items']}\n"
    result += f"Potential Annual Savings: ${recommendations['summary']['potential_savings']:,.2f}\n\n"
    
    # Add category analysis
    result += "## Analysis by Category\n\n"
    for category, stats in recommendations["by_category"].items():
        result += f"### {category}\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Annual Holding Cost: ${stats['holding_cost']:,.2f}\n"
        result += f"- High Cost Items: {stats['high_cost_items']}\n"
        result += f"- Potential Savings: ${stats['potential_savings']:,.2f}\n\n"
    
    # Add warehouse analysis
    result += "## Analysis by Warehouse\n\n"
    for warehouse_id, stats in recommendations["by_warehouse"].items():
        result += f"### {stats['warehouse_name']} ({warehouse_id})\n"
        result += f"- Type: {stats['warehouse_type']}\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Annual Holding Cost: ${stats['holding_cost']:,.2f}\n"
        result += f"- High Cost Items: {stats['high_cost_items']}\n"
        result += f"- Potential Savings: ${stats['potential_savings']:,.2f}\n\n"
    
    # Add top high-cost items
    result += "## Top Items with Excessive Holding Costs\n\n"
    for item in recommendations["top_high_cost"]:
        result += f"- {item['item_number']} - {item['item_name']} ({item['warehouse']})\n"
        result += f"  - Inventory Value: ${item['inventory_value']:,.2f}\n"
        result += f"  - Annual Holding Cost: ${item['holding_cost']:,.2f}\n"
        result += f"  - Holding Cost %: {item['holding_cost_pct']:.1%}\n"
        result += f"  - Potential Savings: ${item['potential_savings']:,.2f}\n\n"
    
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
    
    with open("inventory_holding_cost_analysis.log", "w") as f: 
        f.write(result)
    return result

if __name__ == "__main__":
    # Test the tool
    result = analyze_holding_costs(
        time_period="last_year",
        annual_holding_cost_percentage=0.25,
        opportunity_cost_rate=0.08
    )
    with open("inventory_holding_cost_analysis.log", "w") as f:
        f.write(result)
    print(result[:500] + "...\n[Output truncated]")  # Print just the beginning to avoid cluttering the console
 
 
 