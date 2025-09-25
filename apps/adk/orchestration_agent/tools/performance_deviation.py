"""Performance deviation analysis tool for orchestration agent using shared services"""

import sys
import os
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.performance_deviation.sync_processing_service import SyncPerformanceProcessingService


def analyze_performance_deviations(
    time_period: str = "default",
    business_functions: Optional[List[str]] = None,
    product_categories: Optional[List[str]] = None,
    significance_threshold: float = 0.05,
    include_visualization: bool = False
) -> str:
    """
    Analyze performance deviations across business functions using machine learning.
    This tool uses the shared processing service to ensure consistency with the dashboard.

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full year 2021 (default if not specified)
            - "last_30_days" - Last 30 days from current date
            - "last_90_days" - Last 90 days from current date
            - "last_180_days" - Last 180 days from current date
            - "last_year" - Last 365 days from current date
            - "YYYY" - Full year (e.g., "2017", "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2021-01-01:2021-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2021", "Q4 2020")
            - "YYYY-MM" - Specific month (e.g., "2021-06" for June 2021)

            EXAMPLES FROM USER QUERIES:
            - "performance deviation for 2021" → time_period="2021"
            - "performance deviation for Q4 2021" → time_period="Q4 2021"
            - "performance deviation from Jan to March 2021" → time_period="2021-01-01:2021-03-31"
            - "analyze performance for last 30 days" → time_period="last_30_days"
            - "performance deviation" (no date specified) → time_period="default"
            - "performance for June 2021" → time_period="2021-06"

        business_functions: Optional list of business functions to analyze ('sales', 'customer', 'finance')
        product_categories: Optional list of product categories to filter by
        significance_threshold: Statistical significance threshold (default 0.05)
        include_visualization: Whether to include visualizations (not implemented for consistency)

    Returns:
        String containing the analysis results in markdown format

    Note: Data is available from 2017-01-20 to 2021-12-31.
    """
    try:
        # Initialize the sync wrapper for agent framework
        service = SyncPerformanceProcessingService()

        # Build filters based on parameters
        filters = {}

        # Define data availability range
        DATA_START = datetime(2017, 1, 20)
        DATA_END = datetime(2021, 12, 31)
        current_date = datetime.now()

        # Parse time_period to extract date range
        if time_period == "default":
            # Default to full year 2021
            filters['dateFrom'] = '2021-01-01'
            filters['dateTo'] = '2021-12-31'
            print(f"[performance_deviation] Using default period: 2021 full year")

        elif time_period == "last_30_days":
            # Calculate from current date but check data availability
            if current_date > DATA_END:
                # Use last 30 days of available data
                filters['dateTo'] = '2021-12-31'
                filters['dateFrom'] = '2021-12-01'
                print(f"[performance_deviation] Adjusted to last 30 days of available data")
            else:
                filters['dateTo'] = current_date.strftime('%Y-%m-%d')
                filters['dateFrom'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')

        elif time_period == "last_90_days":
            # Calculate from current date but check data availability
            if current_date > DATA_END:
                # Use last 90 days of available data
                filters['dateTo'] = '2021-12-31'
                filters['dateFrom'] = '2021-10-02'
                print(f"[performance_deviation] Adjusted to last 90 days of available data")
            else:
                filters['dateTo'] = current_date.strftime('%Y-%m-%d')
                filters['dateFrom'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')

        elif time_period == "last_180_days":
            # Calculate from current date but check data availability
            if current_date > DATA_END:
                # Use last 180 days of available data
                filters['dateTo'] = '2021-12-31'
                filters['dateFrom'] = '2021-07-04'
                print(f"[performance_deviation] Adjusted to last 180 days of available data")
            else:
                filters['dateTo'] = current_date.strftime('%Y-%m-%d')
                filters['dateFrom'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')

        elif time_period == "last_year":
            # Calculate from current date but check data availability
            if current_date > DATA_END:
                # Use full year 2021
                filters['dateTo'] = '2021-12-31'
                filters['dateFrom'] = '2021-01-01'
                print(f"[performance_deviation] Adjusted to year 2021 (last available)")
            else:
                filters['dateTo'] = current_date.strftime('%Y-%m-%d')
                filters['dateFrom'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')

        else:
            # Parse custom time period formats

            # Check for year only (e.g., "2017", "2018", "2021")
            if time_period and time_period.isdigit() and len(time_period) == 4:
                year = int(time_period)
                filters['dateFrom'] = f'{year}-01-01'
                filters['dateTo'] = f'{year}-12-31'
                print(f"[performance_deviation] Parsed year {year} to date range: {filters['dateFrom']} to {filters['dateTo']}")

            # Check for YYYY-MM format (specific month)
            elif re.match(r'^\d{4}-\d{2}$', time_period):
                year, month = time_period.split('-')
                filters['dateFrom'] = f'{year}-{month}-01'
                # Calculate last day of month
                if month == '12':
                    filters['dateTo'] = f'{year}-12-31'
                else:
                    next_month = int(month) + 1
                    filters['dateTo'] = (datetime(int(year), next_month, 1) - timedelta(days=1)).strftime('%Y-%m-%d')
                print(f"[performance_deviation] Parsed month {time_period} to date range: {filters['dateFrom']} to {filters['dateTo']}")

            # Check for date range with colon separator (e.g., "2021-01-01:2021-12-31")
            elif ':' in time_period:
                parts = time_period.split(':')
                if len(parts) == 2:
                    filters['dateFrom'] = parts[0].strip()
                    filters['dateTo'] = parts[1].strip()
                    print(f"[performance_deviation] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

            # Check for date range with " to " separator
            elif ' to ' in time_period.lower():
                parts = time_period.lower().split(' to ')
                if len(parts) == 2:
                    filters['dateFrom'] = parts[0].strip()
                    filters['dateTo'] = parts[1].strip()
                    print(f"[performance_deviation] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

            # Check for quarter format (e.g., "Q1 2021", "2021 Q1")
            elif 'q' in time_period.lower():
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
                        print(f"[performance_deviation] Parsed quarter {quarter.upper()} {year} to date range: {filters['dateFrom']} to {filters['dateTo']}")

            # Check for month name formats (e.g., "January 2021", "Jan 2021")
            elif any(month in time_period.lower() for month in ['january', 'february', 'march', 'april', 'may', 'june',
                                                                 'july', 'august', 'september', 'october', 'november', 'december',
                                                                 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']):
                month_map = {
                    'january': '01', 'jan': '01',
                    'february': '02', 'feb': '02',
                    'march': '03', 'mar': '03',
                    'april': '04', 'apr': '04',
                    'may': '05',
                    'june': '06', 'jun': '06',
                    'july': '07', 'jul': '07',
                    'august': '08', 'aug': '08',
                    'september': '09', 'sep': '09',
                    'october': '10', 'oct': '10',
                    'november': '11', 'nov': '11',
                    'december': '12', 'dec': '12'
                }

                # Extract month and year
                for month_name, month_num in month_map.items():
                    if month_name in time_period.lower():
                        # Extract year (assume 4 digits)
                        year_match = re.search(r'\d{4}', time_period)
                        if year_match:
                            year = year_match.group()
                            filters['dateFrom'] = f'{year}-{month_num}-01'
                            # Calculate last day of month
                            if month_num == '12':
                                filters['dateTo'] = f'{year}-12-31'
                            else:
                                next_month = int(month_num) + 1
                                filters['dateTo'] = (datetime(int(year), next_month, 1) - timedelta(days=1)).strftime('%Y-%m-%d')
                            print(f"[performance_deviation] Parsed '{time_period}' to date range: {filters['dateFrom']} to {filters['dateTo']}")
                            break

            else:
                # Default to 2021 if we can't parse the time period
                filters['dateFrom'] = '2021-01-01'
                filters['dateTo'] = '2021-12-31'
                print(f"[performance_deviation] Could not parse '{time_period}', defaulting to 2021 full year")

        # Validate dates are within available range
        try:
            start_date = datetime.strptime(filters['dateFrom'], '%Y-%m-%d')
            end_date = datetime.strptime(filters['dateTo'], '%Y-%m-%d')

            if start_date < DATA_START:
                filters['dateFrom'] = DATA_START.strftime('%Y-%m-%d')
                print(f"[performance_deviation] Adjusted start date to data availability: {filters['dateFrom']}")

            if end_date > DATA_END:
                filters['dateTo'] = DATA_END.strftime('%Y-%m-%d')
                print(f"[performance_deviation] Adjusted end date to data availability: {filters['dateTo']}")

        except ValueError:
            # If date parsing fails, use default
            filters['dateFrom'] = '2021-01-01'
            filters['dateTo'] = '2021-12-31'
            print(f"[performance_deviation] Date validation failed, using default 2021")

        # Handle business functions
        if business_functions:
            # Validate business functions
            valid_functions = ['sales', 'customer', 'finance']
            validated_functions = [f for f in business_functions if f in valid_functions]

            if not validated_functions:
                return f"Invalid business functions specified. Valid options are: {', '.join(valid_functions)}"

            filters['businessFunctions'] = validated_functions
        else:
            # Default to all functions
            filters['businessFunctions'] = ['sales', 'customer', 'finance']

        # Handle product categories
        if product_categories:
            filters['productCategories'] = product_categories

        # Set significance threshold
        filters['significanceThreshold'] = significance_threshold

        # Get dashboard summary (same data as frontend)
        result = service.get_dashboard_summary(filters)

        # Check if we have data
        metadata = result.get('metadata', {})
        if metadata.get('totalDataPoints', 0) == 0:
            return f"""# Performance Deviation Analysis

**Analysis Period:** {filters['dateFrom']} to {filters['dateTo']}

## No Data Found

No performance data is available for the specified period and filters.

**Available Data Range:** 2017-01-20 to 2021-12-31

Please try:
- Using a different date range within the available data
- Checking if the business functions or product categories are correct
- Using the default view (full year 2021)
"""

        # Format the response for the agent using only the 3 core ML outputs
        formatted_response = service.format_agent_response(result)

        return formatted_response

    except Exception as e:
        return f"Analysis Error: {str(e)}"