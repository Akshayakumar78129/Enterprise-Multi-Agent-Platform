"""Customer retention action planner tool."""

import os
import sqlite3
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def plan_retention_actions(
    customer_segments: Optional[List[str]] = None,
    churn_risk_threshold: float = 0.5,
    include_visualization: bool = False
) -> Dict:
    """
    Plan retention actions for customers based on their value, churn risk, and historical data.
    
    Args:
        customer_segments (List[str], optional): List of customer segments to analyze
        churn_risk_threshold (float, optional): Threshold for high churn risk (0.0-1.0)
        include_visualization (bool, optional): Whether to include visualizations
        
    Returns:
        Dict containing retention action plan and recommendations
    """
    try:
        # Get path to customers.db
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        logger.info("Database connected successfully.")
        
        # Build segment filter if segments provided
        segment_filter = ""
        if customer_segments:
            segments_str = ", ".join([f"'{segment}'" for segment in customer_segments])
            segment_filter = f"AND cl.\"Loyalty Status\" IN ({segments_str})"
        
        # Query to get customer data for retention planning
        query = f"""
        WITH CustomerData AS (
            SELECT 
                c."Customer Key",
                c."Customer Number",
                c."Customer Name",
                cl."Loyalty Status",
                cl."RFM Score",
                cl."Recency Band",
                cl."Frequency Band",
                cl."Monetary Band",
                cl."Days Since Last Activity",
                cl."Number Sales Txns",
                cl."Avg Sales Amount",
                cl."Last Activity Date",
                CASE 
                    WHEN cl."Days Since Last Activity" > 90 THEN 1
                    ELSE 0
                END as churn_indicator,
                CASE 
                    WHEN cl."RFM Score" >= 8 THEN 'High'
                    WHEN cl."RFM Score" >= 5 THEN 'Medium'
                    ELSE 'Low'
                END as customer_value
            FROM 
                dbo_D_Customer c
            LEFT JOIN 
                dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
            WHERE 1=1
            {segment_filter}
        )
        SELECT * FROM CustomerData
        """
        
        # Execute query and load data
        df = pd.read_sql_query(query, conn)
        
        if df.empty:
            return {
                "report": "No customer data found for the specified segments.",
                "success": False
            }
        
        # Prepare features for churn risk prediction
        feature_cols = [
            "RFM Score", "Days Since Last Activity", 
            "Number Sales Txns", "Avg Sales Amount"
        ]
        
        X = df[feature_cols].copy()
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train a simple decision tree for churn risk prediction
        model = DecisionTreeClassifier(max_depth=3, random_state=42)
        model.fit(X_scaled, df["churn_indicator"])
        
        # Predict churn risk
        df["churn_risk"] = model.predict_proba(X_scaled)[:, 1]
        
        # Define retention actions based on customer value and churn risk
        def get_retention_actions(row):
            if row["churn_risk"] < churn_risk_threshold:
                return "No action needed"
            
            if row["customer_value"] == "High":
                if row["Days Since Last Activity"] > 90:
                    return "Premium retention package + Personal outreach"
                else:
                    return "Loyalty program upgrade + Exclusive offer"
            elif row["customer_value"] == "Medium":
                if row["Days Since Last Activity"] > 90:
                    return "Standard retention package + Follow-up call"
                else:
                    return "Targeted discount + Engagement campaign"
            else:  # Low value
                if row["churn_risk"] > 0.8:
                    return "Basic retention offer"
                else:
                    return "Standard communication"
        
        # Apply retention actions
        df["recommended_action"] = df.apply(get_retention_actions, axis=1)
        
        # Calculate expected effectiveness based on historical patterns
        def estimate_effectiveness(action, value, risk):
            base_effectiveness = {
                "Premium retention package + Personal outreach": 0.85,
                "Loyalty program upgrade + Exclusive offer": 0.75,
                "Standard retention package + Follow-up call": 0.65,
                "Targeted discount + Engagement campaign": 0.60,
                "Basic retention offer": 0.45,
                "Standard communication": 0.30,
                "No action needed": 1.00
            }
            
            # Adjust based on customer value
            value_multiplier = {
                "High": 1.2,
                "Medium": 1.0,
                "Low": 0.8
            }
            
            # Adjust based on churn risk
            risk_factor = 1.0 - (risk * 0.3)  # Higher risk reduces effectiveness
            
            return base_effectiveness[action] * value_multiplier[value] * risk_factor
        
        df["expected_effectiveness"] = df.apply(
            lambda row: estimate_effectiveness(
                row["recommended_action"], 
                row["customer_value"], 
                row["churn_risk"]
            ), 
            axis=1
        )
        
        # Generate retention playbooks by segment and churn cause
        playbooks = {}
        for segment in df["Loyalty Status"].unique():
            segment_data = df[df["Loyalty Status"] == segment]
            
            # Group by churn cause (simplified as days since last activity)
            churn_causes = {
                "Inactive": segment_data[segment_data["Days Since Last Activity"] > 90],
                "At Risk": segment_data[(segment_data["Days Since Last Activity"] <= 90) & (segment_data["churn_risk"] > churn_risk_threshold)],
                "Engaged": segment_data[(segment_data["Days Since Last Activity"] <= 90) & (segment_data["churn_risk"] <= churn_risk_threshold)]
            }
            
            playbook = {}
            for cause, data in churn_causes.items():
                if not data.empty:
                    # Get top recommended actions for this cause
                    top_actions = data["recommended_action"].value_counts().head(3)
                    
                    playbook[cause] = {
                        "customer_count": len(data),
                        "avg_churn_risk": data["churn_risk"].mean(),
                        "recommended_actions": [
                            {
                                "action": action,
                                "count": count,
                                "avg_effectiveness": data[data["recommended_action"] == action]["expected_effectiveness"].mean()
                            }
                            for action, count in top_actions.items()
                        ]
                    }
            
            playbooks[segment] = playbook
        
        # Generate report
        report = "Customer Retention Action Plan\n"
        report += "============================\n\n"
        
        # Overall statistics
        report += f"Total Customers Analyzed: {len(df)}\n"
        report += f"High Churn Risk Customers: {len(df[df['churn_risk'] > churn_risk_threshold])}\n"
        report += f"Average Churn Risk: {df['churn_risk'].mean():.2f}\n\n"
        
        # Action distribution
        report += "Recommended Actions Distribution:\n"
        action_dist = df["recommended_action"].value_counts()
        for action, count in action_dist.items():
            percentage = (count/len(df))*100
            report += f"- {action}: {count} customers ({percentage:.1f}%)\n"
        
        report += "\nRetention Playbooks by Segment:\n"
        for segment, playbook in playbooks.items():
            report += f"\n{segment} Segment:\n"
            for cause, details in playbook.items():
                report += f"  {cause} Customers ({details['customer_count']}):\n"
                report += f"  - Average Churn Risk: {details['avg_churn_risk']:.2f}\n"
                report += "  - Recommended Actions:\n"
                for action in details["recommended_actions"]:
                    report += f"    * {action['action']}: {action['count']} customers, {action['avg_effectiveness']*100:.1f}% expected effectiveness\n"
        
        # Cost-benefit analysis
        report += "\nCost-Benefit Analysis:\n"
        cost_benefit = {
            "Premium retention package + Personal outreach": {"cost": 500, "benefit": 5000},
            "Loyalty program upgrade + Exclusive offer": {"cost": 200, "benefit": 3000},
            "Standard retention package + Follow-up call": {"cost": 100, "benefit": 1500},
            "Targeted discount + Engagement campaign": {"cost": 50, "benefit": 800},
            "Basic retention offer": {"cost": 25, "benefit": 400},
            "Standard communication": {"cost": 10, "benefit": 100},
            "No action needed": {"cost": 0, "benefit": 0}
        }
        
        for action, metrics in cost_benefit.items():
            if action in action_dist:
                count = action_dist[action]
                total_cost = count * metrics["cost"]
                total_benefit = count * metrics["benefit"] * df[df["recommended_action"] == action]["expected_effectiveness"].mean()
                roi = (total_benefit - total_cost) / total_cost if total_cost > 0 else 0
                report += f"- {action}:\n"
                report += f"  * Cost: ${total_cost:,.2f}\n"
                report += f"  * Expected Benefit: ${total_benefit:,.2f}\n"
                report += f"  * ROI: {roi*100:.1f}%\n"
        
        return {
            "report": report,
            "success": True,
            "data": {
                "customer_count": len(df),
                "high_risk_count": len(df[df["churn_risk"] > churn_risk_threshold]),
                "action_distribution": action_dist.to_dict(),
                "playbooks": playbooks,
                "cost_benefit": cost_benefit
            }
        }
        
    except Exception as e:
        logger.error(f"Error in retention planning: {str(e)}")
        return {
            "report": f"Failed to plan retention actions: {str(e)}",
            "success": False
        }
    finally:
        if 'conn' in locals():
            conn.close() 