#!/usr/bin/env python
"""
API Runner for ProductPerformanceAnalyzer

This script acts as a bridge between the Next.js API route and the ProductPerformanceAnalyzer class.
It parses command line arguments, runs the analyzer, and returns the result as JSON to stdout.
"""

import sys
import os
import json
import argparse
import logging
import traceback
from typing import List, Optional

# Configure logging to write to a file
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'api_runner.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename=log_file,
    filemode='a'
)
logger = logging.getLogger(__name__)

# Add the parent directory of Sales to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.insert(0, parent_dir)

# Now we can import from Sales
from Sales.tools.ProductPerformanceAnalyzer.ProductPerformanceAnalyzer import ProductPerformanceAnalyzer

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Run the Product Performance Analyzer')
    
    # Optional arguments
    parser.add_argument('--start_date', type=str, default='2020-01-01',
                       help='Start date in YYYY-MM-DD format (default: 2020-01-01)')
    parser.add_argument('--end_date', type=str, default='2020-12-31',
                       help='End date in YYYY-MM-DD format (default: 2020-12-31)')
    parser.add_argument('--metrics', type=str, default='sales,units,margin',
                       help='Comma-separated list of metrics to analyze (default: sales,units,margin)')
    parser.add_argument('--category_level', type=str, default='product', 
                       choices=['product', 'category', 'subcategory'],
                       help='Level of product categorization (default: product)')
    parser.add_argument('--min_sales_threshold', type=float, default=None,
                       help='Minimum sales amount to include in analysis')
    
    return parser.parse_args()

def run_analyzer(args: argparse.Namespace) -> dict:
    """Run the Product Performance Analyzer with the given arguments."""
    try:
        logger.info(f"Starting analysis with args: {args}")
        
        # Parse metrics
        metrics = args.metrics.split(',')
        
        # Validate metrics
        valid_metrics = ['sales', 'units', 'margin', 'price_bands']
        for metric in metrics:
            if metric not in valid_metrics:
                error_msg = f"Invalid metric: {metric}. Valid metrics are: {', '.join(valid_metrics)}"
                logger.error(error_msg)
                return {
                    "status": "error",
                    "message": error_msg
                }
        
        # Initialize the analyzer
        logger.info("Initializing ProductPerformanceAnalyzer")
        analyzer = ProductPerformanceAnalyzer(
            metrics=metrics,
            category_level=args.category_level,
            min_sales_threshold=args.min_sales_threshold,
            include_visualization=False  # No visualizations for API calls
        )
        
        # Run the analysis
        logger.info(f"Running analysis from {args.start_date} to {args.end_date}")
        result = analyzer.analyze_performance(
            start_date=args.start_date,
            end_date=args.end_date
        )
        
        # Only return the analysis results, not the logging messages
        if result["status"] == "success":
            logger.info("Analysis completed successfully")
            return {
                "status": "success",
                "period": result["period"],
                "results": result["results"]
            }
        else:
            logger.error(f"Analysis failed: {result.get('message', 'Unknown error')}")
            return result
        
    except Exception as e:
        error_msg = f"Error running analysis: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return {
            "status": "error",
            "message": str(e)
        }

def main() -> None:
    """Main entry point."""
    try:
        logger.info("Starting API runner")
        args = parse_args()
        result = run_analyzer(args)
        
        # Output only the JSON result to stdout
        json_output = json.dumps(result, ensure_ascii=False)
        print(json_output, flush=True)
        
    except Exception as e:
        error_msg = f"Failed to run analysis: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        error_result = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main() 