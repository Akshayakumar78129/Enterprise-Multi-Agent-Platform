import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import sqlite3
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import json
import io
import base64
import os

def analyze_performance_deviations(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    business_functions: Optional[List[str]] = None,
    include_visualization: bool = True
) -> str:
    """
    Analyze performance deviations across business functions using machine learning.
    
    Args:
        start_date: Optional start date for analysis (format: YYYY-MM-DD)
        end_date: Optional end date for analysis (format: YYYY-MM-DD)
        business_functions: Optional list of business functions to analyze ('sales', 'marketing', 'support')
        include_visualization: Whether to include visualizations in the output
        
    Returns:
        String containing the analysis results and visualizations in markdown format
    """
    try:
        # Initialize analyzer with correct database path
        db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "customers.db"))
        analyzer = PerformanceDeviationAnalyzer(db_path)
        
        # Extract data
        kpi_data = analyzer.extract_kpi_data(start_date, end_date)
        if kpi_data.empty:
            return "No KPI data found for the specified period."
            
        external_factors = analyzer.extract_external_factors(start_date, end_date)
        if external_factors.empty:
            return "No external factors data found for the specified period."
        
        # Filter by business functions if specified
        if business_functions:
            kpi_data = kpi_data[kpi_data['function'].isin(business_functions)]
            if kpi_data.empty:
                return f"No data found for specified business functions: {', '.join(business_functions)}"
        
        # Analyze deviations
        analysis_results = analyzer.analyze_deviations(kpi_data, external_factors)
        
        if "error" in analysis_results:
            return f"Analysis Error: {analysis_results['error']}"
            
        # Generate visualizations if requested
        visualization_base64 = None
        if include_visualization:
            buf = io.BytesIO()
            analyzer.visualize_deviations(kpi_data, analysis_results, buf)
            buf.seek(0)
            visualization_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        # Format results as markdown
        result = "# Performance Deviation Analysis\n\n"
        
        if start_date and end_date:
            result += f"Analysis Period: {start_date} to {end_date}\n\n"
        
        if business_functions:
            result += f"Business Functions Analyzed: {', '.join(business_functions)}\n\n"
        
        for kpi, kpi_results in analysis_results.items():
            result += f"## {kpi}\n\n"
            
            # Feature Importance
            result += "### Key Influencing Factors\n\n"
            result += "| Factor | Impact |\n|--------|--------|\n"
            for feat in kpi_results['feature_importance'][:5]:  # Top 5 factors
                result += f"| {feat['feature']} | {feat['importance']:.2%} |\n"
            result += "\n"
            
            # Variance Analysis
            var_decomp = kpi_results['variance_decomposition']
            explained_pct = (var_decomp['explained'] / var_decomp['total']) * 100
            result += "### Variance Analysis\n\n"
            result += f"- Model Explanation Power: {explained_pct:.1f}%\n"
            result += f"- Unexplained Variance: {100-explained_pct:.1f}%\n\n"
            
            # Deviation Statistics
            deviations = np.array(kpi_results['deviations'])
            result += "### Deviation Statistics\n\n"
            result += f"- Average Deviation: {np.mean(deviations):.2f}\n"
            result += f"- Maximum Deviation: {np.max(deviations):.2f}\n"
            result += f"- Minimum Deviation: {np.min(deviations):.2f}\n\n"
        
        # Add recommendations
        result += "## Recommendations\n\n"
        for kpi, kpi_results in analysis_results.items():
            deviations = np.array(kpi_results['deviations'])
            if np.abs(np.mean(deviations)) > np.std(deviations):
                result += f"- **{kpi}**: Significant systematic deviation detected. "
                result += "Review top influencing factors for potential optimization opportunities.\n"
        
        # Add visualization if available
        if visualization_base64:
            result += "\n## Visualizations\n\n"
            result += f"![Performance Deviations](data:image/png;base64,{visualization_base64})\n"
        
        return result
        
    except Exception as e:
        return f"Analysis Error: {str(e)}"

class PerformanceDeviationAnalyzer:
    def __init__(self, db_path: str):
        """Initialize the Performance Deviation Analyzer.
        
        Args:
            db_path: Path to SQLite database
        """
        self.db_path = db_path
        
        # Define feature columns
        self.numeric_features = ['is_weekend', 'is_holiday', 'competitor_activity_level']
        self.categorical_features = ['season', 'market_condition']
        
        # Create preprocessing pipeline
        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(drop='first', sparse_output=False)
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat', categorical_transformer, self.categorical_features)
            ])
        
        # Create model pipeline
        self.model = Pipeline([
            ('preprocessor', self.preprocessor),
            ('regressor', GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                random_state=42
            ))
        ])
        
    def extract_kpi_data(self, start_date: Optional[str] = None, 
                        end_date: Optional[str] = None) -> pd.DataFrame:
        """Extract KPI data from all business functions."""
        query = """
        WITH sales_kpis AS (
            SELECT 
                st."Txn Date" as date,
                'sales' as function,
                COUNT(DISTINCT st."Sales Txn Document") as transaction_count,
                SUM(st."Sales Amount") as total_revenue,
                AVG(st."Sales Amount") as avg_transaction_value
            FROM dbo_F_Sales_Transaction st
            WHERE st."Sales Amount" IS NOT NULL
            GROUP BY st."Txn Date"
        ),
        customer_kpis AS (
            SELECT 
                cl."Last Activity Date" as date,
                'customer' as function,
                SUM(CASE WHEN cl."Active Customer Count" IS NOT NULL THEN cl."Active Customer Count" ELSE 0 END) as active_customers,
                SUM(CASE WHEN cl."Loyal Customer Count" IS NOT NULL THEN cl."Loyal Customer Count" ELSE 0 END) as loyal_customers,
                AVG(CASE WHEN cl."RFM Score" IS NOT NULL THEN cl."RFM Score" ELSE 0 END) as avg_rfm_score
            FROM dbo_F_Customer_Loyalty cl
            GROUP BY cl."Last Activity Date"
        ),
        ar_kpis AS (
            SELECT 
                ar."Txn Date" as date,
                'finance' as function,
                COUNT(DISTINCT ar."AR Detail Id") as ar_transactions,
                SUM(CASE WHEN ar."Txn Amount" IS NOT NULL THEN ar."Txn Amount" ELSE 0 END) as total_ar_amount,
                AVG(CASE WHEN ar."Age Band Days" IS NOT NULL THEN ar."Age Band Days" ELSE 0 END) as avg_age_days
            FROM dbo_F_AR_Detail ar
            GROUP BY ar."Txn Date"
        )
        SELECT * FROM sales_kpis
        UNION ALL
        SELECT * FROM customer_kpis
        UNION ALL
        SELECT * FROM ar_kpis
        """
        
        if start_date:
            query += f" WHERE date >= '{start_date}'"
        if end_date:
            query += f" AND date <= '{end_date}'"
            
        with sqlite3.connect(self.db_path) as conn:
            kpi_data = pd.read_sql_query(query, conn)
            
        # Convert date column to datetime
        kpi_data['date'] = pd.to_datetime(kpi_data['date'])
        
        # Fill any remaining NaN values with 0
        numeric_cols = kpi_data.select_dtypes(include=[np.number]).columns
        kpi_data[numeric_cols] = kpi_data[numeric_cols].fillna(0)
        
        return kpi_data
    
    def extract_external_factors(self, start_date: Optional[str] = None,
                               end_date: Optional[str] = None) -> pd.DataFrame:
        """Extract external factors data."""
        # For demonstration, we'll generate synthetic external factors
        # In a real implementation, this would pull from actual data
        dates = pd.date_range(start=start_date or '2023-01-01',
                            end=end_date or '2023-12-31')
        
        external_factors = pd.DataFrame({
            'date': dates,
            'is_weekend': dates.dayofweek.isin([5, 6]).astype(int),
            'is_holiday': np.random.binomial(1, 0.1, len(dates)),
            'season': pd.cut(dates.month, bins=[0,3,6,9,12], 
                           labels=['winter', 'spring', 'summer', 'fall']),
            'market_condition': np.random.choice(
                ['stable', 'growing', 'declining'], 
                size=len(dates)
            ),
            'competitor_activity_level': np.random.normal(5, 1, len(dates))
        })
        
        # Convert date column to datetime if it's not already
        if 'date' in external_factors.columns:
            external_factors['date'] = pd.to_datetime(external_factors['date'])
        
        return external_factors
    
    def analyze_deviations(self, kpi_data: pd.DataFrame, 
                          external_factors: pd.DataFrame) -> Dict:
        """Analyze KPI deviations using gradient boosting."""
        try:
            # Merge KPI data with external factors
            data = pd.merge(kpi_data, external_factors, on='date', how='left')
            
            # Prepare features
            feature_cols = self.numeric_features + self.categorical_features
            
            # Identify numeric columns for analysis
            numeric_cols = data.select_dtypes(include=[np.number]).columns
            target_cols = [col for col in numeric_cols 
                         if col not in feature_cols + ['date']]
            
            # Handle missing values in feature columns
            for col in self.numeric_features:
                if col in data.columns:
                    data[col] = data[col].fillna(data[col].mean() if not data[col].empty else 0)
            
            for col in self.categorical_features:
                if col in data.columns:
                    # Get mode safely
                    mode_values = data[col].mode()
                    default_value = mode_values.iloc[0] if not mode_values.empty else 'unknown'
                    data[col] = data[col].fillna(default_value)
            
            results = {}
            for target in target_cols:
                if target in data.columns:
                    try:
                        # Handle missing values in target
                        y = data[target].fillna(data[target].mean() if not data[target].empty else 0)
                        
                        # Drop any remaining rows with NaN if they exist
                        mask = ~data[feature_cols].isna().any(axis=1)
                        X = data[feature_cols][mask]
                        y = y[mask]
                        
                        if len(X) == 0 or len(y) == 0:
                            print(f"No valid data for {target}")
                            continue
                        
                        # Fit model
                        self.model.fit(X, y)
                        
                        # Get feature names after preprocessing
                        feature_names = (
                            self.numeric_features +
                            [f"{feat}_{val}" for feat, vals in 
                             zip(self.categorical_features,
                                 self.preprocessor.named_transformers_['cat'].categories_)
                             for val in vals[1:]]
                        )
                        
                        # Calculate feature importance
                        importance = pd.DataFrame({
                            'feature': feature_names,
                            'importance': self.model.named_steps['regressor'].feature_importances_
                        }).sort_values('importance', ascending=False)
                        
                        # Calculate predicted values and deviations
                        predictions = self.model.predict(X)
                        deviations = y - predictions
                        
                        # Calculate variance decomposition
                        total_variance = np.var(y)
                        explained_variance = np.var(predictions)
                        unexplained_variance = np.var(deviations)
                        
                        results[target] = {
                            'feature_importance': importance.to_dict('records'),
                            'predictions': predictions.tolist(),
                            'deviations': deviations.tolist(),
                            'variance_decomposition': {
                                'total': total_variance,
                                'explained': explained_variance,
                                'unexplained': unexplained_variance
                            }
                        }
                    except Exception as e:
                        print(f"Error analyzing {target}: {str(e)}")
                        continue
            
            if not results:
                return {"error": "No valid results could be generated for any KPI"}
                
            return results
            
        except Exception as e:
            print(f"Error in analyze_deviations: {str(e)}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    def visualize_deviations(self, kpi_data: pd.DataFrame, 
                           analysis_results: Dict,
                           output_path: str):
        """Create visualization of performance deviations."""
        n_kpis = len(analysis_results)
        fig, axes = plt.subplots(n_kpis, 2, figsize=(15, 5*n_kpis))
        
        # Handle single KPI case
        if n_kpis == 1:
            axes = axes.reshape(1, -1)
        
        for idx, (kpi, results) in enumerate(analysis_results.items()):
            # Actual vs Predicted
            ax = axes[idx, 0]
            ax.plot(pd.to_datetime(kpi_data['date']), kpi_data[kpi], 
                   label='Actual', alpha=0.7)
            ax.plot(pd.to_datetime(kpi_data['date']), results['predictions'], 
                   label='Predicted', alpha=0.7)
            ax.set_title(f'{kpi} - Actual vs Predicted')
            ax.legend()
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)
            
            # Deviations
            ax = axes[idx, 1]
            ax.plot(pd.to_datetime(kpi_data['date']), results['deviations'], 
                   color='red', alpha=0.7)
            ax.axhline(y=0, color='black', linestyle='--', alpha=0.3)
            ax.set_title(f'{kpi} - Deviations')
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)
        
        plt.tight_layout()
        
        # If output_path is a string (file path), save to file
        if isinstance(output_path, str):
            plt.savefig(output_path)
        # If output_path is a BytesIO object, save to buffer
        else:
            plt.savefig(output_path, format='png')
        plt.close() 