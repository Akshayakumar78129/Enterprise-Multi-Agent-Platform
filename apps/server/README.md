# Backend Server - AI Request Handler

## Overview

This directory contains the backend server that acts as the bridge between the web application and the ADK orchestration system. It handles AI requests from the frontend and streams responses back using Server-Sent Events (SSE).

## Architecture

The server provides:
- RESTful API endpoints for the frontend
- SSE streaming for real-time AI responses
- Integration with ADK orchestration agent
- Request/response transformation

## Directory Structure

```
server/
├── main.py              # Main server application
├── requirements.txt     # Python dependencies
├── package.json        # Node.js dependencies (if any)
├── dev.sh             # Development startup script
└── start.sh           # Production startup script
```

## Key Features

### Server-Sent Events (SSE)
- Real-time streaming of AI responses
- Maintains persistent connection with client
- Handles connection drops and reconnection
- Streams partial responses as they're generated

### Request Processing
- Receives user queries from frontend
- Forwards to ADK orchestration agent
- Transforms responses for frontend consumption
- Handles errors gracefully

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Configuration

Set environment variables as needed:
```bash
export PORT=5000  # Server port (default: 5000)
export ADK_URL=http://localhost:8001  # ADK orchestration URL
```

## Running the Server

### Development Mode
```bash
./dev.sh
# or
python main.py
```

### Production Mode
```bash
./start.sh
```

The server runs on `http://localhost:5000` by default.

## API Endpoints

### POST `/run_sse`
Main endpoint for AI interactions via SSE
- **Request Body**: 
  ```json
  {
    "user_query": "Your question here"
  }
  ```
- **Response**: Server-Sent Events stream
  ```
  data: {"adk_last_response": "AI response", "visualization_output": [...]}
  ```

### GET `/health`
Health check endpoint
- **Response**: `{ "status": "healthy" }`

## SSE Response Format

The server streams responses in this format:
```
event: message
data: {
  "adk_last_response": "AI text response",
  "visualization_output": [
    {
      "toolname": "tool-name",
      "componentName": "component",
      "body": { /* component props */ }
    }
  ]
}
```

## Integration with ADK

The server communicates with the ADK orchestration agent:
1. Forwards user queries to ADK endpoint
2. Receives streaming responses
3. Transforms for frontend consumption
4. Handles connection management

## Error Handling

- Graceful error responses
- Connection retry logic
- Timeout handling
- Structured error messages

## Logging

- Request/response logging
- Error tracking
- Performance metrics
- Debug mode available

## Development Tips

### Testing SSE
```bash
# Test SSE endpoint
curl -X POST http://localhost:5000/run_sse \
  -H "Content-Type: application/json" \
  -d '{"user_query": "test query"}' \
  -H "Accept: text/event-stream"
```

### Debugging
Enable debug mode:
```bash
export DEBUG=true
python main.py
```

## Performance Considerations

- Connection pooling for ADK requests
- Response streaming to reduce memory usage
- Timeout configuration for long-running queries
- Rate limiting for protection

## Security

- CORS configuration for frontend access
- Input validation and sanitization
- API key authentication (if configured)
- Rate limiting to prevent abuse

## Deployment

### Docker
```dockerfile
FROM python:3.8
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Environment Variables
- `PORT` - Server port
- `ADK_URL` - ADK orchestration URL
- `CORS_ORIGIN` - Allowed CORS origins
- `MAX_CONNECTIONS` - Maximum SSE connections

## Monitoring

- Health check endpoint for uptime monitoring
- Metrics endpoint (if configured)
- Log aggregation support
- Error alerting integration

## Related Documentation

- [ADK Orchestration](../adk/README.md)
- [Web Application](../web/README.md)
- [Main Documentation](../../AI_DOCS.md)