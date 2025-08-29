from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
import uvicorn
import httpx
load_dotenv()


ALLOWED_ORIGINS = [
    "http://localhost",
    "*",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_BASE_URL = os.getenv("AGENT_BASE_URL", "http://127.0.0.1:8002").rstrip("/")
AGENT_RUN_URL = f"{AGENT_BASE_URL}/run_sse"
SINGLE_AGENT_RUN_URL = f"{AGENT_BASE_URL}/run_sse_agent"

@app.post("/run_sse")
async def run_sse(request: Request):
    data = await request.json()

    new_message = data.get("user_query", "")
    app_name = data.get("app_name", "orchestration_agent")
    session_id = data.get("session_id", "")
    user_id = data.get("user_id", "")
    is_canvas = data.get("is_canvas", False)
    # print(data)

    if not new_message and not app_name and not session_id and not user_id:
        return JSONResponse(content={"error": "No new message, app_name, session_id, or user_id"}, status_code=400)

    try:
        session = requests.get(f"{AGENT_BASE_URL}/apps/{app_name}/users/{user_id}/sessions/{session_id}")
        print(session.json())
        session = session.json()
        if not session:
            print("Creating session")
            session_response = requests.post(f"{AGENT_BASE_URL}/apps/{app_name}/users/{user_id}/sessions/{session_id}")
            if session_response.status_code != 200:
                return JSONResponse(content={"error": "Failed to create session"}, status_code=400)
        else:
            print("Session already exists")
    except Exception as e:
        print("Creating session")
        response = requests.post(f"{AGENT_BASE_URL}/apps/{app_name}/users/{user_id}/sessions/{session_id}", json=data)
        if response.status_code != 200:
            return JSONResponse(content={"error": "Failed to create session"}, status_code=400)

    request = {
        "app_name": app_name,
        "session_id": session_id,
        "user_id": user_id,
        "new_message": {
            "role": "user",
            "parts": [
                {
                    "text": new_message
                }
            ]
        }
    }
    print(request)

    RUN_URL = AGENT_RUN_URL if is_canvas else SINGLE_AGENT_RUN_URL

    async def event_generator():
        try:
            timeout = httpx.Timeout(300.0, read=300.0)  # 5 minute timeout
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream('POST', RUN_URL, json=request) as response:
                    print(response)
                    if response.status_code != 200:
                        yield f"data: {{\"error\": \"HTTP {response.status_code}\"}}\n\n"
                        return
                    response.raise_for_status()
                    async for chunk in response.aiter_text():
                        if chunk.strip():
                            # print(chunk)
                            yield chunk
        except httpx.TimeoutException:
            yield "data: {\"error\": \"Request timeout\"}\n\n"
        except httpx.HTTPStatusError as e:
            yield f"data: {{\"error\": \"HTTP {e.response.status_code}\"}}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
        finally:
            yield "data: [DONE]\n\n"
        
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
# ---- Performance Deviation ML endpoint (ADD-ONLY) ----
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import r2_score

class _PDPoint(BaseModel):
    t: str
    y: float
    dow: Optional[int] = None
    moy: Optional[int] = None
    is_weekend: Optional[int] = None
    eom: Optional[int] = None

class _PDRequest(BaseModel):
    kpi: str
    horizon: int = 0
    series: List[_PDPoint]

@app.post("/pd/predict")
def pd_predict(req: _PDRequest):
    df = pd.DataFrame([p.dict() for p in req.series])
    if df.empty or "y" not in df:
        return {"ok": False, "error": "empty series"}

    df["t"] = pd.to_datetime(df["t"])
    df.sort_values("t", inplace=True)

    if "dow" not in df or df["dow"].isna().any():
        df["dow"] = df["t"].dt.dayofweek
    if "moy" not in df or df["moy"].isna().any():
        df["moy"] = df["t"].dt.month
    if "is_weekend" not in df or df["is_weekend"].isna().any():
        df["is_weekend"] = (df["dow"] >= 5).astype(int)
    if "eom" not in df or df["eom"].isna().any():
        df["eom"] = (df["t"] == (df["t"] + pd.offsets.MonthEnd(0))).astype(int)

    X = df[["dow","moy","is_weekend","eom"]].values
    y = df["y"].values

    model = GradientBoostingRegressor(random_state=42)
    model.fit(X, y)
    pred = model.predict(X)

    resid = y - pred
    sigma = float(np.std(resid)) if len(resid) > 1 else 0.0
    lower = (pred - 1.96*sigma).tolist()
    upper = (pred + 1.96*sigma).tolist()

    r2 = float(r2_score(y, pred)) if len(y) > 2 else 0.0
    imps = model.feature_importances_.tolist()
    features = ["dow","moy","is_weekend","eom"]

    return {
        "ok": True,
        "r2": r2,
        "sigma": sigma,
        "pred": pred.tolist(),
        "lower": lower,
        "upper": upper,
        "importances": [{"feature": f, "importance": float(v)} for f, v in zip(features, imps)]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)