# Google Agent Development Kit (ADK) - Multi-Agent Orchestration System

## Overview

This directory contains a sophisticated multi-agent AI system built with Google's Agent Development Kit (ADK). The system uses an orchestration agent that intelligently delegates tasks to specialized sub-agents, each responsible for a specific business domain.

## Architecture

### Orchestration Agent
The root orchestration agent (`orchestration_agent/agent.py`) acts as the central coordinator:
- Decomposes high-level user requests into subtasks
- Routes subtasks to appropriate specialized agents
- Aggregates responses from multiple agents
- Maintains context across the conversation

### Specialized Sub-Agents

1. **Customer Insights Agent**
   - 12 analytical tools for customer behavior analysis
   - Handles segmentation, churn prediction, LTV, and engagement

2. **Sales Analyst Agent**
   - 5 tools for sales performance analysis
   - Regional analysis, product performance, demand forecasting

3. **Financial Agent**
   - Cash flow analysis and revenue forecasting
   - Financial metrics and reporting

4. **Inventory Manager Agent**
   - Stock optimization and inventory analysis
   - Holding cost analysis and slow-moving item detection

## Directory Structure

```
adk/
├── orchestration_agent/      # Main orchestration system
│   ├── agent.py             # Root orchestration agent
│   ├── prompt.py            # Agent instructions
│   ├── tools/               # Integrated analytical tools
│   │   ├── customer_*.py    # Customer domain tools
│   │   ├── financial_*.py   # Financial tools
│   │   ├── inventory_manager/ # Inventory tools
│   │   └── sales_analyst/   # Sales tools
│   ├── database/            # Database connections
│   │   ├── customers.db
│   │   ├── sales_agent.db
│   │   ├── financial_agent.db
│   │   └── inventory.db
│   └── utils/               # Utility functions
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
└── start.sh                # Startup script
```

## Key Features

### 1. Never-Ask Philosophy
All agents follow a "never ask for parameters" principle:
- Use provided values or industry-standard defaults
- Proceed immediately with analysis
- Default time periods to last complete period
- Include all segments/categories unless specified

### 2. Voice Interface Optimization
- Dual output format: text and speak
- Speak output optimized for natural conversation
- Progress updates during tool execution
- Engaging and interactive responses

### 3. Intelligent Tool Selection
- Orchestrator decomposes requests into subtasks
- Each subtask mapped to best-suited agent
- Parallel execution where possible
- Context maintained across tool calls

### 4. Error Handling
- Automatic retry logic built into orchestrator
- Agents return structured error responses
- Configurable retry limits with graceful degradation

## Setup Instructions

### Prerequisites
- Python 3.8+
- Google ADK SDK
- Required Python packages (see requirements.txt)

### 1. Set up Virtual Environment

```bash
# Create a virtual environment
python3 -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 2. Install Required Packages

```bash
# Install all dependencies from requirements.txt
pip3 install -r requirements.txt
```

### 3. Set up Database Files

The application requires specific database files to function properly.

```bash
# Run the database setup script to download required files
python3 setup_db.py
```

This script will:
- Download database files from Google Drive (if configured)
- Place them in the correct location in the project structure
- Initialize database schemas

### 4. Configure Environment Variables

Create a `.env` file in the `orchestration_agent` directory:

```env
# Google AI Configuration
GOOGLE_GENAI_USE_VERTEXAI="False"
GOOGLE_API_KEY="your_gemini_api_key"

# Model Configuration (optional)
MODEL="gemini-2.5-flash"  # or your preferred model
MODEL_PROVIDER="gemini"   # or "groq", "cerebras"
```

## Running the Application

### Using ADK CLI

```bash
adk web
```

Then visit http://localhost:8000 to interact with the agent.

### Using Python directly

```bash
python main.py
```

The agent will be available at `http://localhost:8001`

### Using the startup script

```bash
./start.sh
```

## API Endpoints

### `/run_sse` (POST)
Main endpoint for AI interactions
- Request: `{ "user_query": "your question here" }`
- Response: Server-Sent Events stream with AI responses

### `/health` (GET)
Health check endpoint

## Tool Integration

Each tool follows a standard pattern:
```python
def tool_function(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    # other parameters with defaults
) -> Dict:
    """
    Tool description.
    
    Returns:
        Dict containing:
        - status: 'success' or 'error'
        - data: Analysis results
        - summary: Text summary
        - insights: Key findings list
    """
```

## Database Schema

Each agent has its own SQLite database:
- `customers.db` - Customer transaction and behavior data
- `sales_agent.db` - Sales transactions and product catalog
- `financial_agent.db` - Financial metrics and cash flow
- `inventory.db` - Stock levels and inventory movements

## Model Configuration

Supports multiple model providers:
- **Gemini** (default): Google's Gemini models
- **Groq**: Fast inference with Groq Cloud
- **Cerebras**: High-performance inference

## Development

### Adding New Tools
1. Create tool file in `orchestration_agent/tools/`
2. Import in relevant agent file
3. Register with agent's tool list
4. Update agent instructions if needed

### Adding New Agents
1. Create agent directory in `orchestration_agent/sub_agents/`
2. Define agent instructions in `prompt.py`
3. Import tools and create agent instance
4. Add to orchestrator's agent list

## Monitoring and Logs

- Logs written to `financial_tools.log` and other domain-specific logs
- Structured logging with timestamps and levels
- Error tracking and performance metrics

## Best Practices

1. **Tool Design**: Keep tools focused and single-purpose
2. **Error Handling**: Always return structured error responses
3. **Defaults**: Provide sensible defaults for all parameters
4. **Documentation**: Document all tools with clear descriptions
5. **Testing**: Include unit tests for each tool

## Related Documentation

- [Main AI Documentation](../../AI_DOCS.md)
- [Tool Implementation Guide](../web/TOOL_IMPLEMENTATION_PROCESS.md)
- [Web Application](../web/README.md)
- [Tool List](./tool_list.md)