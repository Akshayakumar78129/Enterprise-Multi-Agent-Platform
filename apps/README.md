# Applications Directory

This directory contains all the applications that make up the Enterprise IQ Data Analytics Platform.

## Directory Structure

### 📁 `/adk/`
**Google Agent Development Kit (ADK) Implementation**
- Multi-agent orchestration system using Google's ADK
- Orchestration agent that delegates to specialized sub-agents
- Python-based analytical tools integrated with AI agents
- Database connections for customer, sales, inventory, and financial data

### 📁 `/web/`
**Main Web Application**
- Next.js/React frontend application
- AI-driven canvas interface for dynamic visualization spawning
- Business domain tools organized into Customer, Sales, Inventory, and Finance
- Redux state management for complex data flows
- API gateway for enterprise system integration

### 📁 `/server/`
**Backend Server**
- Python-based server for handling AI requests
- Server-Sent Events (SSE) for real-time AI responses
- Integration point between frontend and ADK orchestration

## Architecture Overview

```
User Interface (web/) <--SSE--> Server (server/) <--> ADK Orchestration (adk/)
                          |                              |
                          |                              v
                          |                     Sub-Agents & Tools
                          |                              |
                          v                              v
                    API Gateway <-------------> Databases (SQLite)
```

## Key Features

1. **AI-Driven UI**: The platform uses AI to dynamically spawn and control visualization components
2. **Multi-Agent System**: Specialized agents handle different business domains
3. **Real-time Communication**: SSE enables streaming AI responses
4. **Modular Architecture**: Clear separation between frontend, backend, and AI orchestration

## Getting Started

Each subdirectory contains its own README with specific setup instructions:
- [ADK Setup](./adk/README.md) - Configure the AI orchestration system
- [Web App Setup](./web/README.md) - Set up the frontend application
- [Server Setup](./server/README.md) - Configure the backend server

## Technology Stack

- **Frontend**: Next.js, React, Redux, TypeScript
- **Backend**: Python, FastAPI/Flask
- **AI**: Google ADK, Gemini AI, Multi-agent orchestration
- **Databases**: SQLite for domain-specific data
- **Visualization**: Plotly.js, D3.js

## Development Workflow

1. Start the ADK orchestration agent (port 8001)
2. Start the backend server (port 5000)
3. Start the web application (port 3000)
4. Access the platform at http://localhost:3000

## Related Documentation

- [AI System Documentation](../AI_DOCS.md) - Comprehensive AI system overview
- [API Gateway Documentation](./web/api-gateway/README.md) - Enterprise integration details
- [Tool Implementation Guide](./web/TOOL_IMPLEMENTATION_PROCESS.md) - Adding new analytical tools