"""Purchase Frequency processing service - Business logic and data formatting"""

from typing import Dict, List, Any
from datetime import datetime
from .data_service import PurchaseFrequencyDataService
from .models import (
    KPIMetrics,
    FrequencyBin,
    CustomerSegmentData,
    PurchaseInterval,
    LifecycleStage,
    CustomerFrequency
)
from domains.common.simple_cache import cache_dashboard_endpoint


class PurchaseFrequencyProcessingService:
    """Processing service for Purchase Frequency dashboard"""

    def __init__(self):
        self.data_service = PurchaseFrequencyDataService()

    @cache_dashboard_endpoint(dashboard_type='purchase_frequency', ttl=300)
    async def get_dashboard_summary(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get complete dashboard summary

        Args:
            filters: Filter parameters from frontend

        Returns:
            Complete dashboard data including KPIs, charts, and table data
        """
        if filters is None:
            filters = {}

        # Set default date range if not provided
        if 'dateFrom' not in filters:
            filters['dateFrom'] = '2017-01-01'
        if 'dateTo' not in filters:
            filters['dateTo'] = '2021-12-31'

        # Fetch all data in parallel
        (
            kpi_data,
            frequency_dist,
            customer_segments,
            intervals,
            lifecycle,
            customer_details
        ) = await self._fetch_all_data(filters)

        # Process and format data
        kpi_metrics = self._format_kpi_metrics(kpi_data)
        frequency_bins = self._format_frequency_distribution(frequency_dist)
        segment_data = self._format_customer_segments(customer_segments)
        interval_data = self._format_purchase_intervals(intervals)
        lifecycle_data = self._format_lifecycle_stages(lifecycle)
        customer_list = self._format_customer_details(customer_details)

        # Generate rule-based insights
        rule_based_insights = self._generate_insights(kpi_metrics, segment_data, customer_list)

        # Generate AI insights (supplements rule-based with creative analysis)
        ai_insights = self._generate_ai_insights(kpi_metrics, segment_data, filters)

        # COMBINE into single unified insights array
        combined_insights = rule_based_insights + ai_insights

        return {
            'kpiMetrics': kpi_metrics,
            'frequencyDistribution': frequency_bins,
            'customerSegmentation': segment_data,
            'purchaseIntervals': interval_data,
            'lifecycleStages': lifecycle_data,
            'customerDetails': customer_list,  # Return all customers (DataTable handles pagination)
            'insights': combined_insights,
            'metadata': {
                'filters': filters,
                'totalCustomers': kpi_metrics.get('total_customers', 0),
                'dateRange': {
                    'from': filters.get('dateFrom'),
                    'to': filters.get('dateTo')
                },
                'generatedAt': datetime.now().isoformat()
            }
        }

    async def _fetch_all_data(self, filters: Dict[str, Any]) -> tuple:
        """Fetch all required data in parallel"""
        import asyncio

        tasks = [
            self.data_service.get_kpi_metrics(filters),
            self.data_service.get_frequency_distribution(filters),
            self.data_service.get_customer_segmentation(filters),
            self.data_service.get_purchase_intervals(filters),
            self.data_service.get_lifecycle_stages(filters),
            self.data_service.get_customer_frequency_data(filters)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any errors
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"[PurchaseFrequency] Error in task {i}: {result}")
                results[i] = [] if i != 0 else {}

        return tuple(results)

    def _format_kpi_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format KPI metrics for frontend"""
        if not data:
            return {
                'total_customers': 0,
                'avg_frequency': 0.0,
                'high_frequency_customers': 0,
                'medium_frequency_customers': 0,
                'low_frequency_customers': 0,
                'total_revenue': 0.0
            }

        return {
            'total_customers': data.get('total_customers', 0),
            'avg_frequency': round(float(data.get('avg_frequency', 0.0)), 2),
            'high_frequency_customers': data.get('high_frequency_count', 0),
            'medium_frequency_customers': data.get('medium_frequency_count', 0),
            'low_frequency_customers': data.get('low_frequency_count', 0),
            'total_revenue': float(data.get('total_revenue', 0.0))
        }

    def _format_frequency_distribution(self, data: List[Dict]) -> List[Dict]:
        """Format frequency distribution data"""
        if not data:
            return []

        total_customers = sum(row.get('customer_count', 0) for row in data)

        return [
            {
                'bin_range': row.get('bin_range', ''),
                'customer_count': row.get('customer_count', 0),
                'percentage': round((row.get('customer_count', 0) / total_customers * 100) if total_customers > 0 else 0, 2),
                'total_revenue': float(row.get('total_revenue', 0.0))
            }
            for row in data
        ]

    def _format_customer_segments(self, data: List[Dict]) -> List[Dict]:
        """Format customer segmentation data"""
        if not data:
            return []

        return [
            {
                'segment': row.get('segment', ''),
                'customer_count': row.get('customer_count', 0),
                'avg_frequency': round(float(row.get('avg_frequency', 0.0)), 2),
                'avg_customer_value': round(float(row.get('avg_monetary', 0.0)), 2),
                'total_revenue': float(row.get('total_revenue', 0.0))
            }
            for row in data
        ]

    def _format_purchase_intervals(self, data: List[Dict]) -> List[Dict]:
        """Format purchase interval data into bins"""
        if not data:
            return []

        # Create interval bins
        bins = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '91-180': 0,
            '181-365': 0,
            '365+': 0
        }

        total_count = 0
        for row in data:
            interval = row.get('avg_days_between', 0)
            total_count += 1

            if interval <= 30:
                bins['0-30'] += 1
            elif interval <= 60:
                bins['31-60'] += 1
            elif interval <= 90:
                bins['61-90'] += 1
            elif interval <= 180:
                bins['91-180'] += 1
            elif interval <= 365:
                bins['181-365'] += 1
            else:
                bins['365+'] += 1

        # Format as list
        return [
            {
                'interval_days': bin_name,
                'customer_count': count,
                'percentage': round((count / total_count * 100) if total_count > 0 else 0, 2)
            }
            for bin_name, count in bins.items()
        ]

    def _format_lifecycle_stages(self, data: List[Dict]) -> List[Dict]:
        """Format lifecycle stage data"""
        if not data:
            return []

        return [
            {
                'stage': row.get('stage', ''),
                'customer_count': row.get('customer_count', 0),
                'avg_frequency': round(float(row.get('avg_frequency', 0.0)), 2),
                'total_revenue': float(row.get('total_revenue', 0.0))
            }
            for row in data
        ]

    def _format_customer_details(self, data: List[Dict]) -> List[Dict]:
        """Format customer details for table"""
        if not data:
            return []

        formatted = []
        for row in data:
            # Calculate days between purchases if available
            first_date = row.get('first_purchase_date')
            last_date = row.get('last_purchase_date')
            purchase_count = row.get('purchase_count', 0)

            avg_days_between = 0
            if first_date and last_date and purchase_count > 1:
                try:
                    from datetime import datetime
                    first = datetime.fromisoformat(str(first_date).replace('Z', '+00:00'))
                    last = datetime.fromisoformat(str(last_date).replace('Z', '+00:00'))
                    days_diff = (last - first).days
                    avg_days_between = days_diff / (purchase_count - 1) if purchase_count > 1 else 0
                except:
                    avg_days_between = 0

            # Calculate recency
            recency_days = 0
            if last_date:
                try:
                    last = datetime.fromisoformat(str(last_date).replace('Z', '+00:00'))
                    recency_days = (datetime.now() - last).days
                except:
                    recency_days = 0

            formatted.append({
                'customer_id': str(row.get('customer_id', '')),
                'customer_name': row.get('customer_name', ''),
                'purchase_count': purchase_count,
                'avg_days_between_purchases': round(avg_days_between, 1),
                'last_purchase_date': last_date,
                'first_purchase_date': first_date,
                'total_spent': float(row.get('total_spent', 0.0)),
                'avg_order_value': float(row.get('avg_order_value', 0.0)),
                'frequency_segment': row.get('frequency_segment', 'Low'),
                'recency_days': recency_days,
                'loyalty_status': row.get('loyalty_status', 'N/A')
            })

        return formatted

    def _generate_insights(
        self,
        kpi_metrics: Dict[str, Any],
        segments: List[Dict],
        customers: List[Dict]
    ) -> List[str]:
        """Generate rule-based business insights (deterministic, fast)"""
        insights = []

        if not kpi_metrics:
            return ["No purchase frequency data available. Please adjust filters or check data source."]

        # Calculate metrics
        total_customers = kpi_metrics.get('total_customers', 0)
        avg_frequency = kpi_metrics.get('avg_frequency', 0.0)
        high_freq = kpi_metrics.get('high_frequency_customers', 0)
        low_freq = kpi_metrics.get('low_frequency_customers', 0)
        total_revenue = kpi_metrics.get('total_revenue', 0)

        # High frequency customers insight
        if total_customers > 0 and high_freq > 0:
            high_freq_pct = (high_freq / total_customers) * 100
            insights.append(
                f"STRENGTH: {high_freq_pct:.1f}% of customers ({high_freq:,}) are high-frequency buyers (10+ purchases), "
                f"representing your most engaged customer base. "
                f"**Action:** Create VIP loyalty program with exclusive benefits to maintain engagement."
            )

        # Average frequency insight with benchmark
        if avg_frequency > 0:
            if avg_frequency < 10:
                frequency_level = "LOW"
                action = "Launch frequency-building campaigns with bundle discounts and subscription offers"
            elif avg_frequency < 20:
                frequency_level = "MODERATE"
                action = "Implement cart abandonment recovery and personalized product recommendations"
            else:
                frequency_level = "HIGH"
                action = "Maintain engagement with exclusive early access to new products"

            insights.append(
                f"{frequency_level}: Average purchase frequency is {avg_frequency:.1f} transactions per customer. "
                f"**Action:** {action}. Target: increase frequency by 15-20% within 90 days."
            )

        # Segment revenue concentration
        if segments:
            highest_revenue_segment = max(segments, key=lambda x: x.get('total_revenue', 0))
            segment_revenue = highest_revenue_segment.get('total_revenue', 0)
            segment_pct = (segment_revenue / total_revenue * 100) if total_revenue > 0 else 0

            insights.append(
                f"REVENUE DRIVER: '{highest_revenue_segment.get('segment')}' segment generates "
                f"${segment_revenue:,.0f} ({segment_pct:.1f}% of total revenue) with "
                f"{highest_revenue_segment.get('customer_count', 0):,} customers. "
                f"**Action:** Double down on acquisition of similar profile customers and replicate success factors."
            )

        # Low frequency opportunity
        if low_freq > 0 and total_customers > 0:
            low_freq_pct = (low_freq / total_customers) * 100
            insights.append(
                f"OPPORTUNITY: {low_freq_pct:.1f}% of customers ({low_freq:,}) have low purchase frequency (<5 purchases). "
                f"**Action:** Launch win-back campaigns with 'second purchase' incentives, onboarding email sequences, "
                f"and personalized product discovery. Potential revenue uplift: ${(low_freq * avg_frequency * 50):,.0f}."
            )

        return insights

    def _generate_ai_insights(
        self,
        kpi_metrics: Dict[str, Any],
        segments: List[Dict],
        filters: Dict[str, Any]
    ) -> List[str]:
        """Generate AI-powered strategic insights using Google Gemini

        This supplements rule-based insights with creative AI analysis.
        Failures gracefully fall back to empty list without breaking the response.
        """
        try:
            # Import here to avoid breaking if module not available
            from lib.ai_insights_generator import generate_ai_insights

            if not kpi_metrics:
                return []

            # Calculate metrics for AI context
            total_customers = kpi_metrics.get('total_customers', 0)
            avg_frequency = kpi_metrics.get('avg_frequency', 0.0)
            high_freq = kpi_metrics.get('high_frequency_customers', 0)
            low_freq = kpi_metrics.get('low_frequency_customers', 0)
            total_revenue = kpi_metrics.get('total_revenue', 0)

            # Get time period from filters
            time_period = f"{filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}"

            # Build segment breakdown
            segment_breakdown = ""
            if segments:
                for seg in segments:
                    count = seg.get('customer_count', 0)
                    revenue = seg.get('total_revenue', 0)
                    segment_breakdown += f"- {seg.get('segment')}: {count:,} customers, ${revenue:,.0f}\n"

            # Prepare KPIs
            kpis = {
                'total_customers': total_customers,
                'avg_frequency': avg_frequency,
                'high_frequency_customers': high_freq,
                'low_frequency_customers': low_freq,
                'total_revenue': total_revenue,
                'high_freq_pct': (high_freq / total_customers * 100) if total_customers > 0 else 0,
                'low_freq_pct': (low_freq / total_customers * 100) if total_customers > 0 else 0,
                'time_period': time_period
            }

            # Prepare data summary
            data_summary = {
                'segment_breakdown': segment_breakdown,
                'top_segment': segments[0].get('segment') if segments else 'Unknown',
                'segment_count': len(segments)
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='purchase_frequency',
                kpis=kpis,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[PurchaseFrequency] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except ImportError as e:
            print(f"[PurchaseFrequency] AI insights module not available: {e}")
            return []
        except Exception as e:
            print(f"[PurchaseFrequency] Error generating AI insights: {e}")
            return []
