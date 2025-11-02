"""Processing service for cash flow analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import CashFlowDataService
from .models import (
    CashFlowKPI,
    CashFlowTrend,
    OperatingCashFlowDetail,
    InvestingCashFlowDetail,
    FinancingCashFlowDetail,
    CashFlowProjection,
    CashFlowTransaction,
    CashFlowResponse,
    FCFYieldMetric,
    CashROICMetric,
    CashConversionQualityMetric,
    LiquidityCoverageMetric,
    MAFirepowerMetric,
    FCFBridgeComponent,
    LiquidityTimelinePoint,
    CapitalAllocationItem
)


class CashFlowProcessingService:
    """Processing service for cash flow analysis"""

    def __init__(self):
        self.data_service = CashFlowDataService()

    @cache_dashboard_endpoint("cash_flow")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete cash flow dashboard data"""

        # Normalize filter format - support both old (dateRange) and new (dateFrom/dateTo) formats
        normalized_filters = self._normalize_filters(filters)

        # Fetch all data components
        summary = await self.data_service.get_cash_flow_summary(normalized_filters)
        operating_cf = await self.data_service.get_operating_cash_flow(normalized_filters)
        trends = await self.data_service.get_cash_flow_trends(normalized_filters)
        by_category = await self.data_service.get_cash_flow_by_category(normalized_filters)
        by_region = await self.data_service.get_cash_flow_by_region(normalized_filters)
        transactions = await self.data_service.get_transactions(normalized_filters, limit=50)

        # Fetch new visualization data
        fcf_bridge = await self.data_service.get_fcf_bridge_data(normalized_filters)
        liquidity_timeline = await self.data_service.get_liquidity_timeline(normalized_filters)
        capital_allocation = await self.data_service.get_capital_allocation(normalized_filters)

        # Calculate KPIs
        kpis = self._calculate_kpis(summary, operating_cf, by_category)

        # Prepare trend data
        trend_data = self._prepare_trends(trends)

        # Prepare operating CF breakdown
        operating_breakdown = self._prepare_operating_breakdown(by_category)

        # Prepare investing and financing breakdowns (simulated from categories)
        investing_breakdown = self._prepare_investing_breakdown(by_category)
        financing_breakdown = self._prepare_financing_breakdown(by_category)

        # Generate projections
        projection_data = self._generate_projections(trends)

        # Create response with KPI metrics structure
        return {
            'kpiMetrics': {
                'netCashFlow': kpis.netCashFlow,
                'operatingCashFlow': kpis.operatingCashFlow,
                'investingCashFlow': kpis.investingCashFlow,
                'financingCashFlow': kpis.financingCashFlow,
                'cashRatio': kpis.cashRatio,
                'freeCashFlow': kpis.freeCashFlow,
                'fcfYield': kpis.fcfYield.dict() if kpis.fcfYield else None,
                'cashROIC': kpis.cashROIC.dict() if kpis.cashROIC else None,
                'cashConversionQuality': kpis.cashConversionQuality.dict() if kpis.cashConversionQuality else None,
                'liquidityCoverage': kpis.liquidityCoverage.dict() if kpis.liquidityCoverage else None,
                'maFirepower': kpis.maFirepower.dict() if kpis.maFirepower else None
            },
            'mainData': {
                'trends': [t.dict() for t in trend_data],
                'operating': [o.dict() for o in operating_breakdown],
                'investing': [i.dict() for i in investing_breakdown],
                'financing': [f.dict() for f in financing_breakdown],
                'projection': [p.dict() for p in projection_data],
                'transactions': transactions[:25],  # Limit for performance
                'byRegion': by_region,
                'fcfBridge': fcf_bridge,
                'liquidityTimeline': liquidity_timeline,
                'capitalAllocation': capital_allocation
            },
            'insights': self._generate_insights(kpis.dict(), summary, operating_cf, by_category),
            'metadata': {
                'filtersApplied': normalized_filters,
                'timestamp': datetime.now().isoformat()
            }
        }

    def _normalize_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize filter format to handle both old and new formats"""
        normalized = filters.copy()

        # Handle old dateRange format → convert to dateFrom/dateTo
        if 'dateRange' in normalized and isinstance(normalized['dateRange'], dict):
            date_range = normalized.pop('dateRange')
            if 'startDate' in date_range and not normalized.get('dateFrom'):
                normalized['dateFrom'] = date_range['startDate']
            if 'endDate' in date_range and not normalized.get('dateTo'):
                normalized['dateTo'] = date_range['endDate']

        return normalized

    def _calculate_kpis(self, summary: Dict, operating_cf: Dict, by_category: List[Dict]) -> CashFlowKPI:
        """Calculate KPI metrics"""

        total_cash_flow = summary.get('totalCashFlow', 0)
        operating_flow = operating_cf.get('totalOperatingCF', 0)

        # Simulate investing and financing from category data
        # In a real system, these would be categorized differently
        investing_flow = -abs(total_cash_flow * 0.15)  # Simulate 15% as investing
        financing_flow = total_cash_flow * 0.05  # Simulate 5% as financing

        # Calculate cash ratio (simplified)
        cash_ratio = operating_flow / max(abs(investing_flow), 1) if investing_flow != 0 else 1.0

        # Free cash flow = Operating CF - Capital Expenditures (simplified)
        free_cash_flow = operating_flow + investing_flow

        # Calculate 5 strategic metrics
        fcf_yield = self._calculate_fcf_yield(free_cash_flow, summary)
        cash_roic = self._calculate_cash_roic(free_cash_flow, operating_flow)
        cash_quality = self._calculate_cash_conversion_quality(operating_flow, summary)
        liquidity_coverage = self._calculate_liquidity_coverage(total_cash_flow, operating_flow)
        ma_firepower = self._calculate_ma_firepower(free_cash_flow)

        return CashFlowKPI(
            netCashFlow=total_cash_flow,
            operatingCashFlow=operating_flow,
            investingCashFlow=investing_flow,
            financingCashFlow=financing_flow,
            cashRatio=cash_ratio,
            freeCashFlow=free_cash_flow,
            fcfYield=fcf_yield,
            cashROIC=cash_roic,
            cashConversionQuality=cash_quality,
            liquidityCoverage=liquidity_coverage,
            maFirepower=ma_firepower
        )

    def _calculate_fcf_yield(self, free_cash_flow: float, summary: Dict) -> FCFYieldMetric:
        """Calculate FCF Yield: FCF / Enterprise Value"""
        # Estimate enterprise value as 10x operating cash flow (simplified)
        enterprise_value = summary.get('totalCashFlow', 0) * 10

        if enterprise_value > 0:
            fcf_yield_pct = (free_cash_flow / enterprise_value) * 100
        else:
            fcf_yield_pct = 0

        # Determine status based on PE targets (15-20% is excellent)
        if fcf_yield_pct >= 15:
            status = "excellent"
        elif fcf_yield_pct >= 10:
            status = "good"
        else:
            status = "poor"

        return FCFYieldMetric(
            value=round(fcf_yield_pct, 2),
            target=15.0,
            status=status
        )

    def _calculate_cash_roic(self, free_cash_flow: float, operating_flow: float) -> CashROICMetric:
        """Calculate Cash ROIC: Operating FCF / Invested Capital"""
        # Estimate invested capital as 5x operating cash flow (simplified)
        invested_capital = operating_flow * 5 if operating_flow > 0 else 1

        cash_roic_pct = (free_cash_flow / invested_capital) * 100
        wacc = 10.0  # Assumed WACC of 10%
        spread = cash_roic_pct - wacc

        return CashROICMetric(
            value=round(cash_roic_pct, 2),
            wacc=wacc,
            spread=round(spread, 2)
        )

    def _calculate_cash_conversion_quality(self, operating_flow: float, summary: Dict) -> CashConversionQualityMetric:
        """Calculate Cash Conversion Quality: (OCF - One-time items) / EBITDA"""
        # Estimate EBITDA from operating cash flow (OCF is typically 80% of EBITDA)
        ebitda = operating_flow / 0.8 if operating_flow else 0

        # Assume 95% is sustainable (5% one-time items)
        sustainable_ocf = operating_flow * 0.95

        if ebitda > 0:
            quality_score = (sustainable_ocf / ebitda) * 100
        else:
            quality_score = 0

        # Clamp to 0-100 range
        quality_score = max(0, min(100, quality_score))

        # Determine quality level
        if quality_score >= 80:
            quality = "high"
        elif quality_score >= 60:
            quality = "medium"
        else:
            quality = "low"

        return CashConversionQualityMetric(
            score=round(quality_score, 1),
            quality=quality
        )

    def _calculate_liquidity_coverage(self, total_cash_flow: float, operating_flow: float) -> LiquidityCoverageMetric:
        """Calculate Liquidity Coverage Ratio: Liquid Assets / 30-day cash needs"""
        # Estimate liquid assets as current cash position (from operating flow)
        liquid_assets = max(operating_flow, 0)

        # Estimate 30-day cash needs as 1/12 of annual operating flow
        monthly_needs = abs(operating_flow) / 12 if operating_flow else 1

        if monthly_needs > 0:
            lcr = liquid_assets / monthly_needs
        else:
            lcr = 0

        # Determine status based on thresholds
        if lcr >= 2.0:
            status = "strong"
        elif lcr >= 1.5:
            status = "adequate"
        else:
            status = "weak"

        return LiquidityCoverageMetric(
            ratio=round(lcr, 2),
            threshold=2.0,
            status=status
        )

    def _calculate_ma_firepower(self, free_cash_flow: float) -> MAFirepowerMetric:
        """Calculate M&A Firepower: Sustainable FCF × Target leverage"""
        # Assume 3x leverage capacity for M&A
        leverage_multiple = 3.0
        ma_capacity = max(free_cash_flow, 0) * leverage_multiple

        # Determine capacity level
        if ma_capacity >= 1_000_000_000:  # $1B+
            capacity = "high"
        elif ma_capacity >= 100_000_000:  # $100M+
            capacity = "medium"
        else:
            capacity = "limited"

        return MAFirepowerMetric(
            amount=round(ma_capacity, 2),
            capacity=capacity
        )

    def _prepare_trends(self, trends: List[Dict]) -> List[CashFlowTrend]:
        """Prepare trend data"""

        return [
            CashFlowTrend(
                date=t['date'],
                operating=t['operating'],
                investing=t['investing'],
                financing=t['financing'],
                net=t['net']
            )
            for t in trends
        ]

    def _prepare_operating_breakdown(self, by_category: List[Dict]) -> List[OperatingCashFlowDetail]:
        """Prepare operating cash flow breakdown"""

        return [
            OperatingCashFlowDetail(
                category=cat['category'],
                inflow=cat['inflow'],
                outflow=cat['outflow'],
                net=cat['net']
            )
            for cat in by_category[:10]  # Top 10 categories
        ]

    def _prepare_investing_breakdown(self, by_category: List[Dict]) -> List[InvestingCashFlowDetail]:
        """Prepare investing cash flow breakdown (simulated)"""

        # Simulate investing activities from top categories
        investing_categories = [
            {"category": "Equipment Purchases", "amount": -50000, "type": "outflow"},
            {"category": "Asset Sales", "amount": 15000, "type": "inflow"},
            {"category": "Investments", "amount": -25000, "type": "outflow"}
        ]

        return [
            InvestingCashFlowDetail(
                category=cat['category'],
                amount=cat['amount'],
                type=cat['type']
            )
            for cat in investing_categories
        ]

    def _prepare_financing_breakdown(self, by_category: List[Dict]) -> List[FinancingCashFlowDetail]:
        """Prepare financing cash flow breakdown (simulated)"""

        # Simulate financing activities
        financing_categories = [
            {"category": "Loan Proceeds", "amount": 100000, "type": "inflow"},
            {"category": "Loan Payments", "amount": -30000, "type": "outflow"},
            {"category": "Dividends Paid", "amount": -10000, "type": "outflow"}
        ]

        return [
            FinancingCashFlowDetail(
                category=cat['category'],
                amount=cat['amount'],
                type=cat['type']
            )
            for cat in financing_categories
        ]

    def _generate_projections(self, trends: List[Dict]) -> List[CashFlowProjection]:
        """Generate cash flow projections"""

        if not trends or len(trends) < 3:
            return []

        # Use last 6 months as historical, project next 3 months
        historical = trends[-6:] if len(trends) >= 6 else trends
        last_value = historical[-1]['net'] if historical else 0

        projections = []

        # Add historical data
        for trend in historical:
            projections.append(CashFlowProjection(
                month=trend['date'],
                historical=trend['net'],
                projected=None,
                optimistic=None,
                pessimistic=None
            ))

        # Generate 3 months of projections
        growth_rate = 0.05  # 5% growth assumption
        for i in range(1, 4):
            projected_value = last_value * (1 + growth_rate * i)
            optimistic_value = projected_value * 1.15
            pessimistic_value = projected_value * 0.85

            # Generate future month (simplified)
            last_date = historical[-1]['date'] if historical else '2021-12'
            # Simple month increment (not production-ready)
            year, month = map(int, last_date.split('-'))
            month += i
            if month > 12:
                year += 1
                month -= 12
            future_month = f"{year}-{month:02d}"

            projections.append(CashFlowProjection(
                month=future_month,
                historical=None,
                projected=projected_value,
                optimistic=optimistic_value,
                pessimistic=pessimistic_value
            ))

        return projections

    def _generate_insights(self, kpis: dict, summary: dict, operating_cf: dict, by_category: list) -> list:
        """Generate AI insights based on data"""
        insights = []

        # Net cash flow insights
        net_cf = kpis.get('netCashFlow', 0)
        if net_cf > 0:
            insights.append({
                'type': 'positive',
                'message': f"Positive net cash flow of ${net_cf:,.0f} indicates healthy liquidity"
            })
        elif net_cf < -50000:
            insights.append({
                'type': 'warning',
                'message': f"Negative cash flow of ${abs(net_cf):,.0f} requires attention"
            })

        # Operating cash flow insights
        operating = kpis.get('operatingCashFlow', 0)
        if operating > 500000:
            insights.append({
                'type': 'positive',
                'message': f"Strong operating cash flow at ${operating:,.0f}"
            })
        elif operating < 100000:
            insights.append({
                'type': 'info',
                'message': f"Operating cash flow at ${operating:,.0f} - consider optimization"
            })

        # Free cash flow insights
        fcf = kpis.get('freeCashFlow', 0)
        if fcf > 0:
            insights.append({
                'type': 'positive',
                'message': f"Free cash flow of ${fcf:,.0f} available for growth and dividends"
            })
        else:
            insights.append({
                'type': 'warning',
                'message': f"Negative free cash flow may limit investment capacity"
            })

        # Cash ratio insight
        cash_ratio = kpis.get('cashRatio', 0)
        if cash_ratio > 2:
            insights.append({
                'type': 'positive',
                'message': f"Strong cash ratio of {cash_ratio:.2f} indicates good liquidity coverage"
            })
        elif cash_ratio < 1:
            insights.append({
                'type': 'warning',
                'message': f"Low cash ratio of {cash_ratio:.2f} may indicate liquidity risk"
            })

        # Category insights
        if by_category and len(by_category) > 0:
            top_category = by_category[0]
            insights.append({
                'type': 'info',
                'message': f"Top cash flow category: {top_category['category']} with ${top_category['net']:,.0f}"
            })

        return insights

    async def analyze_cash_flow(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze cash flow with insights"""
        return await self.get_dashboard_data(filters)
