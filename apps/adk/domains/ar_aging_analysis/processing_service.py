"""Processing service for AR Aging Analysis - Main business logic"""

from typing import Dict, Any, List
from decimal import Decimal
import logging
from datetime import datetime, timedelta
from .data_service import ARAgingDataService
from .models import (
    ARAgingFilters,
    AgingBucket,
    CustomerRisk,
    KPIMetric,
    CollectionForecast,
    NPVSummary,
    CustomerSegment,
    KPIStatus,
    TrendDirection
)
from domains.common.dashboard_cache import cache_dashboard_endpoint


def to_float(value):
    """Convert Decimal/None to float for arithmetic"""
    if value is None:
        return 0.0
    return float(value)


logger = logging.getLogger(__name__)


class ARAgingProcessingService:
    """Main processing service for AR aging analysis"""

    def __init__(self):
        self.data_service = ARAgingDataService()

    @cache_dashboard_endpoint(dashboard_type='ar_aging_analysis', ttl=300)
    async def get_ar_aging_summary(self, filters) -> Dict[str, Any]:
        """Get complete AR aging summary with all visualizations

        Args:
            filters: AR aging filters dict or Pydantic model with date range, segments, WACC

        Returns:
            Complete dashboard data with KPIs, aging buckets, customer insights, forecast
        """
        try:
            # Convert Pydantic model to dict for data service
            filters_dict = filters.dict() if hasattr(filters, 'dict') else filters

            # Fetch all required data
            ar_invoices = await self.data_service.get_ar_invoices(filters_dict)
            customer_details = await self.data_service.get_customer_ar_details(filters_dict)
            aging_summary = await self.data_service.get_aging_summary(filters_dict)

            # Calculate aging buckets with NPV
            aging_buckets = self._calculate_aging_buckets(ar_invoices, filters_dict.get('wacc', 10.0))

            # Calculate KPIs
            kpi_metrics = self._calculate_kpis(aging_summary, aging_buckets, ar_invoices)

            # Segment customers for BCG matrix
            customer_insights = self._segment_customers(customer_details, ar_invoices)

            # Generate collection forecast
            collection_forecast = self._generate_collection_forecast(ar_invoices, aging_buckets)

            # Calculate NPV summary
            npv_summary = self._calculate_npv_summary(aging_buckets, filters_dict.get('wacc', 10.0))

            # Generate insights
            insights = self._generate_insights(kpi_metrics, aging_buckets, customer_insights)

            return {
                'kpiMetrics': kpi_metrics,
                'mainData': {
                    'agingBuckets': aging_buckets,
                    'customerInsights': customer_insights,
                    'collectionForecast': collection_forecast,
                    'npvSummary': npv_summary,
                    'agingTable': self._prepare_aging_table(customer_details)
                },
                'insights': insights,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'filters_applied': filters_dict,
                    'total_customers': len(customer_details),
                    'total_invoices': len(ar_invoices)
                }
            }

        except Exception as e:
            logger.error(f"Error in get_ar_aging_summary: {str(e)}")
            raise

    def _calculate_aging_buckets(self, ar_invoices: List[Dict], wacc: float) -> List[Dict]:
        """Calculate aging buckets with NPV adjustments

        Args:
            ar_invoices: List of AR invoices with days_overdue
            wacc: Weighted average cost of capital (%)

        Returns:
            List of aging buckets with amounts, NPV adjustments, and percentages
        """
        buckets = {
            '0-30': {'range': '0-30 days', 'min': 0, 'max': 30, 'color': '#00e0ff'},
            '31-45': {'range': '31-45 days', 'min': 31, 'max': 45, 'color': '#5fd4d6'},
            '46-60': {'range': '46-60 days', 'min': 46, 'max': 60, 'color': '#ffc145'},
            '61-90': {'range': '61-90 days', 'min': 61, 'max': 90, 'color': '#e930ff'},
            '90+': {'range': '90+ days', 'min': 91, 'max': 99999, 'color': '#e930ff'}
        }

        total_ar = sum(to_float(inv.get('balance_due_amount', 0)) for inv in ar_invoices)

        result = []
        for key, bucket_def in buckets.items():
            # Filter invoices for this bucket
            bucket_invoices = [
                inv for inv in ar_invoices
                if bucket_def['min'] <= to_float(inv.get('days_overdue', 0)) <= bucket_def['max']
            ]

            amount = sum(to_float(inv.get('balance_due_amount', 0)) for inv in bucket_invoices)
            count = len(bucket_invoices)

            # Calculate NPV adjustment
            avg_days = (
                sum(to_float(inv.get('days_overdue', 0)) * to_float(inv.get('balance_due_amount', 0)) for inv in bucket_invoices) / amount
                if amount > 0 else 0
            )
            npv_adjusted = amount / (1.0 + (wacc / 100.0 / 365.0) * avg_days) if avg_days > 0 else amount
            value_erosion = amount - npv_adjusted

            result.append({
                'range': bucket_def['range'],
                'amount': round(amount, 2),
                'npvAdjustedAmount': round(npv_adjusted, 2),
                'count': count,
                'percentOfTotal': round((amount / total_ar * 100) if total_ar > 0 else 0, 2),
                'valueErosion': round(value_erosion, 2),
                'color': bucket_def['color']
            })

        return result

    def _calculate_kpis(self, aging_summary: Dict, aging_buckets: List[Dict], ar_invoices: List[Dict]) -> Dict:
        """Calculate 5 KPI tiles

        Returns:
            Dictionary with 5 KPIs: totalAR, dso, overdueAmount, collectionEfficiency, riskExposure
        """
        total_ar = to_float(aging_summary.get('total_ar', 0) or 0)
        total_overdue = to_float(aging_summary.get('total_overdue', 0) or 0)
        avg_days_overdue = to_float(aging_summary.get('avg_days_overdue', 0) or 0)

        # Calculate DSO (Days Sales Outstanding)
        # Simplified: using average days overdue as proxy
        dso = round(avg_days_overdue, 1)

        # Collection efficiency (current / total)
        current_amount = to_float(aging_summary.get('current_amount', 0) or 0)
        collection_efficiency = round((current_amount / total_ar * 100) if total_ar > 0 else 0, 1)

        # Risk exposure (90+ days / total)
        bucket_90_plus = next((b for b in aging_buckets if b['range'] == '90+ days'), None)
        risk_exposure = to_float(bucket_90_plus['amount'] if bucket_90_plus else 0)

        # Calculate status indicators safely (avoid division by zero)
        total_ar_status = 'good'
        if total_ar > 0:
            overdue_ratio = total_overdue / total_ar
            total_ar_status = 'warning' if overdue_ratio > 0.2 else 'good'

        overdue_status = 'warning'
        if total_ar > 0:
            overdue_ratio = total_overdue / total_ar
            overdue_status = 'critical' if overdue_ratio > 0.3 else 'warning'

        risk_status = 'critical'
        if total_ar > 0:
            risk_ratio = risk_exposure / total_ar
            risk_status = 'good' if risk_ratio < 0.1 else 'critical'

        return {
            'totalAR': {
                'value': round(total_ar, 2),  # Raw number - frontend will format
                'change': 1.2,  # Placeholder - would need historical data
                'trend': 'up',
                'status': total_ar_status
            },
            'dso': {
                'value': dso,  # Raw number - frontend will format
                'change': -2.1,  # Placeholder
                'trend': 'down',
                'status': 'good' if dso < 45 else 'warning' if dso < 60 else 'critical'
            },
            'overdueAmount': {
                'value': round(total_overdue, 2),  # Raw number - frontend will format
                'change': 3.5,  # Placeholder
                'trend': 'up',
                'status': overdue_status
            },
            'collectionEfficiency': {
                'value': collection_efficiency,  # Raw number - frontend will format
                'change': 2.8,  # Placeholder
                'trend': 'up',
                'status': 'good' if collection_efficiency > 70 else 'warning'
            },
            'riskExposure': {
                'value': round(risk_exposure, 2),  # Raw number - frontend will format
                'change': -1.2,  # Placeholder
                'trend': 'down',
                'status': risk_status
            }
        }

    def _segment_customers(self, customer_details: List[Dict], ar_invoices: List[Dict]) -> List[Dict]:
        """Segment customers using BCG matrix (CLV vs Risk)

        Returns:
            List of customer risk profiles with segment assignment
        """
        if not customer_details:
            return []

        # Calculate percentiles for segmentation
        clv_values = [c.get('lifetime_sales', 0) or 0 for c in customer_details]
        risk_values = [c.get('avg_days_overdue', 0) or 0 for c in customer_details]

        clv_median = sorted(clv_values)[len(clv_values) // 2] if clv_values else 0
        risk_median = sorted(risk_values)[len(risk_values) // 2] if risk_values else 0

        result = []
        for customer in customer_details:
            clv = customer.get('lifetime_sales', 0) or 0
            outstanding = customer.get('total_outstanding', 0) or 0
            avg_days_overdue = customer.get('avg_days_overdue', 0) or 0
            rfm_score = customer.get('rfm_score', 500) or 500

            # Calculate risk score (0-100)
            # Higher days overdue + lower RFM = higher risk
            risk_score = min(100, (avg_days_overdue / 90 * 50) + ((1000 - rfm_score) / 1000 * 50))

            # Determine segment
            if clv >= clv_median and risk_score < 50:
                segment = CustomerSegment.STRATEGIC_PARTNERS
            elif clv >= clv_median and risk_score >= 50:
                segment = CustomerSegment.GROWTH_OPPORTUNITIES
            elif clv < clv_median and risk_score < 50:
                segment = CustomerSegment.EFFICIENCY_TARGETS
            else:
                segment = CustomerSegment.VALUE_DESTROYERS

            # Calculate collection probability
            collection_prob = max(10, 100 - risk_score)

            result.append({
                'customerId': str(customer.get('customer_id', '')),
                'customerName': customer.get('customer_name', 'Unknown'),
                'outstandingAmount': round(outstanding, 2),
                'daysPastDue': round(avg_days_overdue, 1),
                'riskScore': round(risk_score, 1),
                'clv': round(clv, 2),
                'paymentRiskScore': round(risk_score, 1),
                'profitability': round(clv - outstanding, 2),
                'collectionProbability': round(collection_prob, 1),
                'segment': segment.value,
                'region': customer.get('region', 'Unknown'),
                'customerType': customer.get('customer_type', 'Unknown'),
                'creditLimit': customer.get('credit_limit', 0) or 0,
                'rfmScore': rfm_score
            })

        return result

    def _generate_collection_forecast(self, ar_invoices: List[Dict], aging_buckets: List[Dict]) -> List[Dict]:
        """Generate 8-week collection forecast

        Returns:
            List of forecast data points with confidence intervals
        """
        total_ar = sum(to_float(inv.get('balance_due_amount', 0)) for inv in ar_invoices)

        # Simple collection rate assumptions by aging bucket
        collection_rates = {
            '0-30 days': 0.95,
            '31-45 days': 0.85,
            '46-60 days': 0.70,
            '61-90 days': 0.50,
            '90+ days': 0.30
        }

        forecast = []
        today = datetime.now()

        for week in range(1, 9):
            forecast_date = today + timedelta(weeks=week)

            # Calculate expected collections
            predicted_amount = 0.0  # Initialize as float to avoid Decimal + float errors
            for bucket in aging_buckets:
                bucket_range = bucket['range']
                collection_rate = collection_rates.get(bucket_range, 0.5)
                # Collections decrease over time
                weekly_rate = collection_rate / 8
                predicted_amount += to_float(bucket['amount']) * weekly_rate * (9 - week) / 8

            # Add confidence intervals (±20%)
            confidence = 85  # 85% confidence
            upper_bound = predicted_amount * 1.2
            lower_bound = predicted_amount * 0.8

            forecast.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predictedAmount': round(predicted_amount, 2),
                'upperBound': round(upper_bound, 2),
                'lowerBound': round(lower_bound, 2),
                'confidence': confidence
            })

        return forecast

    def _calculate_npv_summary(self, aging_buckets: List[Dict], wacc: float) -> Dict:
        """Calculate NPV impact summary

        Returns:
            NPV summary with total erosion and rates
        """
        total_book_value = sum(to_float(b['amount']) for b in aging_buckets)
        total_npv_adjusted = sum(to_float(b['npvAdjustedAmount']) for b in aging_buckets)
        total_erosion = total_book_value - total_npv_adjusted

        # Assume daily erosion continues at same rate
        days_in_period = 90  # Approximate
        daily_erosion_rate = total_erosion / days_in_period if days_in_period > 0 else 0

        return {
            'totalValueErosion': round(total_erosion, 2),
            'dailyErosionRate': round(daily_erosion_rate, 2),
            'waccUsed': wacc,
            'totalArBookValue': round(total_book_value, 2),
            'totalArNpvAdjusted': round(total_npv_adjusted, 2),
            'erosionPercentage': round((total_erosion / total_book_value * 100) if total_book_value > 0 else 0, 2)
        }

    def _prepare_aging_table(self, customer_details: List[Dict]) -> List[Dict]:
        """Prepare data for aging table component

        Returns:
            List of customer records for table display
        """
        return [{
            'customerId': str(c.get('customer_id', '')),
            'customerName': c.get('customer_name', 'Unknown'),
            'totalOutstanding': round(c.get('total_outstanding', 0) or 0, 2),
            'avgDaysOverdue': round(c.get('avg_days_overdue', 0) or 0, 1),
            'invoiceCount': c.get('invoice_count', 0) or 0,
            'region': c.get('region', 'Unknown'),
            'customerType': c.get('customer_type', 'Unknown')
        } for c in customer_details[:100]]  # Limit to 100 for initial load

    def _generate_insights(self, kpis: Dict, aging_buckets: List[Dict], customers: List[Dict]) -> List[str]:
        """Generate AI-style insights from the data

        Returns:
            List of insight strings
        """
        insights = []

        # Overdue amount insight
        overdue_pct = kpis['overdueAmount']['value'] / kpis['totalAR']['value'] * 100 if kpis['totalAR']['value'] > 0 else 0
        if overdue_pct > 30:
            insights.append(f"{overdue_pct:.1f}% of AR is overdue - immediate action recommended for high-risk accounts")
        elif overdue_pct > 20:
            insights.append(f"{overdue_pct:.1f}% of AR is overdue - monitor collection activities closely")

        # DSO insight
        if kpis['dso']['value'] > 60:
            insights.append(f"DSO of {kpis['dso']['value']} days is above industry benchmark - review credit terms")

        # Segment insight
        high_risk_customers = [c for c in customers if c['segment'] in [CustomerSegment.GROWTH_OPPORTUNITIES.value, CustomerSegment.VALUE_DESTROYERS.value]]
        if len(high_risk_customers) > 0:
            insights.append(f"{len(high_risk_customers)} customers identified as high-risk requiring focused collection efforts")

        # 90+ days insight
        bucket_90 = next((b for b in aging_buckets if b['range'] == '90+ days'), None)
        if bucket_90 and bucket_90['percentOfTotal'] > 15:
            insights.append(f"{bucket_90['percentOfTotal']:.1f}% of AR is 90+ days old - consider bad debt provisions")

        return insights
