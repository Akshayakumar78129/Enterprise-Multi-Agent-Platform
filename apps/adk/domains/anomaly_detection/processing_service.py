"""Anomaly detection processing service - Following ChurnProcessingService pattern"""

import pandas as pd
import numpy as np
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .data_service import AnomalyDataService
from database.filter_engine import FilterEngine
from .ml_predictor import AnomalyMLPredictor
from domains.common.simple_cache import cache_dashboard_endpoint


class AnomalyProcessingService:
    """Processing service for anomaly detection with ML integration"""

    def __init__(self):
        self.data_service = AnomalyDataService()
        self.filter_engine = FilterEngine()
        self.ml_predictor = AnomalyMLPredictor()
        self.model_trained = False

    async def _ensure_model_trained(self):
        """Ensure ML model is trained before use"""
        if not self.model_trained:
            await self._train_ml_model()

    async def _train_ml_model(self):
        """Train the ML model with current data from service"""
        try:
            # Get data from service (no filters for training)
            txns_res = await self.data_service.get_transactions({})
            loyalty_res = await self.data_service.get_loyalty({})
            customers_res = await self.data_service.get_customers({})

            # Prepare features from service data
            customer_df, features = self.ml_predictor.prepare_features_from_service_data(
                txns_res.get('rows', []),
                loyalty_res.get('rows', []),
                customers_res.get('rows', [])
            )

            if len(customer_df) > 0:
                metrics = self.ml_predictor.train_model(features)
                self.model_trained = True
                print(f"[AnomalyProcessingService] ML model trained successfully. Anomalies detected: {metrics.get('n_anomalies', 0)}/{metrics.get('n_samples', 0)}")
        except Exception as e:
            print(f"[AnomalyProcessingService] Failed to train ML model: {e}")

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint for anomaly detection

        Returns data in format similar to ChurnProcessingService
        """
        try:
            # Get all metrics in parallel for better performance
            (
                customer_anomalies,
                segment_distribution,
                region_distribution,
                severity_distribution,
                feature_importance,
                time_series_anomalies
            ) = await asyncio.gather(
                self.get_customer_anomalies(filters),
                self.get_segment_distribution(filters),
                self.get_region_distribution(filters),
                self.get_severity_distribution(filters),
                self.get_feature_importance(filters),
                self.get_time_series_anomalies(filters)
            )

            # Generate rule-based insights
            rule_based_insights = self._generate_insights(
                customer_anomalies,
                segment_distribution,
                severity_distribution,
                feature_importance
            )

            # Calculate KPIs for AI insights
            kpis = self._calculate_kpis(
                customer_anomalies,
                severity_distribution,
                time_series_anomalies
            )

            # Get AI insights async (non-blocking with graceful fallback)
            ai_insights = await self._get_cached_ai_insights(
                filters,
                kpis,
                customer_anomalies,
                segment_distribution,
                severity_distribution
            )

            # Combine insights (rule-based + AI)
            all_insights = rule_based_insights + [{'type': 'ai', 'message': insight} for insight in ai_insights]

            # CRITICAL PERFORMANCE FIX: Limit customer anomalies to prevent frontend freezing
            # Only return top 100 anomalies sorted by severity and score
            limited_customer_anomalies = customer_anomalies[:100] if customer_anomalies else []

            print(f"[AnomalyProcessingService] Returning {len(limited_customer_anomalies)} of {len(customer_anomalies or [])} customer anomalies")

            # Return in structured format
            return {
                "customerAnomalies": limited_customer_anomalies,
                "segmentDistribution": segment_distribution or [],
                "regionDistribution": region_distribution or [],
                "severityDistribution": severity_distribution or [],
                "featureImportance": feature_importance or [],
                "timeSeriesAnomalies": time_series_anomalies or [],
                "insights": all_insights,
                "kpiMetrics": kpis
            }
        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getDashboardSummary: {e}")
            return {
                "customerAnomalies": [],
                "segmentDistribution": [],
                "regionDistribution": [],
                "severityDistribution": [],
                "featureImportance": [],
                "timeSeriesAnomalies": [],
                "insights": []
            }

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_customer_anomalies(self, filters: Dict) -> List[Dict]:
        """Get customer-level anomaly detection results"""
        try:
            # Ensure model is trained
            await self._ensure_model_trained()

            # Get segment filter if present
            segment_filter = filters.get('segments', [])

            # Remove segments from filters for DB query
            db_filters = filters.copy()
            db_filters.pop('segments', None)
            db_filters.pop('segment', None)

            # Get data from database using data service
            txns_res = await self.data_service.get_transactions(db_filters)
            loyalty_res = await self.data_service.get_loyalty(db_filters)
            customers_res = await self.data_service.get_customers(db_filters)

            # Use ML predictor to get anomaly predictions
            predictions_df = self.ml_predictor.predict_from_service_data(
                txns_res.get('rows', []),
                loyalty_res.get('rows', []),
                customers_res.get('rows', [])
            )

            if predictions_df.empty:
                return []

            # CRITICAL FIX: Remove duplicate customer_ids to prevent table showing same rows multiple times
            predictions_df = predictions_df.drop_duplicates(subset=['customer_id'], keep='first')
            print(f"[AnomalyProcessingService] Processing {len(predictions_df)} unique customers")

            # Format results for API response
            results = []
            for _, row in predictions_df.iterrows():
                # Apply segment filter if present
                if segment_filter and row.get('customer_type') not in segment_filter:
                    continue

                # Find anomalous features
                anomalous_features = []
                for col in self.ml_predictor.feature_columns:
                    zscore_col = f'{col}_zscore'
                    if zscore_col in row and row[zscore_col] > 2.5:
                        anomalous_features.append({
                            'feature': col,
                            'value': float(row.get(col, 0)),
                            'zscore': float(row[zscore_col])
                        })

                results.append({
                    'customer_id': str(row['customer_id']),
                    'customer_name': row.get('customer_name'),
                    'segment': row.get('customer_type', 'Unknown'),
                    'region': row.get('region', 'Unknown'),
                    'is_anomaly': bool(row['is_anomaly']),
                    'anomaly_score': float(row['anomaly_score']),
                    'severity_level': int(row['severity_level']),
                    'transaction_count': int(row.get('transaction_count', 0)),
                    'avg_transaction_value': float(row.get('avg_net_amount', 0)),
                    'total_spend': float(row.get('total_net_amount', 0)),
                    'days_since_last_txn': int(row.get('days_since_last_txn', 0)),
                    'anomalous_features': anomalous_features[:5]  # Top 5 anomalous features
                })

            # Sort by severity level (descending) and anomaly score (ascending - more negative = more anomalous)
            results.sort(key=lambda x: (-x['severity_level'], x['anomaly_score']))

            # IMPORTANT: Get stratified sample to show all severity levels in limited results
            # Group by severity and take proportional samples
            severity_groups = {}
            for r in results:
                severity = r['severity_level']
                if severity not in severity_groups:
                    severity_groups[severity] = []
                severity_groups[severity].append(r)

            # Take samples from each severity level proportionally
            stratified_results = []
            total_results = len(results)
            for severity in sorted(severity_groups.keys(), reverse=True):
                group = severity_groups[severity]
                # Take proportion of this severity level (at least 5 if exists)
                proportion = max(5, int(len(group) / total_results * 100))
                stratified_results.extend(group[:proportion])

            print(f"[AnomalyProcessingService] Stratified sample: {len(stratified_results)} customers across {len(severity_groups)} severity levels")

            return stratified_results

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getCustomerAnomalies: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_segment_distribution(self, filters: Dict) -> List[Dict]:
        """Get anomaly distribution by customer segment"""
        try:
            anomalies = await self.get_customer_anomalies(filters)

            if not anomalies:
                return []

            # Group by segment
            segment_data = defaultdict(lambda: {
                'total': 0,
                'anomalies': 0,
                'severity_1': 0,
                'severity_2': 0,
                'severity_3': 0,
                'severity_4': 0,
                'severity_5': 0
            })

            for customer in anomalies:
                segment = customer['segment']
                segment_data[segment]['total'] += 1

                if customer['is_anomaly']:
                    segment_data[segment]['anomalies'] += 1
                    severity = customer['severity_level']
                    segment_data[segment][f'severity_{severity}'] += 1

            # Format results
            results = []
            for segment, data in segment_data.items():
                results.append({
                    'segment': segment,
                    'total_customers': data['total'],
                    'anomaly_count': data['anomalies'],
                    'anomaly_rate': round(data['anomalies'] / data['total'] * 100, 2) if data['total'] > 0 else 0,
                    'severity_distribution': {
                        '1': data['severity_1'],
                        '2': data['severity_2'],
                        '3': data['severity_3'],
                        '4': data['severity_4'],
                        '5': data['severity_5']
                    }
                })

            return results

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getSegmentDistribution: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_region_distribution(self, filters: Dict) -> List[Dict]:
        """Get anomaly distribution by region"""
        try:
            anomalies = await self.get_customer_anomalies(filters)

            if not anomalies:
                return []

            # Group by region
            region_data = defaultdict(lambda: {
                'total': 0,
                'anomalies': 0,
                'total_severity': 0
            })

            for customer in anomalies:
                region = customer['region']
                region_data[region]['total'] += 1

                if customer['is_anomaly']:
                    region_data[region]['anomalies'] += 1
                    region_data[region]['total_severity'] += customer['severity_level']

            # Format results
            results = []
            for region, data in region_data.items():
                avg_severity = data['total_severity'] / data['anomalies'] if data['anomalies'] > 0 else 0
                results.append({
                    'region': region,
                    'total_customers': data['total'],
                    'anomaly_count': data['anomalies'],
                    'anomaly_rate': round(data['anomalies'] / data['total'] * 100, 2) if data['total'] > 0 else 0,
                    'avg_severity': round(avg_severity, 2)
                })

            # Sort by anomaly count and limit to top 10 regions to prevent Y-axis congestion
            results.sort(key=lambda x: x['anomaly_count'], reverse=True)

            # Limit to top 10 regions
            top_results = results[:10]

            print(f"[AnomalyProcessingService] Returning top {len(top_results)} of {len(results)} regions")

            return top_results

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getRegionDistribution: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_severity_distribution(self, filters: Dict) -> List[Dict]:
        """Get overall severity distribution"""
        try:
            anomalies = await self.get_customer_anomalies(filters)

            if not anomalies:
                return []

            # Count by severity level
            severity_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            total_anomalies = 0

            for customer in anomalies:
                if customer['is_anomaly']:
                    severity = customer['severity_level']
                    severity_counts[severity] += 1
                    total_anomalies += 1

            # Format results
            results = []
            severity_labels = {
                1: 'Very Low',
                2: 'Low',
                3: 'Medium',
                4: 'High',
                5: 'Very High'
            }

            for level, label in severity_labels.items():
                count = severity_counts[level]
                results.append({
                    'severity_level': level,
                    'label': label,
                    'count': count,
                    'percentage': round(count / total_anomalies * 100, 2) if total_anomalies > 0 else 0
                })

            return results

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getSeverityDistribution: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_feature_importance(self, filters: Dict) -> List[Dict]:
        """Get feature importance from the ML model"""
        try:
            # Ensure model is trained
            await self._ensure_model_trained()

            # Get feature importance from ML predictor
            importance_scores = self.ml_predictor.get_feature_importance()

            return importance_scores[:10]  # Return top 10 features

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getFeatureImportance: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='anomaly', ttl=300)
    async def get_time_series_anomalies(self, filters: Dict) -> List[Dict]:
        """Get time series of anomaly counts over time"""
        try:
            # Get all customer anomalies
            anomalies = await self.get_customer_anomalies(filters)

            if not anomalies:
                return []

            # Get transaction data to build time series
            db_filters = filters.copy()
            db_filters.pop('segments', None)
            db_filters.pop('segment', None)

            txns_res = await self.data_service.get_transactions(db_filters)
            txn_df = pd.DataFrame(txns_res.get('rows', [])) if txns_res.get('rows') else pd.DataFrame()

            if txn_df.empty:
                return []

            # Convert to datetime
            txn_df['txn_date'] = pd.to_datetime(txn_df['txn_date'])

            # Create a set of anomalous customer IDs
            anomalous_customer_ids = {a['customer_id'] for a in anomalies if a['is_anomaly']}

            # Group by month and count anomalous transactions
            txn_df['anomalous'] = txn_df['customer_id'].astype(str).isin(anomalous_customer_ids)
            txn_df['month'] = txn_df['txn_date'].dt.to_period('M')

            # Aggregate by month
            monthly_stats = txn_df.groupby('month').agg({
                'anomalous': 'sum',
                'txn_id': 'count'
            }).reset_index()

            monthly_stats['month'] = monthly_stats['month'].astype(str)

            # Format results
            results = []
            for _, row in monthly_stats.iterrows():
                results.append({
                    'date': row['month'],
                    'anomaly_count': int(row['anomalous']),
                    'total_count': int(row['txn_id']),
                    'anomaly_rate': round((row['anomalous'] / row['txn_id'] * 100) if row['txn_id'] > 0 else 0, 2)
                })

            print(f"[AnomalyProcessingService] Generated {len(results)} time series points")

            return results

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in getTimeSeriesAnomalies: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _generate_insights(
        self,
        customer_anomalies: List[Dict],
        segment_distribution: List[Dict],
        severity_distribution: List[Dict],
        feature_importance: List[Dict]
    ) -> List[Dict]:
        """Generate rule-based insights with priority levels and actionable recommendations"""
        insights = []

        if not customer_anomalies:
            return [{
                'type': 'info',
                'priority': 'INFO',
                'message': 'No anomalies detected in the current dataset. System operating normally.'
            }]

        # Count anomalies by severity
        total_customers = len(customer_anomalies)
        high_severity = sum(1 for c in customer_anomalies if c.get('severity_level', 0) >= 4)
        anomaly_count = sum(1 for c in customer_anomalies if c.get('is_anomaly', False))

        # High severity insight
        if high_severity > 0:
            severity_pct = (high_severity / total_customers * 100) if total_customers > 0 else 0
            insights.append({
                'type': 'warning',
                'priority': 'CRITICAL',
                'message': f'{high_severity:,} customers ({severity_pct:.1f}%) show high severity anomalies (Level 4-5) requiring immediate investigation. **Action:** Initiate fraud review process for top 20 highest-severity customers within 24 hours. Review transaction patterns, contact history, and behavioral changes. **Expected outcome:** Prevention of ${(high_severity * 1500):,.0f}+ in potential fraud losses, improved customer account security.'
            })

        # Overall anomaly rate
        if anomaly_count > 0:
            anomaly_rate = (anomaly_count / total_customers * 100) if total_customers > 0 else 0
            if anomaly_rate > 20:
                insights.append({
                    'type': 'warning',
                    'priority': 'HIGH',
                    'message': f'Warning: {anomaly_rate:.1f}% anomaly rate detected across {anomaly_count:,} customers, significantly above baseline. **Action:** Deploy automated monitoring alerts for new anomalies. Schedule immediate meeting with fraud prevention team to review detection thresholds and implement enhanced verification for high-risk transactions. **Expected outcome:** 40-50% reduction in false positives, improved detection accuracy, prevented losses of ${(anomaly_count * 800):,.0f}+.'
                })
            else:
                insights.append({
                    'type': 'info',
                    'priority': 'MODERATE',
                    'message': f'{anomaly_count:,} anomalies detected ({anomaly_rate:.1f}% of customers), within expected operational range. **Action:** Continue standard monitoring protocols. Review monthly trend reports to identify emerging patterns. **Expected outcome:** Maintained fraud detection rate with minimal business disruption.'
                })

        # Segment-specific insights
        if segment_distribution:
            high_risk_segments = [s for s in segment_distribution if s.get('anomaly_rate', 0) > 30]
            if high_risk_segments:
                top_segment = max(high_risk_segments, key=lambda x: x.get('anomaly_rate', 0))
                insights.append({
                    'type': 'warning',
                    'priority': 'HIGH',
                    'message': f'{top_segment["segment"]} segment shows elevated anomaly rate at {top_segment["anomaly_rate"]:.1f}%, indicating concentrated risk. **Action:** Implement segment-specific fraud rules and enhanced authentication requirements for {top_segment["segment"]} customers within 72 hours. Deploy targeted customer education campaign. **Expected outcome:** 30-40% reduction in segment-specific anomalies, improved customer trust metrics.'
                })

        # Feature importance insights
        if feature_importance:
            top_feature = feature_importance[0]
            feature_name = top_feature.get('feature', 'Unknown')
            feature_importance_pct = top_feature.get('importance', 0)
            insights.append({
                'type': 'info',
                'priority': 'MODERATE',
                'message': f'Top anomaly indicator: {feature_name} (importance: {feature_importance_pct:.1f}%), driving majority of anomaly detections. **Action:** Deep-dive analysis of {feature_name} patterns across normal vs anomalous customers within 7 days. Refine detection model thresholds based on findings. **Expected outcome:** 15-20% improvement in detection precision, reduced investigation overhead.'
            })

        # Critical severity insight
        critical_count = sum(s.get('count', 0) for s in severity_distribution if s.get('severity_level', 0) == 5)
        if critical_count > 0:
            insights.append({
                'type': 'warning',
                'priority': 'CRITICAL',
                'message': f'{critical_count:,} customers at CRITICAL severity level (Level 5) - highest risk tier requiring immediate action. **Action:** Freeze high-value transactions for critical accounts pending manual review. Escalate to executive leadership and legal team within 4 hours. Initiate customer outreach for account verification. **Expected outcome:** Prevention of catastrophic fraud losses (${(critical_count * 5000):,.0f}+ at risk), protected brand reputation.'
            })

        # Fallback if no specific insights
        if not insights:
            insights = [{
                'type': 'info',
                'priority': 'INFO',
                'message': f'Anomaly analysis completed for {total_customers:,} customers. System operating within normal parameters. Continue standard monitoring protocols.'
            }]

        return insights

    def _calculate_kpis(
        self,
        customer_anomalies: List[Dict],
        severity_distribution: List[Dict],
        time_series_anomalies: List[Dict]
    ) -> Dict:
        """Calculate KPIs for anomaly detection"""
        total_customers = len(customer_anomalies)
        total_anomalies = sum(1 for c in customer_anomalies if c.get('is_anomaly', False))
        high_severity = sum(1 for c in customer_anomalies if c.get('severity_level', 0) >= 4)

        avg_anomaly_score = np.mean([c.get('anomaly_score', 0) for c in customer_anomalies]) if customer_anomalies else 0

        # Calculate top anomalous feature from feature contributions
        top_anomalous_feature = "Unknown"
        if customer_anomalies:
            # Aggregate feature contributions across all anomalies
            feature_totals = defaultdict(float)
            for customer in customer_anomalies:
                if customer.get('is_anomaly', False) and 'top_features' in customer:
                    for feature_data in customer['top_features']:
                        feature_name = feature_data.get('feature', '')
                        contribution = feature_data.get('contribution', 0)
                        feature_totals[feature_name] += abs(contribution)

            # Get feature with highest total contribution
            if feature_totals:
                top_anomalous_feature = max(feature_totals.items(), key=lambda x: x[1])[0]

        # Calculate new anomalies in last 24 hours from time series
        new_anomalies = 0
        if time_series_anomalies:
            try:
                # Get latest date from time series
                latest_date = max(ts.get('date', '') for ts in time_series_anomalies if ts.get('date'))
                if latest_date:
                    # Count anomalies from latest date point
                    for ts in time_series_anomalies:
                        if ts.get('date') == latest_date:
                            new_anomalies = ts.get('anomaly_count', 0)
                            break
            except Exception as e:
                print(f"[AnomalyProcessingService] Error calculating new anomalies: {e}")
                new_anomalies = 0

        return {
            'totalCustomers': total_customers,
            'totalAnomalies': total_anomalies,
            'highSeverityCount': high_severity,
            'anomalyRate': (total_anomalies / total_customers * 100) if total_customers > 0 else 0,
            'meanAnomalyScore': float(avg_anomaly_score),
            'severityDistribution': len(severity_distribution),
            'topAnomalousFeature': top_anomalous_feature,
            'newAnomalies': new_anomalies
        }

    @cache_dashboard_endpoint(dashboard_type="anomaly_detection_ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        kpis: Dict,
        customer_anomalies: List[Dict],
        segment_distribution: List[Dict],
        severity_distribution: List[Dict]
    ) -> List[str]:
        """Get cached AI insights with 30-minute TTL"""
        try:
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpis,
                customer_anomalies,
                segment_distribution,
                severity_distribution,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[AnomalyProcessingService] Error generating AI insights: {e}")
            return []

    def _generate_ai_insights(
        self,
        kpis: Dict,
        customer_anomalies: List[Dict],
        segment_distribution: List[Dict],
        severity_distribution: List[Dict],
        filters: Optional[Dict] = None
    ) -> List[str]:
        """Generate AI-powered insights using Gemini"""
        try:
            from lib.ai_insights_generator import generate_ai_insights

            # Prepare data summary
            data_summary = {
                'totalAnomalies': len(customer_anomalies),
                'topSegment': segment_distribution[0] if segment_distribution else {},
                'severityBreakdown': severity_distribution,
                'highSeverityCustomers': [c for c in customer_anomalies if c.get('severity_level', 0) >= 4][:5]
            }

            # Call AI insights generator
            ai_insights = generate_ai_insights(
                dashboard_type='anomaly_detection',
                kpis=kpis,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[AnomalyProcessingService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in _generate_ai_insights: {e}")
            return []

    async def get_customers(self, filters: Dict) -> List[Dict]:
        """Get raw customer data"""
        result = await self.data_service.get_customers(filters)
        return result.get('rows', [])

    async def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Export anomaly data in specified format"""
        try:
            anomalies = await self.get_customer_anomalies(filters)

            if format == "csv":
                df = pd.DataFrame(anomalies)
                return df.to_csv(index=False)
            elif format == "json":
                import json
                return json.dumps(anomalies, indent=2)
            else:
                return str(anomalies)

        except Exception as e:
            print(f"[AnomalyProcessingService] Error in exportData: {e}")
            return ""