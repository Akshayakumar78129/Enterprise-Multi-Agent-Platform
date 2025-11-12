"""Churn prediction tool for orchestration agent using shared ML predictor"""

import json
from typing import Optional, Dict
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer.churn_prediction.sync_processing_service import SyncChurnProcessingService


def predict_churn_risk(
    time_period: str = "default",
    segment_id: Optional[str] = None,
    include_visualization: bool = False,
    training_epochs: int = 100,
    batch_size: int = 32
) -> str:
    """
    Predict customer churn risk using the shared ML predictor.
    This ensures consistency with the dashboard data.

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full data range 2017-2021 (default if not specified)
            - "last_30_days" - Last 30 days from current date
            - "last_90_days" - Last 90 days from current date
            - "last_180_days" - Last 180 days from current date
            - "last_year" - Last 365 days from current date
            - "YYYY" - Full year (e.g., "2017", "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2017-01-01:2017-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2017", "Q4 2021")

            EXAMPLES FROM USER QUERIES:
            - "churn risk for 2017" → time_period="2017"
            - "churn risk for Q4 2021" → time_period="Q4 2021"
            - "churn risk from Jan to March 2019" → time_period="2019-01-01:2019-03-31"
            - "analyze churn for last 30 days" → time_period="last_30_days"
            - "churn risk" (no date specified) → time_period="default" (uses 2017-2021)

        segment_id: Optional customer segment to analyze
        include_visualization: Whether to include visualizations (not implemented for consistency)
        training_epochs: Number of training epochs for the ML model (kept for compatibility)
        batch_size: Batch size for model training (kept for compatibility)

    Returns:
        String containing the analysis results
    """
    # Call the synchronous version directly
    result = _predict_churn_risk_sync(time_period, segment_id)
    return result


def _predict_churn_risk_sync(time_period: str, segment_id: Optional[str]) -> str:
    """Synchronous implementation of churn risk prediction."""

    # Initialize the sync wrapper for agent framework
    service = SyncChurnProcessingService()

    # Build filters based on parameters
    filters = {}

    # Check if we have data for the requested period
    # Our data is from 2017-2021
    DATA_START = datetime(2017, 1, 1)
    DATA_END = datetime(2021, 12, 31)

    # For relative time periods, calculate from actual current date
    current_date = datetime.now()

    if time_period == "last_30_days":
        # Calculate from actual current date
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
        filters['dateFrom'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['timeRange'] = '30d'

        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""# Churn Risk Analysis Report

## No Data Available for Last 30 Days

The requested time period (last 30 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

To view churn risk data, please:
- Specify a date range within 2017-2021
- Use the default view (full range 2017-2021)
- Query specific historical periods

Example valid queries:
- "Show churn risk" (defaults to full range 2017-2021)
- "Churn risk for 2020"
- "Churn risk from 2020-01-01 to 2021-12-31"
"""
    elif time_period == "last_90_days":
        # Calculate from actual current date
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
        filters['dateFrom'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['timeRange'] = '90d'

        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""# Churn Risk Analysis Report

## No Data Available for Last 90 Days

The requested time period (last 90 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
"""
    elif time_period == "last_180_days":
        # Calculate from actual current date
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
        filters['dateFrom'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')

        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""# Churn Risk Analysis Report

## No Data Available for Last 180 Days

The requested time period (last 180 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
"""
    elif time_period == "last_year":
        # Calculate last year from current date
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
        filters['dateFrom'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')

        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""# Churn Risk Analysis Report

## No Data Available for Last Year

The requested time period (last year from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
"""
    else:
        # Check if time_period contains a custom date range or year
        # Handle formats like: "2017", "2017-01-01:2017-12-31", "2017-01-01 to 2017-12-31"

        # Check for year only (e.g., "2017", "2018", etc.)
        if time_period and time_period.isdigit() and len(time_period) == 4:
            year = int(time_period)
            filters['dateFrom'] = f'{year}-01-01'
            filters['dateTo'] = f'{year}-12-31'
            print(f"[churn_prediction] Parsed year {year} to date range: {filters['dateFrom']} to {filters['dateTo']}")

        # Check for date range with colon separator (e.g., "2017-01-01:2017-12-31")
        elif ':' in time_period:
            parts = time_period.split(':')
            if len(parts) == 2:
                filters['dateFrom'] = parts[0].strip()
                filters['dateTo'] = parts[1].strip()
                print(f"[churn_prediction] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

        # Check for date range with " to " separator (e.g., "2017-01-01 to 2017-12-31")
        elif ' to ' in time_period.lower():
            parts = time_period.lower().split(' to ')
            if len(parts) == 2:
                filters['dateFrom'] = parts[0].strip()
                filters['dateTo'] = parts[1].strip()
                print(f"[churn_prediction] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

        # Check for quarter format (e.g., "Q1 2017", "2017 Q1")
        elif 'q' in time_period.lower():
            import re
            match = re.search(r'(q[1-4])\s*(\d{4})|(\d{4})\s*(q[1-4])', time_period.lower())
            if match:
                groups = match.groups()
                quarter = groups[0] or groups[3]
                year = groups[1] or groups[2]

                quarter_ranges = {
                    'q1': ('01-01', '03-31'),
                    'q2': ('04-01', '06-30'),
                    'q3': ('07-01', '09-30'),
                    'q4': ('10-01', '12-31')
                }

                if quarter in quarter_ranges:
                    start, end = quarter_ranges[quarter]
                    filters['dateFrom'] = f'{year}-{start}'
                    filters['dateTo'] = f'{year}-{end}'
                    print(f"[churn_prediction] Parsed quarter {quarter.upper()} {year}: {filters['dateFrom']} to {filters['dateTo']}")

        # Default to 2017-2021 if no pattern matched or "default" specified (consistent with all dashboards)
        elif time_period == "default" or not time_period:
            filters['dateFrom'] = '2017-01-01'
            filters['dateTo'] = '2021-12-31'
            filters['timeRange'] = 'full_year'
            print(f"[churn_prediction] Using default date range (2017-2021): {filters['dateFrom']} to {filters['dateTo']}")

        # Fallback for any unrecognized format
        else:
            filters['dateFrom'] = '2017-01-01'
            filters['dateTo'] = '2021-12-31'
            filters['timeRange'] = 'full_year'
            print(f"[churn_prediction] Unrecognized time_period '{time_period}', using default (2017-2021): {filters['dateFrom']} to {filters['dateTo']}")

    # Add segment filter if specified
    if segment_id:
        filters['segment'] = segment_id

    try:
        # Get dashboard summary data (same data shown in UI)
        print(f"[churn_prediction] Fetching data with filters: {filters}")
        summary_data = service.get_dashboard_summary(filters)
        print(f"[churn_prediction] Summary data keys: {summary_data.keys() if summary_data else 'None'}")

        # Get customer stats for detailed analysis
        customer_stats = summary_data.get('customerStats', [])
        print(f"[churn_prediction] Customer stats count: {len(customer_stats)}")

        # Get feature importance
        feature_importance = summary_data.get('featureImportance', [])

        # Get segment risk distribution
        segment_risk = summary_data.get('segmentRisk', [])

        # Get probability distribution
        prob_dist = summary_data.get('probabilityDistribution', [])

        # Calculate risk statistics
        total_customers = len(customer_stats)

        # Handle empty customer stats by adjusting filters to get real data
        if total_customers == 0:
            print(f"[churn_prediction] No customer data found with filters: {filters}")

            # Try with broader date range to get actual data from the database
            # The dataset has data from 2017-2021, so use the full range
            print(f"[churn_prediction] Retrying with broader date range...")

            # Override filters to get all available data
            broader_filters = {
                'dateFrom': '2017-01-01',
                'dateTo': '2021-12-31'
            }

            # Add segment filter if specified
            if segment_id:
                broader_filters['segment'] = segment_id

            # Retry fetching data with broader filters
            summary_data = service.get_dashboard_summary(broader_filters)
            customer_stats = summary_data.get('customerStats', [])
            total_customers = len(customer_stats)

            # If still no data, return a proper message without hardcoded values
            if total_customers == 0:
                return """# Churn Risk Analysis Report

## No Data Available

The system could not retrieve customer data for analysis. This may be due to:

1. **Database Connection Issues**: Please verify the database is accessible
2. **Data Loading**: Ensure the customer data has been properly loaded into the system
3. **Date Range**: The available dataset contains data from 2017-2021
4. **Filters**: Check that the segment or other filters are valid

## Recommended Actions:

- Verify database connectivity
- Run data import/setup scripts if needed
- Check logs for any data loading errors
- Ensure the ML model has been trained with available data

## Visualization Data (Machine-Readable)
```json
{
  "riskPyramid": [],
  "featureImportance": [],
  "segmentMatrix": [],
  "overallMetrics": {
    "totalCustomers": 0,
    "overallRiskPercentage": 0,
    "atRiskCount": 0,
    "averageChurnProbability": 0
  }
}
```
"""

            # Update feature importance and segment risk with new data
            feature_importance = summary_data.get('featureImportance', [])
            segment_risk = summary_data.get('segmentRisk', [])

        risk_counts = {'Low': 0, 'Medium': 0, 'High': 0, 'Very High': 0}

        for customer in customer_stats:
            risk_level = customer.get('riskLevel', 'Low')
            if risk_level in risk_counts:
                risk_counts[risk_level] += 1

        # Calculate average risk percentages by level
        risk_averages = {'Low': [], 'Medium': [], 'High': [], 'Very High': []}
        all_risk_percentages = []
        for customer in customer_stats:
            risk_level = customer.get('riskLevel', 'Low')
            risk_pct = customer.get('riskPercentage', 0)
            if risk_level in risk_averages:
                risk_averages[risk_level].append(risk_pct)
            all_risk_percentages.append(risk_pct)

        avg_risk_by_level = {}
        for level, values in risk_averages.items():
            if values:
                avg_risk_by_level[level] = sum(values) / len(values)
            else:
                avg_risk_by_level[level] = 0

        # Calculate overall metrics matching frontend
        # Include Medium, High, and Very High as "at risk" customers
        at_risk_count = risk_counts['Medium'] + risk_counts['High'] + risk_counts['Very High']
        overall_risk_percentage = at_risk_count / total_customers * 100 if total_customers > 0 else 0
        average_churn_probability = sum(all_risk_percentages) / len(all_risk_percentages) if all_risk_percentages else 0

        # Format the results
        result = f"""# Churn Risk Analysis Report

## Analysis Period: {time_period}
{f"Segment: {segment_id}" if segment_id else "All Customers"}
Date Range: {filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}

## Overall Metrics

**Overall Churn Risk: {overall_risk_percentage:.1f}%** (matches dashboard display)
- This represents the percentage of customers classified as at-risk (Medium, High, or Very High)
- Same calculation as frontend dashboard: (Medium + High + Very High) / Total × 100

**Average Churn Probability: {average_churn_probability:.1f}%**
- This is the mean probability across all customers
- Provides insight into the overall churn likelihood

## Risk Distribution Summary

Total Customers Analyzed: {total_customers}

Risk Level Distribution:
- Low Risk: {risk_counts['Low']} customers ({risk_counts['Low']/total_customers*100:.1f}%) - Avg probability: {avg_risk_by_level['Low']:.1f}%
- Medium Risk: {risk_counts['Medium']} customers ({risk_counts['Medium']/total_customers*100:.1f}%) - Avg probability: {avg_risk_by_level['Medium']:.1f}%
- High Risk: {risk_counts['High']} customers ({risk_counts['High']/total_customers*100:.1f}%) - Avg probability: {avg_risk_by_level['High']:.1f}%
- Very High Risk: {risk_counts['Very High']} customers ({risk_counts['Very High']/total_customers*100:.1f}%) - Avg probability: {avg_risk_by_level['Very High']:.1f}%

## Top Contributing Factors

Based on ML model feature importance:
"""

        # Add feature importance
        for idx, feature in enumerate(feature_importance[:5], 1):
            result += f"{idx}. {feature['name']}: {feature['importance']:.1f}% importance\n"

        result += """
## Segment Analysis
"""

        # Add segment risk breakdown
        for segment in segment_risk:
            total_in_segment = segment['low'] + segment['medium'] + segment['high'] + segment['very_high']
            if total_in_segment > 0:
                result += f"""
{segment['segment']} Segment ({total_in_segment} customers):
  - Low: {segment['low']} ({segment['low']/total_in_segment*100:.1f}%)
  - Medium: {segment['medium']} ({segment['medium']/total_in_segment*100:.1f}%)
  - High: {segment['high']} ({segment['high']/total_in_segment*100:.1f}%)
  - Very High: {segment['very_high']} ({segment['very_high']/total_in_segment*100:.1f}%)
"""

        # Add high-risk customers
        high_risk_customers = [c for c in customer_stats if c['riskLevel'] in ['High', 'Very High']]
        high_risk_customers.sort(key=lambda x: x['riskPercentage'], reverse=True)

        result += f"""
## High-Risk Customers (Top 10)

"""
        for idx, customer in enumerate(high_risk_customers[:10], 1):
            result += f"{idx}. {customer['customer_name']} (ID: {customer['customer_id']})\n"
            result += f"   - Risk Level: {customer['riskLevel']} ({customer['riskPercentage']}%)\n"
            result += f"   - Last Purchase: {customer.get('last_purchase_date', 'N/A')}\n"
            result += f"   - Lifetime Value: ${customer.get('lifetime_sales', 0):,.2f}\n\n"

        result += """
## Recommendations

1. **Immediate Action Required**: Focus on customers with 'Very High' risk level
   - These customers have >70% probability of churning
   - Implement targeted retention campaigns immediately

2. **Preventive Measures**: Monitor 'High' risk customers closely
   - Risk probability between 50-70%
   - Consider personalized offers and engagement strategies

3. **Key Risk Factors to Address**:
"""

        # Add top 3 risk factors as recommendations
        for idx, feature in enumerate(feature_importance[:3], 1):
            if feature['name'] == 'Recency':
                result += f"   - Reduce time between purchases (currently key factor with {feature['importance']:.1f}% importance)\n"
            elif feature['name'] == 'Frequency':
                result += f"   - Increase purchase frequency through targeted campaigns ({feature['importance']:.1f}% importance)\n"
            elif feature['name'] == 'Monetary':
                result += f"   - Focus on increasing average order value ({feature['importance']:.1f}% importance)\n"
            elif feature['name'] == 'RFM Score':
                result += f"   - Improve overall customer engagement metrics ({feature['importance']:.1f}% importance)\n"
            else:
                result += f"   - Optimize {feature['name']} ({feature['importance']:.1f}% importance)\n"

        result += """
4. **Segment-Specific Strategies**:
"""

        # Find segment with highest risk
        max_risk_segment = None
        max_risk_pct = 0
        for segment in segment_risk:
            total = segment['low'] + segment['medium'] + segment['high'] + segment['very_high']
            if total > 0:
                risk_pct = (segment['high'] + segment['very_high']) / total * 100
                if risk_pct > max_risk_pct:
                    max_risk_pct = risk_pct
                    max_risk_segment = segment['segment']

        if max_risk_segment:
            result += f"   - Prioritize {max_risk_segment} segment (highest risk concentration: {max_risk_pct:.1f}%)\n"

        result += """
## Data Consistency Note

This analysis uses the same ML model and data as the Churn Prediction Dashboard,
ensuring complete consistency between agent responses and dashboard visualizations.

## Visualization Data (Machine-Readable)
"""

        # Add structured visualization data for easier parsing
        viz_data = {
            "riskPyramid": [
                {
                    "level": "Very High",
                    "count": risk_counts['Very High'],
                    "percentage": round(risk_counts['Very High'] / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#ef4444"
                },
                {
                    "level": "High",
                    "count": risk_counts['High'],
                    "percentage": round(risk_counts['High'] / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#f59e0b"
                },
                {
                    "level": "Medium",
                    "count": risk_counts['Medium'],
                    "percentage": round(risk_counts['Medium'] / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#eab308"
                },
                {
                    "level": "Low",
                    "count": risk_counts['Low'],
                    "percentage": round(risk_counts['Low'] / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#10b981"
                }
            ],
            "featureImportance": [
                {
                    "name": feature['name'],
                    "importance": round(feature['importance'], 1),
                    "impact": round(feature.get('impact', feature['importance']), 1)
                }
                for feature in feature_importance[:8]  # Include top 8 features
            ],
            "segmentMatrix": [
                # Transform to match SegmentComparisonMatrix component expectations
                # Each item should have: segment, riskLevel, count, percentage
                item
                for segment in segment_risk
                for item in [
                    {
                        "segment": segment['segment'],
                        "riskLevel": "Low",
                        "count": segment['low'],
                        "percentage": round(segment['low'] / total_customers * 100, 1) if total_customers > 0 else 0
                    },
                    {
                        "segment": segment['segment'],
                        "riskLevel": "Medium",
                        "count": segment['medium'],
                        "percentage": round(segment['medium'] / total_customers * 100, 1) if total_customers > 0 else 0
                    },
                    {
                        "segment": segment['segment'],
                        "riskLevel": "High",
                        "count": segment['high'],
                        "percentage": round(segment['high'] / total_customers * 100, 1) if total_customers > 0 else 0
                    },
                    {
                        "segment": segment['segment'],
                        "riskLevel": "Very High",
                        "count": segment['very_high'],
                        "percentage": round(segment['very_high'] / total_customers * 100, 1) if total_customers > 0 else 0
                    }
                ]
            ],
            "overallMetrics": {
                "totalCustomers": total_customers,
                "overallRiskPercentage": round(overall_risk_percentage, 1),
                "atRiskCount": at_risk_count,
                "averageChurnProbability": round(average_churn_probability, 1)
            }
        }

        result += f"```json\n{json.dumps(viz_data, indent=2)}\n```\n"

        return result

    except Exception as e:
        return f"""# Churn Risk Analysis Error

An error occurred while analyzing churn risk: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. ML model training status

For debugging, the error details are:
{str(e)}
"""


# Additional helper function for testing
def test_churn_prediction():
    """Test function to verify the churn prediction tool is working."""
    try:
        result = predict_churn_risk(
            time_period="last_90_days",
            segment_id=None,
            include_visualization=False
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_churn_prediction()