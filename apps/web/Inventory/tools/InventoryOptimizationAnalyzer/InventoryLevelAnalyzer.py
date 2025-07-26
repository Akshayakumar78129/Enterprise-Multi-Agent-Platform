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
import sys

# Add the project root to the path so we can import our modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from orchestration_agent.database.connector import DatabaseConnector

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

def analyze_inventory_levels(
    time_period: str = "last_quarter",
    min_stock_threshold: float = 0.1,
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes current inventory levels across warehouses and products.
    Identifies stock status and potential stockout risks.
    
    Args:
        time_period: Time period for analysis, such as 'last_quarter', 'last_6_months', 'last_year', 
                    or a specific date range in format 'YYYY-MM-DD:YYYY-MM-DD'
        min_stock_threshold: Minimum stock level threshold as a percentage of average stock level.
                           Default is 0.1 (10%).
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
            # Generate sample data if no data is returned
            inventory_data, sales_data = generate_sample_data()
            analysis_result = "Using generated sample data for demonstration.\n\n"
        else:
            analysis_result = "Using actual data from the database.\n\n"
        
        # Calculate inventory levels and risks
        analysis_data = calculate_inventory_levels(inventory_data, sales_data, min_stock_threshold)
        
        # Generate recommendations
        recommendations = generate_recommendations(analysis_data)
        
        # Generate visualizations
        visualizations = generate_visualizations(analysis_data)
        
        # Format the result as a detailed text report
        text_result = format_result(analysis_data, recommendations)
        
        return {
            "text_report": text_result,
            "visualizations": visualizations,
            "recommendations": recommendations,
            "raw_data": analysis_data.to_dict(orient='records')
        }
        
    except Exception as e:
        logger.error(f"Error in inventory level analysis: {str(e)}")
        return {
            "error": f"An error occurred while analyzing inventory levels: {str(e)}",
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

def generate_sample_data() -> tuple:
    """Generate sample inventory and sales data for demonstration"""
    # Create a list of sample products
    products = [
        {"Item Key": 1, "Item Number": "P1001", "Item Name": "Premium Widget", "Item Category": "Widgets", "Unit Cost": 45.00},
        {"Item Key": 2, "Item Number": "P1002", "Item Name": "Standard Widget", "Item Category": "Widgets", "Unit Cost": 25.00},
        {"Item Key": 3, "Item Number": "P2001", "Item Name": "Deluxe Gadget", "Item Category": "Gadgets", "Unit Cost": 65.00},
        {"Item Key": 4, "Item Number": "P2002", "Item Name": "Basic Gadget", "Item Category": "Gadgets", "Unit Cost": 35.00},
        {"Item Key": 5, "Item Number": "P3001", "Item Name": "Professional Tool", "Item Category": "Tools", "Unit Cost": 85.00}
    ]
    
    # Create a list of sample warehouses
    warehouses = [
        {"Warehouse Key": 1, "Warehouse ID": "WH001", "Warehouse Name": "Main Distribution Center"},
        {"Warehouse Key": 2, "Warehouse ID": "WH002", "Warehouse Name": "East Coast Facility"},
        {"Warehouse Key": 3, "Warehouse ID": "WH003", "Warehouse Name": "West Coast Facility"}
    ]
    
    # Generate sample inventory data
    np.random.seed(42)  # For reproducibility
    
    inventory_data = []
    today = datetime.now().date()
    
    for product in products:
        for warehouse in warehouses:
            # Generate random inventory data
            current_stock = np.random.randint(50, 500)
            
            inventory_data.append({
                **product,
                **warehouse,
                "Current Stock": current_stock,
                "Snapshot Date": today.strftime("%Y-%m-%d")
            })
    
    # Generate sample sales data for the analyzed period
    sales_data = []
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=90)  # Last quarter
    
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    for product in products:
        for warehouse in warehouses:
            # Generate random sales data for each day
            for date in date_range:
                # More frequent sales for some products
                if product["Item Key"] in [1, 3]:  # Popular items
                    if np.random.random() < 0.7:  # 70% chance of sale
                        quantity = np.random.randint(1, 10)
                else:  # Less popular items
                    if np.random.random() < 0.3:  # 30% chance of sale
                        quantity = np.random.randint(1, 5)
                    else:
                        continue
                
                sales_data.append({
                    **product,
                    **warehouse,
                    "Transaction_Date": date.strftime("%Y-%m-%d"),
                    "Quantity": quantity
                })
    
    # Convert to DataFrames
    inventory_df = pd.DataFrame(inventory_data)
    sales_df = pd.DataFrame(sales_data)
    
    return inventory_df, sales_df

def calculate_inventory_levels(data: pd.DataFrame, sales_data: pd.DataFrame, min_stock_threshold: float) -> pd.DataFrame:
    """Calculate inventory levels and identify potential risks"""
    # Group sales data by item and warehouse to calculate average daily sales
    sales_stats = sales_data.groupby(["Item_Key", "Warehouse_Key"]).agg({
        "Quantity": "sum"
    }).reset_index()
    sales_stats.columns = ["Item_Key", "Warehouse_Key", "Total Sales"]
    
    # Calculate number of days in the analysis period
    start_date = pd.to_datetime(sales_data["Transaction_Date"].min())
    end_date = pd.to_datetime(sales_data["Transaction_Date"].max())
    days_in_period = (end_date - start_date).days
    
    # Calculate average daily sales
    sales_stats["Average Daily Sales"] = sales_stats["Total Sales"] / days_in_period
    
    # Merge with inventory data
    merged_data = pd.merge(
        data, 
        sales_stats, 
        on=["Item_Key", "Warehouse_Key"], 
        how="left"
    )
    
    # Fill missing values for items with no sales
    merged_data["Average Daily Sales"] = merged_data["Average Daily Sales"].fillna(0)
    
    # Calculate days of supply
    merged_data["Days of Supply"] = merged_data["Current_Stock"] / merged_data["Average Daily Sales"]
    
    # Calculate stock level as percentage of average daily sales
    merged_data["Stock Level %"] = merged_data["Current_Stock"] / (merged_data["Average Daily Sales"] * 30)  # 30 days
    
    # Identify low stock items
    merged_data["Is Low Stock"] = merged_data["Stock Level %"] < min_stock_threshold
    
    # Identify stockout risk items
    merged_data["Stockout Risk"] = merged_data["Days of Supply"] < 7  # Less than 7 days of supply
    
    # Calculate inventory value
    merged_data["Inventory Value"] = merged_data["Current_Stock"] * merged_data["Unit_Cost"]
    
    return merged_data

def generate_visualizations(data: pd.DataFrame) -> Dict[str, str]:
    """Generate visualizations for the analysis"""
    charts = {}
    
    try:
        # 1. Bar chart of stock levels by category
        plt.figure(figsize=(10, 6))
        category_stats = data.groupby("Item_Category").agg({
            "Stock Level %": "mean"
        }).reset_index()
        category_stats = category_stats.sort_values("Stock Level %", ascending=False)
        
        plt.bar(category_stats["Item_Category"], category_stats["Stock Level %"] * 100)
        plt.axhline(y=10, color='r', linestyle='--', label='Min Stock Threshold (10%)')
        plt.xlabel('Product Category')
        plt.ylabel('Average Stock Level (%)')
        plt.title('Average Stock Levels by Product Category')
        plt.xticks(rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["stock_levels"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 2. Bar chart of stockout risks by warehouse
        plt.figure(figsize=(10, 6))
        warehouse_risks = data.groupby("Warehouse_Name").agg({
            "Stockout Risk": "mean"
        }).reset_index()
        warehouse_risks = warehouse_risks.sort_values("Stockout Risk", ascending=False)
        
        plt.bar(warehouse_risks["Warehouse_Name"], warehouse_risks["Stockout Risk"] * 100)
        plt.xlabel('Warehouse')
        plt.ylabel('Items at Stockout Risk (%)')
        plt.title('Stockout Risk by Warehouse')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["stockout_risk"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 3. Scatter plot of inventory value vs. days of supply
        plt.figure(figsize=(10, 6))
        plt.scatter(
            data["Inventory Value"],
            data["Days of Supply"],
            alpha=0.5,
            c=data["Is Low Stock"].map({True: "red", False: "blue"})
        )
        plt.xlabel('Inventory Value ($)')
        plt.ylabel('Days of Supply')
        plt.title('Inventory Value vs. Days of Supply')
        plt.grid(True, alpha=0.3)
        plt.xscale('log')  # Logarithmic scale for wide range of inventory values
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["value_vs_supply"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
    except Exception as e:
        logger.error(f"Error generating visualizations: {str(e)}")
    
    return charts

def generate_recommendations(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate recommendations based on analysis results"""
    recommendations = {
        "summary": {
            "total_items": len(data),
            "low_stock_items": len(data[data["Is Low Stock"]]),
            "stockout_risk_items": len(data[data["Stockout Risk"]]),
            "low_stock_value": data[data["Is Low Stock"]]["Inventory Value"].sum(),
            "stockout_risk_value": data[data["Stockout Risk"]]["Inventory Value"].sum()
        },
        "by_category": {},
        "by_warehouse": {},
        "top_low_stock": [],
        "top_stockout_risk": [],
        "action_plan": {}
    }
    
    # Analyze by category
    category_analysis = data.groupby("Item_Category").agg({
        "Inventory Value": "sum",
        "Is Low Stock": "sum",
        "Stockout Risk": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in category_analysis.iterrows():
        category = row["Item_Category"]
        recommendations["by_category"][category] = {
            "items_count": int(row["Item_Key"]),
            "inventory_value": float(row["Inventory Value"]),
            "low_stock_count": int(row["Is Low Stock"]),
            "stockout_risk_count": int(row["Stockout Risk"])
        }
    
    # Analyze by warehouse
    warehouse_analysis = data.groupby(["Warehouse_ID", "Warehouse_Name"]).agg({
        "Inventory Value": "sum",
        "Is Low Stock": "sum",
        "Stockout Risk": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in warehouse_analysis.iterrows():
        warehouse_id = row["Warehouse_ID"]
        recommendations["by_warehouse"][warehouse_id] = {
            "warehouse_name": row["Warehouse_Name"],
            "items_count": int(row["Item_Key"]),
            "inventory_value": float(row["Inventory Value"]),
            "low_stock_count": int(row["Is Low Stock"]),
            "stockout_risk_count": int(row["Stockout Risk"])
        }
    
    # Identify top low stock items
    low_stock_items = data[data["Is Low Stock"]].sort_values("Stock Level %")
    
    for _, row in low_stock_items.head(10).iterrows():
        recommendations["top_low_stock"].append({
            "item_number": row["Item_Number"],
            "item_name": row["Item_Name"],
            "category": row["Item_Category"],
            "warehouse_name": row["Warehouse_Name"],
            "current_stock": row["Current_Stock"],
            "stock_level_pct": row["Stock Level %"],
            "inventory_value": row["Inventory Value"]
        })
    
    # Identify top stockout risk items
    stockout_risk_items = data[data["Stockout Risk"]].sort_values("Days of Supply")
    
    for _, row in stockout_risk_items.head(10).iterrows():
        recommendations["top_stockout_risk"].append({
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
            "Restock items with less than 7 days of supply",
            "Review and adjust safety stock levels for low stock items",
            "Expedite pending orders for critical items",
            "Implement daily stock level monitoring for at-risk items"
        ],
        "short_term": [
            "Review and update reorder points",
            "Implement automated stock alerts",
            "Develop supplier contingency plans",
            "Optimize stock distribution across warehouses"
        ],
        "long_term": [
            "Implement demand forecasting system",
            "Develop vendor-managed inventory program",
            "Establish strategic supplier partnerships",
            "Implement real-time inventory tracking"
        ]
    }
    
    return recommendations

def format_result(data: pd.DataFrame, recommendations: Dict[str, Any]) -> str:
    """Format the analysis results as a detailed text report"""
    result = "# Inventory Level Analysis\n\n"
    
    # Add summary statistics
    result += "## Summary Statistics\n\n"
    result += f"Total Items Analyzed: {recommendations['summary']['total_items']}\n"
    result += f"Items with Low Stock: {recommendations['summary']['low_stock_items']}\n"
    result += f"Items at Risk of Stockout: {recommendations['summary']['stockout_risk_items']}\n"
    result += f"Value of Low Stock Items: ${recommendations['summary']['low_stock_value']:,.2f}\n"
    result += f"Value at Risk of Stockout: ${recommendations['summary']['stockout_risk_value']:,.2f}\n\n"
    
    # Add category analysis
    result += "## Analysis by Category\n\n"
    for category, stats in recommendations["by_category"].items():
        result += f"### {category}\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Low Stock Items: {stats['low_stock_count']}\n"
        result += f"- Items at Risk of Stockout: {stats['stockout_risk_count']}\n\n"
    
    # Add warehouse analysis
    result += "## Analysis by Warehouse\n\n"
    for warehouse_id, stats in recommendations["by_warehouse"].items():
        result += f"### {stats['warehouse_name']} ({warehouse_id})\n"
        result += f"- Items: {stats['items_count']}\n"
        result += f"- Inventory Value: ${stats['inventory_value']:,.2f}\n"
        result += f"- Low Stock Items: {stats['low_stock_count']}\n"
        result += f"- Items at Risk of Stockout: {stats['stockout_risk_count']}\n\n"
    
    # Add low stock items
    result += "## Low Stock Items\n\n"
    for item in recommendations["top_low_stock"]:
        result += f"- {item['item_number']} - {item['item_name']} ({item['warehouse_name']})\n"
        result += f"  - Current Stock: {item['current_stock']}\n"
        result += f"  - Stock Level: {item['stock_level_pct']:.1%}\n"
        result += f"  - Inventory Value: ${item['inventory_value']:,.2f}\n\n"
    
    # Add stockout risk items
    result += "## Items at Risk of Stockout\n\n"
    for item in recommendations["top_stockout_risk"]:
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
    result = analyze_inventory_levels(
        time_period="last_quarter",
        min_stock_threshold=0.1
    )
    
    # Save text report
    with open("inventory_level_analysis.log", "w") as f:
        f.write(result["text_report"])
    
    # Save visualizations
    for chart_name, chart_data in result["visualizations"].items():
        # Remove the data:image/png;base64, prefix
        img_data = chart_data.split(',')[1]
        # Decode and save the image
        with open(f"orchestration_agent/tools/inventory_manager/output/inventory_level_analysis_{chart_name}.png", "wb") as f:
            f.write(base64.b64decode(img_data))
    
    print("Analysis complete. Check the following files:")
    print("- inventory_level_analysis.log (Text Report)")
    print("- inventory_analysis_stock_levels.png (Stock Levels by Category)")
    print("- inventory_analysis_stockout_risk.png (Stockout Risk by Warehouse)")
    print("- inventory_analysis_value_vs_supply.png (Value vs Supply Analysis)")
 
 
 