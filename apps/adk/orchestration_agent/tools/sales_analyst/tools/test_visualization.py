import pandas as pd
import matplotlib.pyplot as plt
from SalesTrendAnalyzer import SalesTrendAnalyzer
import base64
import io
import os
from datetime import datetime

def save_visualization(plot_data: str, filename: str):
    """Save a base64 encoded plot as an image file."""
    try:
        # Create visualizations directory if it doesn't exist
        vis_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'visualizations')
        os.makedirs(vis_dir, exist_ok=True)
        
        # Decode and save the plot
        img_data = base64.b64decode(plot_data)
        img = io.BytesIO(img_data)
        
        # Save the image
        output_path = os.path.join(vis_dir, filename)
        with open(output_path, 'wb') as f:
            f.write(img_data)
        print(f"Saved visualization to: {output_path}")
        
    except Exception as e:
        print(f"Error saving visualization: {str(e)}")

def test_visualization():
    # Create sample data with actual date range from database
    dates = pd.date_range(start='2017-01-20', end='2021-06-24', freq='M')
    revenue = [1000 + i * 100 for i in range(len(dates))]
    
    # Create DataFrame
    data = pd.DataFrame({
        'period': dates,
        'revenue': revenue,
        'product': ['Product A' if i % 2 == 0 else 'Product B' for i in range(len(dates))]
    })
    
    # Generate timestamp for unique filenames
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Test visualization without dimension
    analyzer = SalesTrendAnalyzer(
        time_period='monthly',
        metric='revenue',
        dimension=None,
        trend_periods=12
    )
    
    plot_data = analyzer._create_trend_visualization(data)
    save_visualization(plot_data, f'revenue_trend_{timestamp}.png')
    
    # Test visualization with dimension
    analyzer = SalesTrendAnalyzer(
        time_period='monthly',
        metric='revenue',
        dimension='product',
        trend_periods=12
    )
    
    plot_data = analyzer._create_trend_visualization(data)
    save_visualization(plot_data, f'revenue_by_product_{timestamp}.png')

if __name__ == "__main__":
    test_visualization() 