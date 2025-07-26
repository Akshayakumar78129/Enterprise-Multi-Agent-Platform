import logging
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from orchestration_agent.tools.sales_analyst.tools.SalesTrendAnalyzer import SalesTrendAnalyzer

def test_trend_analyzer():
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        # Test daily trends
        logger.info("Testing daily trends...")
        daily_analyzer = SalesTrendAnalyzer(time_period='daily')
        daily_results = daily_analyzer.analyze_trends()
        logger.info(f"Daily trend results: {daily_results}")
        
        # Test weekly trends
        logger.info("Testing weekly trends...")
        weekly_analyzer = SalesTrendAnalyzer(time_period='weekly')
        weekly_results = weekly_analyzer.analyze_trends()
        logger.info(f"Weekly trend results: {weekly_results}")
        
        # Test monthly trends
        logger.info("Testing monthly trends...")
        monthly_analyzer = SalesTrendAnalyzer(time_period='monthly')
        monthly_results = monthly_analyzer.analyze_trends()
        logger.info(f"Monthly trend results: {monthly_results}")
        
        # Test quarterly trends
        logger.info("Testing quarterly trends...")
        quarterly_analyzer = SalesTrendAnalyzer(time_period='quarterly')
        quarterly_results = quarterly_analyzer.analyze_trends()
        logger.info(f"Quarterly trend results: {quarterly_results}")
        
        # Test annual trends
        logger.info("Testing annual trends...")
        annual_analyzer = SalesTrendAnalyzer(time_period='annual')
        annual_results = annual_analyzer.analyze_trends()
        logger.info(f"Annual trend results: {annual_results}")
        
        # Test with different metrics
        logger.info("Testing different metrics...")
        metrics = ['revenue', 'units', 'aov', 'margin']
        for metric in metrics:
            analyzer = SalesTrendAnalyzer(metric=metric)
            results = analyzer.analyze_trends()
            logger.info(f"{metric.capitalize()} trend results: {results}")
        
        # Test with different dimensions
        logger.info("Testing different dimensions...")
        dimensions = ['product', 'category', 'channel', 'region', 'customer']
        for dimension in dimensions:
            analyzer = SalesTrendAnalyzer(dimension=dimension)
            results = analyzer.analyze_trends()
            logger.info(f"{dimension.capitalize()} dimension results: {results}")
            
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
        raise

if __name__ == "__main__":
    test_trend_analyzer() 