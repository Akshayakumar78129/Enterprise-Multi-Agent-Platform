"""
Test script for sales analysis functionality.
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from orchestration_agent.tools.sales_analyst.tools.SalesPerformanceAnalyzer import SalesPerformanceAnalyzer
import matplotlib.pyplot as plt
import base64
import io
from PIL import Image

def run_analysis(analyzer, scenario_name, start_date, end_date, metrics, dimension=None, filters=None, query_params=None):
    """Run analysis with given parameters and print results."""
    try:
        # Run the analysis
        result = analyzer.analyze_performance(
            start_date=start_date,
            end_date=end_date,
            metrics=metrics,
            dimension=dimension,
            filters=filters,
            query_params=query_params
        )
        
        # Print analysis results
        print(f"\nAnalysis Results for {scenario_name}:")
        print("-" * 50)
        
        # Print metrics
        for metric, value in result['metrics'].items():
            print(f"{metric}: {value}")
        
        # Print insights
        if 'insights' in result:
            print("\nKey Insights:")
            for insight in result['insights']:
                print(f"- {insight}")
        
        # Display visualizations
        if 'visualizations' in result:
            for name, plot_data in result['visualizations'].items():
                # Decode base64 image
                image_data = base64.b64decode(plot_data)
                image = Image.open(io.BytesIO(image_data))
                
                # Display image
                plt.figure(figsize=(10, 6))
                plt.imshow(image)
                plt.axis('off')
                plt.title(f'{name.title()} Visualization')
                plt.show()
                
    except Exception as e:
        print(f"Error in scenario {scenario_name}: {str(e)}")

def test_sales_analysis():
    """Test the sales analysis functionality with various scenarios."""
    try:
        # Initialize analyzer with visualization save path
        output_dir = project_root / 'output' / 'visualizations'
        analyzer = SalesPerformanceAnalyzer(save_path=str(output_dir))
        
        print(f"Visualizations will be saved to: {output_dir}\n")
        
        # Scenario 1: Basic product analysis
        run_analysis(
            analyzer,
            "Basic Product Analysis",
            start_date='2020-06-01',
            end_date='2020-07-31',
            metrics=['revenue', 'units', 'aov'],
            dimension='product'
        )
        
        # Scenario 2: Monthly trend analysis
        run_analysis(
            analyzer,
            "Monthly Trend Analysis",
            start_date='2020-01-01',
            end_date='2020-12-31',
            metrics=['revenue'],
            dimension=None
        )
        
        # Scenario 3: Regional analysis with filters
        run_analysis(
            analyzer,
            "Regional Analysis",
            start_date='2020-06-01',
            end_date='2020-12-31',
            metrics=['revenue', 'units'],
            dimension='region',
            filters={'Sales Org Hrchy L1 Name': 'North America'}
        )
        
        # Scenario 4: Recent performance analysis
        run_analysis(
            analyzer,
            "Recent Performance",
            start_date='2023-01-01',
            end_date='2023-12-31',
            metrics=['revenue', 'units', 'aov']
        )
                
    except Exception as e:
        print(f"Error in test: {str(e)}")
        
if __name__ == "__main__":
    test_sales_analysis() 