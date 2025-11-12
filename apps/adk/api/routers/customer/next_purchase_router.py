"""
Next Purchase Predictor API Router
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from typing import Dict
import logging
import json
import numpy as np
import pandas as pd

from domains.customer.next_purchase.processing_service import NextPurchaseService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/next-purchase", tags=["next-purchase"])
service = NextPurchaseService()


def convert_numpy_types(obj):
    """Recursively convert numpy types to native Python types, including dict keys"""
    if isinstance(obj, dict):
        # Convert both keys AND values
        return {
            convert_numpy_types(key): convert_numpy_types(value)
            for key, value in obj.items()
        }
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return convert_numpy_types(obj.tolist())
    elif isinstance(obj, (pd.Timestamp)):
        return obj.isoformat() if hasattr(obj, 'isoformat') else str(obj)
    elif pd.isna(obj):
        return None
    elif hasattr(obj, 'item'):  # Catch any remaining numpy scalars
        return obj.item()
    else:
        return obj


@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}):
    """Get Next Purchase Predictor dashboard summary"""
    try:
        result = await service.get_dashboard_summary(filters)

        # Convert all numpy types (including dict keys) before JSON serialization
        clean_result = convert_numpy_types(result)

        # Now safe to use regular json.dumps
        json_str = json.dumps(clean_result)
        return Response(content=json_str, media_type="application/json")
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-cache")
async def clear_cache():
    """Clear the cache for next-purchase dashboard"""
    try:
        from domains.common.simple_cache import simple_cache
        # Clear all next-purchase related cache entries
        cleared_count = 0
        keys_to_delete = [k for k in simple_cache._cache.keys() if 'next-purchase' in k or 'next_purchase' in k]
        for key in keys_to_delete:
            del simple_cache._cache[key]
            cleared_count += 1
        return {"status": "success", "cleared": cleared_count, "message": f"Cleared {cleared_count} cache entries"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "next-purchase"}
