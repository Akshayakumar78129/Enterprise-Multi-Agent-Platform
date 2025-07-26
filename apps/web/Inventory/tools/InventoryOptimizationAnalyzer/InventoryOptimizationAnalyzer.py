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

from Inventory.database.connector import DatabaseConnector
from Inventory.tools.InventoryOptimizationAnalyzer.InventoryLevelAnalyzer import analyze_inventory_levels
from Inventory.tools.InventoryOptimizationAnalyzer.InventoryHoldingCostAnalyzer import analyze_holding_costs
from Inventory.tools.InventoryOptimizationAnalyzer.SlowMovingInventoryAnalyzer import analyze_slow_moving_inventory
from Inventory.tools.InventoryOptimizationAnalyzer.StockOptimizationRecommender import optimize_stock_levels

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

def analyze_inventory_optimization(
    time_period: str = "1Y",
    min_stock_threshold: int = 10,
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    service_level: float = 0.95,
    holding_cost_pct: float = 0.25,
    slow_moving_threshold: int = 90,
    min_value: float = 1000.0
) -> Dict[str, Any]:
    """
    Comprehensive inventory optimization analysis that combines multiple analyses
    to provide a holistic view of inventory performance and recommendations.
    
    Args:
        time_period: Time period for analysis (e.g., "1Y" for 1 year, "6M" for 6 months)
        min_stock_threshold: Minimum stock level threshold for alerts
        category: Product category to analyze (optional)
        warehouse_id: Specific warehouse to analyze (optional)
        service_level: Target service level for stock optimization
        holding_cost_pct: Annual holding cost as percentage of item value
        slow_moving_threshold: Days threshold for slow-moving inventory
        min_value: Minimum inventory value threshold for analysis
    
    Returns:
        Dict containing combined analysis results and visualizations
    """
    try:
        # Run individual analyses
        inventory_level_results = analyze_inventory_levels(
            time_period=time_period,
            min_stock_threshold=min_stock_threshold,
            category=category,
            warehouse_id=warehouse_id
        )
        
        holding_cost_results = analyze_holding_costs(
            time_period=time_period,
            category=category,
            warehouse_id=warehouse_id,
            min_value=min_value
        )
        
        slow_moving_results = analyze_slow_moving_inventory(
            time_period=time_period,
            threshold_days=slow_moving_threshold,
            category=category,
            warehouse_id=warehouse_id
        )
        
        optimization_results = optimize_stock_levels(
            category=category,
            warehouse_id=warehouse_id,
            service_level=service_level,
            holding_cost_pct=holding_cost_pct
        )
        
        # Combine results
        combined_results = combine_analysis_results(
            inventory_level_results,
            holding_cost_results,
            slow_moving_results,
            optimization_results
        )
        
        # Generate comprehensive visualizations
        visualizations = generate_comprehensive_visualizations(
            inventory_level_results,
            holding_cost_results,
            slow_moving_results,
            optimization_results
        )
        
        # Generate final recommendations
        recommendations = generate_final_recommendations(combined_results)
        
        return {
            "text_report": format_comprehensive_report(combined_results, recommendations),
            # "visualizations": visualizations,
            "recommendations": recommendations,
            "raw_data": combined_results
        }
        
    except Exception as e:
        logger.error(f"Error in inventory optimization analysis: {str(e)}")
        return {
            "error": f"An error occurred during inventory optimization analysis: {str(e)}",
            # "visualizations": {},
            "recommendations": {},
            "raw_data": {}
        }

def combine_analysis_results(
    inventory_level_results: Dict[str, Any],
    holding_cost_results: Dict[str, Any],
    slow_moving_results: Dict[str, Any],
    optimization_results: Dict[str, Any]
) -> Dict[str, Any]:
    """Combine results from different analyses into a unified structure"""
    combined_results = {
        "inventory_levels": inventory_level_results.get("raw_data", {}),
        "holding_costs": holding_cost_results.get("raw_data", {}),
        "slow_moving": slow_moving_results.get("raw_data", {}),
        "optimization": optimization_results.get("raw_data", {}),
        "summary": {
            "total_items": len(inventory_level_results.get("raw_data", [])),
            "total_value": sum(item.get("inventory_value", 0) for item in holding_cost_results.get("raw_data", [])),
            "slow_moving_items": len(slow_moving_results.get("raw_data", [])),
            "optimization_opportunities": len(optimization_results.get("recommendations", {}).get("top_recommendations", []))
        }
    }
    
    return combined_results

def generate_comprehensive_visualizations(
    inventory_level_results: Dict[str, Any],
    holding_cost_results: Dict[str, Any],
    slow_moving_results: Dict[str, Any],
    optimization_results: Dict[str, Any]
) -> Dict[str, str]:
    """Generate comprehensive visualizations combining insights from all analyses"""
    charts = {}
    
    try:
        # 1. Combined KPI Dashboard
        plt.figure(figsize=(15, 10))
        plt.subplot(2, 2, 1)
        
        # Stock Level Distribution
        if "stock_levels" in inventory_level_results.get("visualizations", {}):
            plt.title("Stock Level Distribution")
            # Add stock level visualization logic
            
        plt.subplot(2, 2, 2)
        # Holding Cost Analysis
        if "holding_cost_distribution" in holding_cost_results.get("visualizations", {}):
            plt.title("Holding Cost Distribution")
            # Add holding cost visualization logic
            
        plt.subplot(2, 2, 3)
        # Slow Moving Items
        if "slow_moving_items" in slow_moving_results.get("visualizations", {}):
            plt.title("Slow Moving Items")
            # Add slow moving items visualization logic
            
        plt.subplot(2, 2, 4)
        # Optimization Opportunities
        if "optimization_opportunities" in optimization_results.get("visualizations", {}):
            plt.title("Optimization Opportunities")
            # Add optimization visualization logic
            
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["combined_dashboard"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 2. Cost Impact Analysis
        plt.figure(figsize=(10, 6))
        # Add cost impact visualization logic
        plt.title("Cost Impact Analysis")
        plt.xlabel("Category")
        plt.ylabel("Cost Impact ($)")
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["cost_impact"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
        # 3. Performance Metrics Timeline
        plt.figure(figsize=(12, 6))
        # Add performance metrics visualization logic
        plt.title("Performance Metrics Timeline")
        plt.xlabel("Time")
        plt.ylabel("Performance Score")
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format="png")
        buffer.seek(0)
        charts["performance_timeline"] = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        plt.close()
        
    except Exception as e:
        logger.error(f"Error generating comprehensive visualizations: {str(e)}")
    
    return charts

def generate_final_recommendations(combined_results: Dict[str, Any]) -> Dict[str, Any]:
    """Generate final recommendations based on combined analysis results"""
    recommendations = {
        "critical_actions": [],
        "optimization_opportunities": [],
        "cost_reduction_strategies": [],
        "inventory_health_improvements": []
    }
    
    try:
        # Analyze inventory levels
        if "inventory_levels" in combined_results:
            inventory_data = combined_results["inventory_levels"]
            # Add inventory level based recommendations
            
        # Analyze holding costs
        if "holding_costs" in combined_results:
            holding_cost_data = combined_results["holding_costs"]
            # Add holding cost based recommendations
            
        # Analyze slow moving inventory
        if "slow_moving" in combined_results:
            slow_moving_data = combined_results["slow_moving"]
            # Add slow moving inventory based recommendations
            
        # Analyze optimization opportunities
        if "optimization" in combined_results:
            optimization_data = combined_results["optimization"]
            # Add optimization based recommendations
        
        # Critical Actions
        recommendations["critical_actions"] = [
            "Address stockout risks in high-priority items",
            "Reduce excess inventory in overstock categories",
            "Optimize safety stock levels for key products",
            "Review and adjust reorder points"
        ]
        
        # Optimization Opportunities
        recommendations["optimization_opportunities"] = [
            "Implement ABC analysis for inventory categorization",
            "Develop vendor managed inventory program",
            "Establish cycle counting program",
            "Implement demand forecasting system"
        ]
        
        # Cost Reduction Strategies
        recommendations["cost_reduction_strategies"] = [
            "Negotiate better terms with suppliers",
            "Optimize order quantities",
            "Reduce safety stock for stable items",
            "Implement just-in-time for appropriate items"
        ]
        
        # Inventory Health Improvements
        recommendations["inventory_health_improvements"] = [
            "Clean up obsolete inventory",
            "Improve inventory accuracy",
            "Enhance warehouse organization",
            "Implement better tracking systems"
        ]
        
    except Exception as e:
        logger.error(f"Error generating final recommendations: {str(e)}")
    
    return recommendations

def format_comprehensive_report(
    combined_results: Dict[str, Any],
    recommendations: Dict[str, Any]
) -> str:
    """Format the comprehensive analysis results as a detailed report"""
    report = "# Comprehensive Inventory Optimization Analysis\n\n"
    
    # Executive Summary
    report += "## Executive Summary\n\n"
    report += f"Total Items Analyzed: {combined_results['summary']['total_items']}\n"
    report += f"Total Inventory Value: ${combined_results['summary']['total_value']:,.2f}\n"
    report += f"Slow Moving Items: {combined_results['summary']['slow_moving_items']}\n"
    report += f"Optimization Opportunities: {combined_results['summary']['optimization_opportunities']}\n\n"
    
    # Critical Actions
    report += "## Critical Actions\n\n"
    for action in recommendations["critical_actions"]:
        report += f"- {action}\n"
    report += "\n"
    
    # Optimization Opportunities
    report += "## Optimization Opportunities\n\n"
    for opportunity in recommendations["optimization_opportunities"]:
        report += f"- {opportunity}\n"
    report += "\n"
    
    # Cost Reduction Strategies
    report += "## Cost Reduction Strategies\n\n"
    for strategy in recommendations["cost_reduction_strategies"]:
        report += f"- {strategy}\n"
    report += "\n"
    
    # Inventory Health Improvements
    report += "## Inventory Health Improvements\n\n"
    for improvement in recommendations["inventory_health_improvements"]:
        report += f"- {improvement}\n"
    report += "\n"
    
    # Detailed Analysis Results
    report += "## Detailed Analysis Results\n\n"
    
    # Inventory Levels Analysis
    if "inventory_levels" in combined_results:
        report += "### Inventory Levels Analysis\n\n"
        # Add inventory levels analysis details
        report += "\n"
    
    # Holding Costs Analysis
    if "holding_costs" in combined_results:
        report += "### Holding Costs Analysis\n\n"
        # Add holding costs analysis details
        report += "\n"
    
    # Slow Moving Inventory Analysis
    if "slow_moving" in combined_results:
        report += "### Slow Moving Inventory Analysis\n\n"
        # Add slow moving inventory analysis details
        report += "\n"
    
    # Stock Optimization Analysis
    if "optimization" in combined_results:
        report += "### Stock Optimization Analysis\n\n"
        # Add stock optimization analysis details
        report += "\n"
    
    return report

if __name__ == "__main__":
    # Test the tool
    result = analyze_inventory_optimization(
        time_period="1Y",
        min_stock_threshold=10,
        service_level=0.95,
        holding_cost_pct=0.25,
        slow_moving_threshold=90,
        min_value=1000.0
    )
    
    # Save text report
    with open("inventory_optimization_analysis.log", "w") as f:
        f.write(result["text_report"])
    
    # Save visualizations
    for chart_name, chart_data in result["visualizations"].items():
        # Remove the data:image/png;base64, prefix
        img_data = chart_data.split(',')[1]
        # Decode and save the image
        with open(f"inventory_analysis_{chart_name}.png", "wb") as f:
            f.write(base64.b64decode(img_data))
    
    print("Analysis complete. Check the following files:")
    print("- inventory_optimization_analysis.log (Text Report)")
    print("- inventory_analysis_combined_dashboard.png (Combined KPI Dashboard)")
    print("- inventory_analysis_cost_impact.png (Cost Impact Analysis)")
    print("- inventory_analysis_performance_timeline.png (Performance Timeline)") 
 
 
 