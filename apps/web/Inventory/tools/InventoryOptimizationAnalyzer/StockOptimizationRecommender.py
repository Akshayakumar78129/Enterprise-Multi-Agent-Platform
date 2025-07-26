import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any, Union, Optional
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

def optimize_stock_levels(
    items: Optional[List[str]] = None,
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    service_level: float = 0.95,
    holding_cost_pct: float = 0.25
) -> Dict[str, Any]:
    """
    Analyzes inventory patterns and provides detailed recommendations for 
    optimizing stock levels, reorder points, and order quantities.
    
    Args:
        items: List of specific item numbers to analyze. If not provided, will analyze items based on other parameters.
        category: Product category to analyze. If not provided, will analyze all categories.
        warehouse_id: Specific warehouse ID to analyze. If not provided, will analyze all warehouses.
        service_level: Target service level (between 0 and 1). Higher values result in higher safety stock recommendations.
        holding_cost_pct: Annual inventory holding cost as a percentage of item value.
    
    Returns:
        Dict containing analysis results and visualizations
    """
    try:
        # Get a database connector instance
        db_connector = DatabaseConnector.get_instance()
        
        # Fetch inventory and sales data
        inventory_data = fetch_inventory_data(db_connector, items, category, warehouse_id)
        sales_data = fetch_sales_data(db_connector, items, category, warehouse_id)
        
        if inventory_data.empty or sales_data.empty:
            # Generate sample data if no data is returned
            inventory_data, sales_data = generate_sample_data()
            analysis_result = "Using generated sample data for demonstration.\n\n"
        else:
            analysis_result = "Using actual data from the database.\n\n"
        
        # Calculate optimal inventory parameters
        optimization_results = calculate_optimal_parameters(inventory_data, sales_data, service_level, holding_cost_pct)
        
        # Generate recommendations based on optimization results
        recommendations = generate_recommendations(optimization_results)
        
        # Generate visualizations
        visualizations = generate_visualizations(optimization_results)
        
        # Format the result as a detailed text report
        text_result = format_result(recommendations)
        
        return {
            "text_report": text_result,
            # "visualizations": visualizations,
            "recommendations": recommendations,
            "raw_data": optimization_results.to_dict(orient='records')
        }
        
    except Exception as e:
        logger.error(f"Error in stock optimization analysis: {str(e)}")
        return {
            "error": f"An error occurred while generating inventory optimization recommendations: {str(e)}",
            # "visualizations": {},
            "recommendations": {},
            "raw_data": []
        }

def fetch_inventory_data(db_connector, items: Optional[List[str]], category: Optional[str], warehouse_id: Optional[str]) -> pd.DataFrame:
    """Fetch inventory data from the database"""
    try:
        query = """
        SELECT 
            i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, 
            i.Unit_Cost, w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name,
            ist.Current_Stock, ist.Reorder_Point, ist.Safety_Stock,
            ist.Snapshot_Date
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
        JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
        WHERE ist.Snapshot_Date = (SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot)
        """
        
        # Add filters if provided
        if items:
            item_list = "', '".join(items)
            query += f" AND i.Item_Number IN ('{item_list}')"
        
        if category:
            query += f" AND i.Item_Category = '{category}'"
        
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
            'Current_Stock', 'Reorder_Point', 'Safety_Stock', 'Snapshot_Date'
        ])
        
        return df
    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
        return pd.DataFrame()

def fetch_sales_data(db_connector, items: Optional[List[str]], category: Optional[str], warehouse_id: Optional[str]) -> pd.DataFrame:
    """Fetch sales data from the database"""
    try:
        # Get last year's data
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=365)
        
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
        
        # Add filters if provided
        if items:
            item_list = "', '".join(items)
            query += f" AND i.Item_Number IN ('{item_list}')"
        
        if category:
            query += f" AND i.Item_Category = '{category}'"
        
        if warehouse_id:
            query += f" AND w.Warehouse_ID = '{warehouse_id}'"
        
        result = db_connector.execute_query(query)
        
        if not result:
            logger.warning("No sales data found in the database.")
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
            safety_stock = current_stock * 0.2  # 20% of current stock
            reorder_point = current_stock * 0.3  # 30% of current stock
            
            inventory_data.append({
                **product,
                **warehouse,
                "Current Stock": current_stock,
                "Safety Stock": safety_stock,
                "Reorder Point": reorder_point,
                "Snapshot Date": today.strftime("%Y-%m-%d")
            })
    
    # Generate sample sales data for the analyzed period
    sales_data = []
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)  # Last year
    
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

def calculate_optimal_parameters(data: pd.DataFrame, sales_data: pd.DataFrame, service_level: float, holding_cost_pct: float) -> pd.DataFrame:
    """Calculate optimal inventory parameters based on historical data"""
    # Group sales data by item and warehouse to calculate statistics
    sales_stats = sales_data.groupby(["Item_Key", "Warehouse_Key"]).agg({
        "Quantity": ["sum", "mean", "std", "count"]
    }).reset_index()
    
    # Flatten the multi-level column names
    sales_stats.columns = ["Item_Key", "Warehouse_Key", "Annual Sales", "Daily Sales Avg", "Daily Sales Std", "Transaction Count"]
    
    # Merge with inventory data
    merged_data = pd.merge(
        data, 
        sales_stats, 
        on=["Item_Key", "Warehouse_Key"], 
        how="left"
    )
    
    # Fill missing values for items with no sales
    merged_data["Daily Sales Avg"] = merged_data["Daily Sales Avg"].fillna(0)
    merged_data["Daily Sales Std"] = merged_data["Daily Sales Std"].fillna(0)
    merged_data["Annual Sales"] = merged_data["Annual Sales"].fillna(0)
    
    # Calculate optimal parameters
    # 1. Safety Stock
    z_score = np.abs(np.percentile(np.random.standard_normal(10000), service_level * 100))
    merged_data["Optimal Safety Stock"] = z_score * merged_data["Daily Sales Std"] * np.sqrt(30)  # 30 days lead time
    
    # 2. Reorder Point
    merged_data["Optimal Reorder Point"] = (merged_data["Daily Sales Avg"] * 30) + merged_data["Optimal Safety Stock"]
    
    # 3. Economic Order Quantity (EOQ)
    # Assuming order cost is 10% of unit cost
    merged_data["Order Cost"] = merged_data["Unit_Cost"] * 0.1
    merged_data["Optimal Order Quantity"] = np.sqrt(
        (2 * merged_data["Annual Sales"] * merged_data["Order Cost"]) / 
        (merged_data["Unit_Cost"] * holding_cost_pct)
    )
    
    # Round to nearest integer
    merged_data["Optimal Order Quantity"] = merged_data["Optimal Order Quantity"].round()
    
    # Calculate current vs optimal ratios
    merged_data["Safety Stock Ratio"] = merged_data["Safety_Stock"] / merged_data["Optimal Safety Stock"]
    merged_data["Reorder Point Ratio"] = merged_data["Reorder_Point"] / merged_data["Optimal Reorder Point"]
    
    return merged_data

def generate_visualizations(data: pd.DataFrame) -> Dict[str, str]:
    """Generate visualizations for the analysis"""
    charts = {}
    
    try:
        # 1. Bar chart of safety stock ratios by category
        plt.figure(figsize=(10, 6))
        category_stats = data.groupby("Item_Category").agg({
            "Safety Stock Ratio": "mean"
        }).reset_index()
        category_stats = category_stats.sort_values("Safety Stock Ratio", ascending=False)
        
        plt.bar(category_stats["Item_Category"], category_stats["Safety Stock Ratio"])
        plt.axhline(y=1.0, color='r', linestyle='--', label='Optimal Ratio')
        plt.xlabel('Product Category')
        plt.ylabel('Average Safety Stock Ratio')
        plt.title('Safety Stock Ratio by Product Category')
        plt.xticks(rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["safety_stock_ratio"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 2. Bar chart of reorder point ratios by warehouse
        plt.figure(figsize=(10, 6))
        warehouse_stats = data.groupby("Warehouse_Name").agg({
            "Reorder Point Ratio": "mean"
        }).reset_index()
        warehouse_stats = warehouse_stats.sort_values("Reorder Point Ratio", ascending=False)
        
        plt.bar(warehouse_stats["Warehouse_Name"], warehouse_stats["Reorder Point Ratio"])
        plt.axhline(y=1.0, color='r', linestyle='--', label='Optimal Ratio')
        plt.xlabel('Warehouse')
        plt.ylabel('Average Reorder Point Ratio')
        plt.title('Reorder Point Ratio by Warehouse')
        plt.xticks(rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["reorder_point_ratio"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 3. Scatter plot of inventory value vs. optimal order quantity
        plt.figure(figsize=(10, 6))
        plt.scatter(
            data["Unit_Cost"] * data["Current_Stock"],
            data["Optimal Order Quantity"],
            alpha=0.5
        )
        plt.xlabel('Current Inventory Value ($)')
        plt.ylabel('Optimal Order Quantity')
        plt.title('Inventory Value vs. Optimal Order Quantity')
        plt.grid(True, alpha=0.3)
        plt.xscale('log')  # Logarithmic scale for wide range of inventory values
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["value_vs_quantity"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
    except Exception as e:
        logger.error(f"Error generating visualizations: {str(e)}")
    
    return charts

def generate_recommendations(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate recommendations based on optimization results"""
    recommendations = {
        "summary": {
            "total_items": len(data),
            "items_analyzed": len(data[data["Annual Sales"] > 0]),
            "items_without_sales": len(data[data["Annual Sales"] == 0]),
            "avg_safety_stock_increase": data["Safety Stock Ratio"].mean(),
            "avg_reorder_point_increase": data["Reorder Point Ratio"].mean()
        },
        "by_category": {},
        "by_warehouse": {},
        "top_recommendations": [],
        "action_plan": {}
    }
    
    # Analyze by category
    category_analysis = data.groupby("Item_Category").agg({
        "Annual Sales": "sum",
        "Unit_Cost": "mean",
        "Current_Stock": "sum",
        "Optimal Safety Stock": "sum",
        "Optimal Reorder Point": "sum",
        "Optimal Order Quantity": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in category_analysis.iterrows():
        category = row["Item_Category"]
        recommendations["by_category"][category] = {
            "items_count": int(row["Item_Key"]),
            "annual_sales": float(row["Annual Sales"]),
            "avg_unit_cost": float(row["Unit_Cost"]),
            "current_stock": float(row["Current_Stock"]),
            "optimal_safety_stock": float(row["Optimal Safety Stock"]),
            "optimal_reorder_point": float(row["Optimal Reorder Point"]),
            "optimal_order_quantity": float(row["Optimal Order Quantity"])
        }
    
    # Analyze by warehouse
    warehouse_analysis = data.groupby(["Warehouse_ID", "Warehouse_Name"]).agg({
        "Annual Sales": "sum",
        "Current_Stock": "sum",
        "Optimal Safety Stock": "sum",
        "Optimal Reorder Point": "sum",
        "Optimal Order Quantity": "sum",
        "Item_Key": "count"
    }).reset_index()
    
    for _, row in warehouse_analysis.iterrows():
        warehouse_id = row["Warehouse_ID"]
        recommendations["by_warehouse"][warehouse_id] = {
            "warehouse_name": row["Warehouse_Name"],
            "items_count": int(row["Item_Key"]),
            "annual_sales": float(row["Annual Sales"]),
            "current_stock": float(row["Current_Stock"]),
            "optimal_safety_stock": float(row["Optimal Safety Stock"]),
            "optimal_reorder_point": float(row["Optimal Reorder Point"]),
            "optimal_order_quantity": float(row["Optimal Order Quantity"])
        }
    
    # Identify top recommendations
    # Sort by largest difference between current and optimal parameters
    data["Safety Stock Difference"] = abs(data["Safety_Stock"] - data["Optimal Safety Stock"])
    data["Reorder Point Difference"] = abs(data["Reorder_Point"] - data["Optimal Reorder Point"])
    
    # Get top 10 items with largest differences
    top_items = data.nlargest(10, ["Safety Stock Difference", "Reorder Point Difference"])
    
    for _, row in top_items.iterrows():
        recommendations["top_recommendations"].append({
            "item_number": row["Item_Number"],
            "item_name": row["Item_Name"],
            "category": row["Item_Category"],
            "warehouse_name": row["Warehouse_Name"],
            "current_safety_stock": row["Safety_Stock"],
            "optimal_safety_stock": row["Optimal Safety Stock"],
            "current_reorder_point": row["Reorder_Point"],
            "optimal_reorder_point": row["Optimal Reorder Point"],
            "optimal_order_quantity": row["Optimal Order Quantity"]
        })
    
    # Generate action plan
    recommendations["action_plan"] = {
        "immediate": [
            "Review and adjust safety stock levels for top 10 items",
            "Update reorder points based on optimal calculations",
            "Implement new order quantities for items with significant differences",
            "Review items with no sales history for potential discontinuation"
        ],
        "short_term": [
            "Implement cycle counting program to improve inventory accuracy",
            "Review and update inventory policies by category",
            "Establish regular review process for safety stock levels",
            "Develop inventory optimization dashboard"
        ],
        "long_term": [
            "Implement automated inventory optimization system",
            "Develop vendor-managed inventory program for appropriate items",
            "Establish cross-functional inventory optimization team",
            "Implement advanced forecasting methods"
        ]
    }
    
    return recommendations

def format_result(recommendations: Dict[str, Any]) -> str:
    """Format the analysis results as a detailed text report"""
    result = "# Stock Optimization Recommendations\n\n"
    
    # Summary section
    result += "## Summary\n\n"
    result += f"Total Items Analyzed: {recommendations['summary']['total_items']}\n"
    result += f"Items with Sales History: {recommendations['summary']['items_analyzed']}\n"
    result += f"Items without Sales: {recommendations['summary']['items_without_sales']}\n"
    result += f"Average Safety Stock Ratio: {recommendations['summary']['avg_safety_stock_increase']:.2f}\n"
    result += f"Average Reorder Point Ratio: {recommendations['summary']['avg_reorder_point_increase']:.2f}\n\n"
    
    # Top recommendations
    result += "## Top Optimization Opportunities\n\n"
    for i, rec in enumerate(recommendations["top_recommendations"], 1):
        result += f"### {i}. {rec['item_name']} ({rec['item_number']})\n"
        result += f"Category: {rec['category']}\n"
        result += f"Warehouse: {rec['warehouse_name']}\n"
        result += f"Current Safety Stock: {rec['current_safety_stock']:.0f}\n"
        result += f"Optimal Safety Stock: {rec['optimal_safety_stock']:.0f}\n"
        result += f"Current Reorder Point: {rec['current_reorder_point']:.0f}\n"
        result += f"Optimal Reorder Point: {rec['optimal_reorder_point']:.0f}\n"
        result += f"Recommended Order Quantity: {rec['optimal_order_quantity']:.0f}\n\n"
    
    # Category analysis
    result += "## Category Analysis\n\n"
    for category, data in recommendations["by_category"].items():
        result += f"### {category}\n\n"
        result += f"- Items: {data['items_count']}\n"
        result += f"- Annual Sales: {data['annual_sales']:.0f}\n"
        result += f"- Average Unit Cost: ${data['avg_unit_cost']:.2f}\n"
        result += f"- Current Stock: {data['current_stock']:.0f}\n"
        result += f"- Optimal Safety Stock: {data['optimal_safety_stock']:.0f}\n"
        result += f"- Optimal Reorder Point: {data['optimal_reorder_point']:.0f}\n"
        result += f"- Optimal Order Quantity: {data['optimal_order_quantity']:.0f}\n\n"
    
    # Warehouse analysis
    result += "## Warehouse Analysis\n\n"
    for warehouse_id, data in recommendations["by_warehouse"].items():
        result += f"### {data['warehouse_name']} ({warehouse_id})\n\n"
        result += f"- Items: {data['items_count']}\n"
        result += f"- Annual Sales: {data['annual_sales']:.0f}\n"
        result += f"- Current Stock: {data['current_stock']:.0f}\n"
        result += f"- Optimal Safety Stock: {data['optimal_safety_stock']:.0f}\n"
        result += f"- Optimal Reorder Point: {data['optimal_reorder_point']:.0f}\n"
        result += f"- Optimal Order Quantity: {data['optimal_order_quantity']:.0f}\n\n"
    
    # Action plan
    result += "## Action Plan\n\n"
    
    result += "### Immediate Actions (0-30 days)\n\n"
    for action in recommendations["action_plan"]["immediate"]:
        result += f"- {action}\n"
    result += "\n"
    
    result += "### Short-term Actions (30-90 days)\n\n"
    for action in recommendations["action_plan"]["short_term"]:
        result += f"- {action}\n"
    result += "\n"
    
    result += "### Long-term Actions (90+ days)\n\n"
    for action in recommendations["action_plan"]["long_term"]:
        result += f"- {action}\n"
    result += "\n"
    
    return result

if __name__ == "__main__":
    # Test the tool
    result = optimize_stock_levels(
        service_level=0.95,
        holding_cost_pct=0.25
    )
    
    # Save text report
    with open("stock_optimization_recommendations.log", "w") as f:
        f.write(result["text_report"])
    
    # Save visualizations
    for chart_name, chart_data in result["visualizations"].items():
        # Remove the data:image/png;base64, prefix
        img_data = chart_data.split(',')[1]
        # Decode and save the image
        with open(f"inventory_analysis_{chart_name}.png", "wb") as f:
            f.write(base64.b64decode(img_data))
    
    print("Analysis complete. Check the following files:")
    print("- stock_optimization_recommendations.log (Text Report)")
    print("- inventory_analysis_safety_stock_ratio.png (Safety Stock Analysis)")
    print("- inventory_analysis_reorder_point_ratio.png (Reorder Point Analysis)")
    print("- inventory_analysis_value_vs_quantity.png (Value vs Quantity Analysis)")
 
 
 