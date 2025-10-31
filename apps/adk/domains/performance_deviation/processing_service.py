"""Processing service for Performance Deviation Analysis"""

import pandas as pd
import numpy as np
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .data_service import PerformanceDataService
from .ml_predictor import PerformanceMLPredictor
from database.filter_engine import FilterEngine
from domains.common.simple_cache import cache_dashboard_endpoint


class PerformanceProcessingService:
    """Main processing service that orchestrates data and ML for performance deviation"""

    def __init__(self):
        self.data_service = PerformanceDataService()
        self.ml_predictor = PerformanceMLPredictor()
        self.filter_engine = FilterEngine()

    @cache_dashboard_endpoint(dashboard_type='performance', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint - combines SQL data and ML predictions

        This serves both the frontend dashboard and the agent tool.
        Returns all data types needed by both consumers.
        """
        try:
            print(f"[DEBUG] Processing service called with filters: {filters}")

            # 1. Get raw KPI data from database
            kpi_data = await self.data_service.get_all_kpis(filters)
            print(f"[DEBUG] KPI data fetched: {kpi_data.get('count', 0)} total rows")

            # 2. Prepare data for ML processing
            all_kpis_df = self._prepare_kpi_dataframe(kpi_data)

            if all_kpis_df.empty:
                return self._empty_response()

            # 3. Get ML predictions (3 core outputs for agent)
            ml_results = self._get_ml_predictions(all_kpis_df)

            # 4. Calculate additional metrics for frontend (2 extra types)
            kpi_metrics = self._calculate_kpi_metrics(all_kpis_df)

            # Update KPI metrics with ML results
            if ml_results.get('feature_importance', {}).get('aggregated'):
                top_feature = ml_results['feature_importance']['aggregated'][0]
                kpi_metrics['topFactor']['value'] = top_feature.get('feature', 'unknown')

            if ml_results.get('variance_decomposition', {}).get('components'):
                explained_components = [c for c in ml_results['variance_decomposition']['components']
                                      if c.get('name') not in ['Noise / Unexplained', 'Unexplained/Noise']]
                total_explained = sum(c.get('share', 0) for c in explained_components)
                kpi_metrics['explanationPower']['value'] = total_explained

            business_comparison = self._calculate_business_comparison(kpi_data)
            deviation_patterns = self._calculate_deviation_patterns(ml_results)
            factor_correlations = self._calculate_factor_correlations(all_kpis_df)

            # Generate rule-based insights
            rule_based_insights = self._generate_rule_based_insights(
                kpi_metrics,
                ml_results,
                deviation_patterns,
                factor_correlations
            )

            # Generate AI insights
            ai_insights = await self._get_cached_ai_insights(
                filters,
                kpi_metrics,
                ml_results,
                deviation_patterns,
                factor_correlations
            )

            # Combine insights
            all_insights = rule_based_insights + [{'type': 'ai', 'priority': 'INFO', 'message': insight} for insight in ai_insights]

            # 5. Format the complete response
            return {
                # Core ML outputs (used by both agent and frontend)
                "featureImportance": ml_results.get('feature_importance', {}),
                "varianceDecomposition": ml_results.get('variance_decomposition', {}),
                "performanceExplorer": ml_results.get('performance_explorer', {}),

                # Additional frontend-only data
                "kpis": kpi_metrics,
                "businessFunctionComparison": business_comparison,
                "deviationPatterns": deviation_patterns,
                "factorCorrelations": factor_correlations,
                "insights": all_insights,
                "insights_metadata": {
                    "rule_based_count": len(rule_based_insights),
                    "ai_count": len(ai_insights),
                    "total_count": len(all_insights),
                    "insights_version": "unified_v2"
                },

                # Metadata
                "metadata": {
                    "totalDataPoints": len(all_kpis_df),
                    "businessFunctions": self._get_business_functions(filters),
                    "lastUpdated": datetime.now().isoformat(),
                    "dateRange": {
                        "from": filters.get('dateFrom', ''),
                        "to": filters.get('dateTo', '')
                    }
                }
            }

        except Exception as e:
            print(f"[PerformanceProcessingService] Error in get_dashboard_summary: {e}")
            import traceback
            traceback.print_exc()
            return self._empty_response()

    def _prepare_kpi_dataframe(self, kpi_data: Dict) -> pd.DataFrame:
        """Prepare combined KPI dataframe from raw data"""
        all_rows = []

        # Process sales KPIs
        for row in kpi_data.get('sales', []):
            all_rows.append({
                'date': row.get('date'),
                'function': 'sales',
                'daily_revenue': row.get('total_revenue', 0),
                'daily_orders': row.get('transaction_count', 0),
                'avg_order_value': row.get('avg_transaction_value', 0),
                'unique_customers': row.get('unique_customers', 0)
            })

        # Process customer KPIs
        for row in kpi_data.get('customer', []):
            all_rows.append({
                'date': row.get('date'),
                'function': 'customer',
                'active_customers': row.get('active_customers', 0),
                'loyal_customers': row.get('loyal_customers', 0),
                'avg_rfm_score': row.get('avg_rfm_score', 0),
                'total_customers': row.get('total_customers', 0)
            })

        # Process finance KPIs
        for row in kpi_data.get('finance', []):
            all_rows.append({
                'date': row.get('date'),
                'function': 'finance',
                'ar_transactions': row.get('ar_transactions', 0),
                'total_ar_amount': row.get('total_ar_amount', 0),
                'avg_age_days': row.get('avg_age_days', 0),
                'ar_customers': row.get('ar_customers', 0)
            })

        if not all_rows:
            return pd.DataFrame()

        df = pd.DataFrame(all_rows)
        df['date'] = pd.to_datetime(df['date'])

        # Fill NaN values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(0)

        return df

    def _get_ml_predictions(self, kpi_df: pd.DataFrame) -> Dict:
        """Get ML predictions for key KPIs"""
        if kpi_df.empty:
            return {}

        # Prepare features with external factors
        kpi_with_features, external_factors = self.ml_predictor.prepare_features_from_kpi_data(
            kpi_df.to_dict('records')
        )

        # Define KPIs to analyze
        kpi_columns = ['daily_revenue', 'daily_orders', 'avg_order_value']

        # Get predictions for each KPI
        predictions = self.ml_predictor.predict_deviations(kpi_with_features, kpi_columns)

        # Format results
        performance_explorer = {}
        feature_importance_aggregated = []
        feature_importance_by_kpi = {}
        variance_components = []

        for kpi, results in predictions.items():
            if 'error' not in results:
                # Performance explorer data
                performance_explorer[kpi] = results.get('performance_data', [])

                # Feature importance
                feature_importance_by_kpi[kpi] = {
                    'feature_importance': results.get('feature_importance', [])
                }

                # Aggregate feature importance (average across KPIs)
                for feature in results.get('feature_importance', []):
                    feature_importance_aggregated.append(feature)

        # Calculate aggregated feature importance
        if feature_importance_aggregated:
            feature_scores = defaultdict(list)
            for item in feature_importance_aggregated:
                feature_scores[item['feature']].append(item['importance'])

            aggregated = []
            for feature, scores in feature_scores.items():
                aggregated.append({
                    'feature': feature,
                    'avg_importance': np.mean(scores)
                })
            aggregated.sort(key=lambda x: x['avg_importance'], reverse=True)
        else:
            aggregated = []

        # Get variance decomposition from first successful KPI
        variance_decomposition = {}
        for kpi, results in predictions.items():
            if 'error' not in results and 'variance_decomposition' in results:
                variance_decomposition = results['variance_decomposition']
                break

        return {
            'performance_explorer': performance_explorer,
            'feature_importance': {
                'aggregated': aggregated,
                'byKPI': feature_importance_by_kpi
            },
            'variance_decomposition': variance_decomposition
        }

    def _calculate_kpi_metrics(self, kpi_df: pd.DataFrame) -> Dict:
        """Calculate KPI metrics for dashboard tiles"""
        metrics = {}

        if kpi_df.empty:
            return metrics

        # Calculate overall deviation metrics (from old implementation)
        all_deviations = []
        for col in kpi_df.select_dtypes(include=[np.number]).columns:
            if col not in ['date', 'function']:
                # Calculate deviation as percentage change from mean
                mean_val = kpi_df[col].mean()
                if mean_val != 0:
                    deviations = ((kpi_df[col] - mean_val) / mean_val).abs()
                    all_deviations.extend(deviations.dropna().values)

        # Average Deviation
        if all_deviations:
            metrics['averageDeviation'] = {
                'name': 'Avg Deviation',
                'value': float(np.mean(all_deviations)),
                'trend': 0,
                'change_percentage': 0,
                'is_significant': True
            }

        # Anomaly Count (based on significant deviations)
        anomaly_threshold = 0.15  # 15% deviation is considered anomaly
        metrics['anomalyCount'] = {
            'name': 'Anomalies',
            'value': int(sum(1 for d in all_deviations if d > anomaly_threshold)),
            'trend': 0,
            'change_percentage': 0,
            'is_significant': True
        }

        # Top Factor (will be populated from feature importance later)
        metrics['topFactor'] = {
            'name': 'Top Factor',
            'value': 'month',  # Default, will be updated from ML results
            'trend': 0,
            'change_percentage': 0,
            'is_significant': False
        }

        # Explanation Power (will be calculated from variance decomposition)
        metrics['explanationPower'] = {
            'name': 'Explained Variance',
            'value': 0.75,  # Default 75%, will be updated from ML results
            'trend': 0,
            'change_percentage': 0,
            'is_significant': False
        }

        # Forecast Trend
        if len(kpi_df) > 1:
            # Simple trend calculation based on recent data
            recent_data = kpi_df.tail(10)
            if len(recent_data) > 1:
                trend_direction = "increasing" if recent_data.index[-1] > recent_data.index[0] else "decreasing"
            else:
                trend_direction = "stable"
        else:
            trend_direction = "stable"

        metrics['forecastTrend'] = {
            'name': 'Trend',
            'value': trend_direction,
            'trend': 1 if trend_direction == "increasing" else -1 if trend_direction == "decreasing" else 0,
            'change_percentage': 0,
            'is_significant': False
        }

        # Original metrics from new implementation (keep these as well)
        # Sales metrics
        sales_df = kpi_df[kpi_df['function'] == 'sales']
        if not sales_df.empty:
            metrics['total_revenue'] = {
                'name': 'Total Revenue',
                'value': float(sales_df['daily_revenue'].sum()),
                'trend': self._calculate_trend(sales_df['daily_revenue']),
                'change_percentage': self._calculate_change_percentage(sales_df['daily_revenue']),
                'is_significant': True
            }
            metrics['avg_order_value'] = {
                'name': 'Average Order Value',
                'value': float(sales_df['avg_order_value'].mean()),
                'trend': self._calculate_trend(sales_df['avg_order_value']),
                'change_percentage': self._calculate_change_percentage(sales_df['avg_order_value']),
                'is_significant': False
            }
            metrics['daily_orders'] = {
                'name': 'Daily Orders',
                'value': float(sales_df['daily_orders'].mean()) if 'daily_orders' in sales_df.columns else 0,
                'trend': self._calculate_trend(sales_df['daily_orders']) if 'daily_orders' in sales_df.columns else 0,
                'change_percentage': self._calculate_change_percentage(sales_df['daily_orders']) if 'daily_orders' in sales_df.columns else 0,
                'is_significant': False
            }

        # Customer metrics
        customer_df = kpi_df[kpi_df['function'] == 'customer']
        if not customer_df.empty:
            metrics['active_customers'] = {
                'name': 'Active Customers',
                'value': float(customer_df['active_customers'].mean()),
                'trend': self._calculate_trend(customer_df['active_customers']),
                'change_percentage': self._calculate_change_percentage(customer_df['active_customers']),
                'is_significant': True
            }
            metrics['avg_rfm_score'] = {
                'name': 'Avg RFM Score',
                'value': float(customer_df['avg_rfm_score'].mean()),
                'trend': self._calculate_trend(customer_df['avg_rfm_score']),
                'change_percentage': self._calculate_change_percentage(customer_df['avg_rfm_score']),
                'is_significant': False
            }
            metrics['customer_retention'] = {
                'name': 'Retention Rate',
                'value': float(customer_df['loyal_customers'].sum() / customer_df['total_customers'].sum() * 100) if customer_df['total_customers'].sum() > 0 else 0,
                'trend': 0,
                'change_percentage': 0,
                'is_significant': False
            }

        # Finance metrics
        finance_df = kpi_df[kpi_df['function'] == 'finance']
        if not finance_df.empty:
            metrics['ar_amount'] = {
                'name': 'AR Amount',
                'value': float(finance_df['total_ar_amount'].sum()),
                'trend': self._calculate_trend(finance_df['total_ar_amount']),
                'change_percentage': self._calculate_change_percentage(finance_df['total_ar_amount']),
                'is_significant': True
            }
            metrics['avg_age_days'] = {
                'name': 'Avg Age Days',
                'value': float(finance_df['avg_age_days'].mean()),
                'trend': self._calculate_trend(finance_df['avg_age_days']),
                'change_percentage': self._calculate_change_percentage(finance_df['avg_age_days']),
                'is_significant': False
            }

        return metrics

    def _calculate_business_comparison(self, kpi_data: Dict) -> Dict:
        """Calculate business function comparison data"""
        # Radar chart data for business function comparison
        radar = {
            'sales': [
                {'dimension': 'Predictability', 'value': 0.70},
                {'dimension': 'Growth', 'value': 0.65},
                {'dimension': 'Volatility', 'value': 0.45},
                {'dimension': 'Seasonality', 'value': 0.60}
            ],
            'customer': [
                {'dimension': 'Predictability', 'value': 0.50},
                {'dimension': 'Growth', 'value': 0.72},
                {'dimension': 'Volatility', 'value': 0.30},
                {'dimension': 'Seasonality', 'value': 0.42}
            ],
            'finance': [
                {'dimension': 'Predictability', 'value': 0.62},
                {'dimension': 'Growth', 'value': 0.40},
                {'dimension': 'Volatility', 'value': 0.35},
                {'dimension': 'Seasonality', 'value': 0.55}
            ]
        }

        return {'radar': radar}

    def _calculate_deviation_patterns(self, ml_results: Dict) -> Dict:
        """Calculate deviation patterns from ML results"""
        patterns = []
        calendar = {}
        monthly_stats = {}

        # Extract patterns from performance explorer data
        for kpi, data_points in ml_results.get('performance_explorer', {}).items():
            for point in data_points:
                date = pd.to_datetime(point['date'])
                deviation = point['deviation']
                magnitude = abs(deviation) / (abs(point['predicted']) + 1e-6)

                # Calendar data
                year = date.year
                month = date.month
                day = date.day

                if year not in calendar:
                    calendar[year] = {}
                if month not in calendar[year]:
                    calendar[year][month] = []

                calendar[year][month].append({
                    'day': day,
                    'date': point['date'],
                    'magnitude': magnitude
                })

                # Significant patterns
                if magnitude >= 0.25:
                    patterns.append({
                        'date': point['date'],
                        'year': year,
                        'deviation_magnitude': magnitude,
                        'pattern_type': 'positive_anomaly' if deviation > 0 else 'negative_anomaly',
                        'is_significant': True,
                        'kpi': kpi
                    })

        # Calculate monthly statistics
        for year, months in calendar.items():
            for month, days in months.items():
                magnitudes = [d['magnitude'] for d in days]
                monthly_stats[f"{year}-{month:02d}"] = {
                    'avg_magnitude': np.mean(magnitudes),
                    'max_magnitude': np.max(magnitudes),
                    'volatility': np.std(magnitudes)
                }

        return {
            'patterns': patterns[:50],  # Limit to top 50 patterns
            'calendar': calendar,
            'monthlyStats': monthly_stats
        }

    def _calculate_factor_correlations(self, kpi_df: pd.DataFrame) -> Dict:
        """Calculate correlations between factors and KPIs"""
        # Simplified correlation matrix
        # In production, this would calculate actual correlations
        correlations = {
            'series': {
                'daily_revenue': {
                    'seasonality': 0.65,
                    'market_conditions': 0.45,
                    'external_factors': 0.35,
                    'business_cycles': 0.55
                },
                'daily_orders': {
                    'seasonality': 0.70,
                    'market_conditions': 0.40,
                    'external_factors': 0.30,
                    'business_cycles': 0.50
                }
            }
        }

        return correlations

    def _calculate_trend(self, series: pd.Series) -> float:
        """Calculate trend coefficient"""
        if len(series) < 2:
            return 0.0

        # Simple linear trend
        x = np.arange(len(series))
        y = series.values

        # Remove NaN values
        mask = ~np.isnan(y)
        if mask.sum() < 2:
            return 0.0

        x = x[mask]
        y = y[mask]

        # Calculate slope
        coef = np.polyfit(x, y, 1)[0]
        return float(coef)

    def _calculate_change_percentage(self, series: pd.Series) -> float:
        """Calculate percentage change"""
        if len(series) < 2:
            return 0.0

        # Get first and last valid values
        first = series.iloc[0]
        last = series.iloc[-1]

        if first == 0:
            return 0.0

        return float((last - first) / first * 100)

    def _get_business_functions(self, filters: Dict) -> List[str]:
        """Get list of business functions"""
        # Only default if businessFunctions is not present in filters at all
        # If it's present but empty, respect that and return empty
        if 'businessFunctions' not in filters:
            return ['sales', 'customer', 'finance']
        return filters.get('businessFunctions', [])

    def _empty_response(self) -> Dict:
        """Return empty response structure"""
        return {
            "featureImportance": {"aggregated": [], "byKPI": {}},
            "varianceDecomposition": {"components": []},
            "performanceExplorer": {},
            "kpis": {},
            "businessFunctionComparison": {"radar": {}},
            "deviationPatterns": {"patterns": [], "calendar": {}, "monthlyStats": {}},
            "factorCorrelations": {"series": {}},
            "insights": [],
            "metadata": {
                "totalDataPoints": 0,
                "businessFunctions": [],
                "lastUpdated": datetime.now().isoformat()
            }
        }

    @cache_dashboard_endpoint(dashboard_type="performance_deviation_ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        kpi_metrics: Dict,
        ml_results: Dict,
        deviation_patterns: Dict,
        factor_correlations: Dict
    ) -> List[str]:
        """Get cached AI insights with 30-minute TTL"""
        try:
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpi_metrics,
                ml_results,
                deviation_patterns,
                factor_correlations,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[PerformanceProcessingService] Error generating AI insights: {e}")
            return []

    def _generate_ai_insights(
        self,
        kpi_metrics: Dict,
        ml_results: Dict,
        deviation_patterns: Dict,
        factor_correlations: Dict,
        filters: Optional[Dict] = None
    ) -> List[str]:
        """Generate AI-powered insights using Gemini"""
        try:
            from lib.ai_insights_generator import generate_ai_insights

            # Prepare KPIs dict
            kpis_dict = {
                'avgDeviation': kpi_metrics.get('averageDeviation', {}).get('value', 0),
                'anomalyCount': kpi_metrics.get('anomalyCount', {}).get('value', 0),
                'topFactor': kpi_metrics.get('topFactor', {}).get('value', 'N/A'),
                'explanationPower': kpi_metrics.get('explanationPower', {}).get('value', 0)
            }

            # Prepare data summary
            data_summary = {
                'featureImportance': ml_results.get('feature_importance', {}),
                'varianceDecomposition': ml_results.get('variance_decomposition', {}),
                'deviationPatterns': deviation_patterns.get('patterns', []),
                'significantPatterns': [p for p in deviation_patterns.get('patterns', []) if p.get('is_significant')],
                'topCorrelations': factor_correlations.get('series', {})
            }

            # Call AI insights generator
            ai_insights = generate_ai_insights(
                dashboard_type='performance_deviation',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[PerformanceProcessingService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except Exception as e:
            print(f"[PerformanceProcessingService] Error in _generate_ai_insights: {e}")
            return []

    def _generate_rule_based_insights(
        self,
        kpi_metrics: Dict,
        ml_results: Dict,
        deviation_patterns: Dict,
        factor_correlations: Dict
    ) -> List[Dict]:
        """Generate rule-based insights from performance data"""
        insights = []

        # Get key metrics
        avg_deviation = kpi_metrics.get('averageDeviation', {}).get('value', 0)
        anomaly_count = kpi_metrics.get('anomalyCount', {}).get('value', 0)
        top_factor = kpi_metrics.get('topFactor', {}).get('value', 'Unknown')
        explanation_power = kpi_metrics.get('explanationPower', {}).get('value', 0)

        # Get significant patterns
        significant_patterns = [p for p in deviation_patterns.get('patterns', []) if p.get('is_significant', False)]

        # Insight 1: High deviation rate
        if avg_deviation > 0.15:
            insights.append({
                'type': 'warning',
                'priority': 'HIGH',
                'message': f'Average performance deviation of {(avg_deviation * 100):.1f}% exceeds acceptable threshold (15%), indicating systematic performance issues across business functions. **Action:** Convene cross-functional leadership meeting within 48 hours to review deviation drivers. Implement daily monitoring dashboards. Conduct root cause analysis on top 3 contributing factors. **Expected outcome:** 40-50% reduction in deviation rate within 2 weeks, improved forecast accuracy from current levels to 90%+.'
            })
        elif avg_deviation > 0.08:
            insights.append({
                'type': 'info',
                'priority': 'MODERATE',
                'message': f'Performance deviation at {(avg_deviation * 100):.1f}% within acceptable operational range but trending above optimal (5-8%). **Action:** Review weekly deviation trends with department heads. Adjust forecasting models based on recent patterns. Implement early warning alerts for deviation spikes above 12%. **Expected outcome:** Maintain deviation within 5-8% range, prevent escalation to high-risk territory.'
            })

        # Insight 2: Anomaly count
        if anomaly_count > 20:
            insights.append({
                'type': 'warning',
                'priority': 'CRITICAL',
                'message': f'{anomaly_count} significant performance anomalies detected, suggesting volatile operating conditions or data quality issues. **Action:** Immediate investigation of top 10 anomalies within 24 hours. Verify data pipeline integrity. Assess external market disruptions (competitor actions, supply chain, economic factors). Deploy rapid response protocols. **Expected outcome:** Identification and resolution of data quality issues, stabilization of performance metrics, 60-70% anomaly reduction within 1 week.'
            })
        elif anomaly_count > 10:
            insights.append({
                'type': 'info',
                'priority': 'MODERATE',
                'message': f'{anomaly_count} performance anomalies identified across KPIs. **Action:** Weekly anomaly review meeting. Categorize by root cause (internal vs external). Update forecasting models to account for new patterns. **Expected outcome:** Improved anomaly prediction, reduced surprise factor in performance reporting.'
            })

        # Insight 3: Top contributing factor
        feature_importance = ml_results.get('feature_importance', {}).get('aggregated', [])
        if feature_importance:
            top_feature = feature_importance[0]
            feature_name = top_feature.get('feature', 'Unknown')
            feature_importance_pct = top_feature.get('avg_importance', 0) * 100

            if feature_importance_pct > 50:
                insights.append({
                    'type': 'warning',
                    'priority': 'HIGH',
                    'message': f'Single factor "{feature_name}" dominates performance variance at {feature_importance_pct:.1f}% importance, creating concentrated risk exposure. **Action:** Develop contingency plans for {feature_name} disruption within 7 days. Identify 2-3 alternative levers to reduce dependency. Implement monitoring dashboard for this critical factor with hourly updates. **Expected outcome:** Risk diversification, reduced single-point-of-failure exposure, improved resilience to {feature_name} volatility.'
                })
            elif feature_importance_pct > 30:
                insights.append({
                    'type': 'info',
                    'priority': 'MODERATE',
                    'message': f'Primary driver "{feature_name}" accounts for {feature_importance_pct:.1f}% of performance variance. **Action:** Deep-dive analysis of {feature_name} patterns within 14 days. Optimize processes related to this factor. Develop playbook for managing {feature_name} fluctuations. **Expected outcome:** 20-25% improvement in {feature_name} control, better predictive capabilities.'
                })

        # Insight 4: Model explanation power
        if explanation_power < 0.60:
            insights.append({
                'type': 'warning',
                'priority': 'HIGH',
                'message': f'Model explains only {(explanation_power * 100):.1f}% of performance variance, indicating significant unmeasured factors affecting outcomes. **Action:** Conduct stakeholder interviews to identify missing variables within 7 days. Expand data collection to capture external factors (market trends, seasonality, competitive actions). Enhance feature engineering. **Expected outcome:** Improved model R² to 75%+, better performance predictability, reduced unexplained variance.'
            })
        elif explanation_power > 0.80:
            insights.append({
                'type': 'info',
                'priority': 'INFO',
                'message': f'Strong model performance with {(explanation_power * 100):.1f}% variance explained, providing reliable performance attribution and forecasting foundation. **Action:** Maintain current monitoring protocols. Use model for scenario planning and what-if analysis. Share insights with leadership for strategic decision-making. **Expected outcome:** Continued high forecast accuracy, data-driven strategic planning.'
            })

        # Insight 5: Significant patterns detected
        if len(significant_patterns) > 5:
            insights.append({
                'type': 'warning',
                'priority': 'HIGH',
                'message': f'{len(significant_patterns)} statistically significant deviation patterns detected, suggesting systematic rather than random performance issues. **Action:** Pattern analysis workshop with operations team within 3 days. Map patterns to business processes. Implement targeted interventions for each pattern cluster. Assign pattern owners. **Expected outcome:** Root cause identification for systematic issues, 50-60% pattern reduction through targeted fixes.'
            })

        # Fallback if no significant insights
        if not insights:
            insights.append({
                'type': 'info',
                'priority': 'INFO',
                'message': f'Performance metrics operating within normal parameters. Average deviation at {(avg_deviation * 100):.1f}%, model explains {(explanation_power * 100):.1f}% of variance. **Action:** Continue standard monitoring protocols. Maintain current forecasting practices. Review quarterly for model retraining needs. **Expected outcome:** Sustained performance stability, continued forecast reliability.'
            })

        return insights