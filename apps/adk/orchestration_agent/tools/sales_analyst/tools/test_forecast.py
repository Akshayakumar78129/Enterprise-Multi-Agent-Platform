import logging
import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from orchestration_agent.tools.sales_analyst.tools.DemandForecastEngine import DemandForecastEngine

def test_forecast_engine():
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        # Initialize the forecast engine
        with DemandForecastEngine(logger=logger) as engine:
            # Test weekly forecast
            logger.info("Testing weekly forecast...")
            weekly_forecast = engine.generate_forecast_for_period('week')
            logger.info(f"Weekly forecast result: {weekly_forecast}")
            
            # Test monthly forecast
            logger.info("Testing monthly forecast...")
            monthly_forecast = engine.generate_forecast_for_period('month')
            logger.info(f"Monthly forecast result: {monthly_forecast}")
            
            # Test quarterly forecast
            logger.info("Testing quarterly forecast...")
            quarterly_forecast = engine.generate_forecast_for_period('quarter')
            logger.info(f"Quarterly forecast result: {quarterly_forecast}")
            
            # Test yearly forecast
            logger.info("Testing yearly forecast...")
            yearly_forecast = engine.generate_forecast_for_period('year')
            logger.info(f"Yearly forecast result: {yearly_forecast}")
            
            # Verify latest date is being used
            latest_date = engine._get_latest_date()
            logger.info(f"Latest date in database: {latest_date}")
            
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
        raise

if __name__ == "__main__":
    test_forecast_engine() 