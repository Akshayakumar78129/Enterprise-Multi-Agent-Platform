"""Tool for predicting next customer purchases."""

import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List

# Try both direct import and relative import
try:
    from next_purchase_predictor import NextPurchasePredictor
except ImportError:
    try:
        from .next_purchase_predictor import NextPurchasePredictor
    except ImportError:
        # For testing when run as a script
        import sys
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from next_purchase_predictor import NextPurchasePredictor

def predict_next_purchases(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    customer_segments: Optional[List[str]] = None,
    top_k: int = 5
) -> Dict:
    """
    Predict next likely purchases for customers based on their purchase history.
    
    Args:
        start_date: Start date for analysis (YYYY-MM-DD)
        end_date: End date for analysis (YYYY-MM-DD)
        customer_segments: List of customer segments to analyze
        top_k: Number of top predictions per customer
        
    Returns:
        Dict containing analysis results and file paths
    """
    try:
        # Initialize predictor
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        predictor = NextPurchasePredictor(db_path=db_path)
        
        # Extract features
        data = predictor.extract_features()
        
        # Filter by date if provided
        if start_date:
            data = data[data['purchase_date'] >= start_date]
        if end_date:
            data = data[data['purchase_date'] <= end_date]
            
        # Filter by customer segments if provided
        if customer_segments:
            data = data[data['segment'].isin(customer_segments)]
            
        # Prepare features and train model
        X, y = predictor.prepare_features(data)
        metrics = predictor.train_model(X, y)
        
        # Get predictions
        predictions = predictor.predict_next_purchases(data, top_k=top_k)
        
        # Store results
        output_dir = os.path.join('output', 'next_purchase_predictions')
        report_path = predictor.store_predictions(predictions, output_dir)
        
        return {
            'result': f"Successfully generated next purchase predictions. Report saved to {report_path}",
            'predictions': predictions.to_dict('records'),
            'metrics': metrics,
            'report_path': report_path
        }
        
    except Exception as e:
        return {'result': f"Error predicting next purchases: {str(e)}"} 