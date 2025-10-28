"""API Schema for sales trends endpoints"""

from pydantic import BaseModel, Field
from typing import Optional, List
from .models import SalesTrendFilters, SalesTrendResponse


class SalesTrendsSummaryRequest(BaseModel):
    """Request model for sales trends summary endpoint"""
    filters: Optional[SalesTrendFilters] = Field(default_factory=SalesTrendFilters)


class SalesTrendsSummaryResponse(BaseModel):
    """Response model for sales trends summary endpoint"""
    success: bool = True
    data: SalesTrendResponse
    message: Optional[str] = None
