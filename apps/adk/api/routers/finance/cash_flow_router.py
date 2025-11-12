"""API endpoints for cash flow analysis"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import importlib
import sys

# Force reload of modules to get latest code
if 'domains.cash_flow.data_service' in sys.modules:
    importlib.reload(sys.modules['domains.cash_flow.data_service'])
if 'domains.cash_flow.processing_service' in sys.modules:
    importlib.reload(sys.modules['domains.cash_flow.processing_service'])
if 'domains.cash_flow.schema' in sys.modules:
    importlib.reload(sys.modules['domains.cash_flow.schema'])

from domains.finance.cash_flow.processing_service import CashFlowProcessingService
from domains.finance.cash_flow.models import CashFlowFilters

router = APIRouter(prefix="/api/cash-flow", tags=["cash-flow"])
processing_service = CashFlowProcessingService()


class CashFlowRequestFilters(BaseModel):
    """Filters for cash flow analysis"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    cashFlowType: Optional[str] = None  # operating, investing, financing, all
    departments: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    minAmount: Optional[float] = None


@router.post("/summary")
async def get_dashboard_summary(filters: CashFlowRequestFilters, request: Request):
    """Main dashboard endpoint - returns all cash flow metrics (POST with filters)"""
    try:
        # Create fresh service instance to avoid stale module cache
        service = CashFlowProcessingService()

        # Convert Pydantic model to dict for processing service
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.cashFlowType:
            filter_dict['cashFlowType'] = filters.cashFlowType
        if filters.departments and len(filters.departments) > 0:
            filter_dict['departments'] = filters.departments
        if filters.regions and len(filters.regions) > 0:
            filter_dict['regions'] = filters.regions
        if filters.minAmount is not None:
            filter_dict['minAmount'] = filters.minAmount

        result = await service.get_dashboard_data(filter_dict)
        return result
    except Exception as e:
        print(f"[CashFlowRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_dashboard(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    cashFlowType: Optional[str] = Query(None),
    department: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None),
    minAmount: Optional[float] = Query(None)
) -> Dict[str, Any]:
    """Get cash flow dashboard data"""
    try:
        filters = {}

        # Build date range filter
        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        # Add other filters
        if cashFlowType:
            filters['cashFlowType'] = cashFlowType
        if department:
            filters['departments'] = department
        if region:
            filters['regions'] = region
        if minAmount is not None:
            filters['minAmount'] = minAmount

        result = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze")
async def analyze_cash_flow(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    cashFlowType: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Analyze cash flow with insights"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if cashFlowType:
            filters['cashFlowType'] = cashFlowType

        result = await processing_service.analyze_cash_flow(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_kpis(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get cash flow KPIs"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('kpiMetrics', {})}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_trends(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get cash flow trends"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('trends', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/operating")
async def get_operating_cash_flow(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get operating cash flow breakdown"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('operating', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/investing")
async def get_investing_cash_flow(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get investing cash flow breakdown"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('investing', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/financing")
async def get_financing_cash_flow(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get financing cash flow breakdown"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('financing', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projection")
async def get_projection(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get cash flow projection"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('projection', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions")
async def get_transactions(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
) -> Dict[str, Any]:
    """Get cash flow transactions"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        transactions = data.get('mainData', {}).get('transactions', [])
        return {"success": True, "data": transactions[:limit]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
