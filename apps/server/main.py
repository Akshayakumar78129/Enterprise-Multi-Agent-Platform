from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
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

AGENT_BASE_URL = os.getenv("AGENT_BASE_URL")
AGENT_RUN_URL = f"{AGENT_BASE_URL}/run_sse"

@app.post("/run_sse")
async def run_sse(request: Request):
    data = await request.json()

    new_message = data.get("user_query", "")
    app_name = data.get("app_name", "orchestration_agent")
    session_id = data.get("session_id", "test123")
    user_id = data.get("user_id", "ari")

    if not new_message:
        return JSONResponse(content={"error": "No new message"}, status_code=400)

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

    async def event_generator():
        try:
            timeout = httpx.Timeout(300.0, read=300.0)  # 5 minute timeout
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream('POST', AGENT_RUN_URL, json=request) as response:
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)