# Orchestration Agent - Multi-Agent Coordination System

## Overview

The orchestration_agent directory contains the core multi-agent system that powers the Enterprise IQ platform's AI capabilities. Built with Google's Agent Development Kit (ADK), it implements a sophisticated orchestration pattern where a root agent intelligently delegates tasks to specialized sub-agents.

## Architecture

### Hierarchical Agent Structure

```
Root Orchestration Agent
├── Customer Insights Agent (12 tools)
├── Sales Analyst Agent (5 tools)
├── Financial Agent (2 tools)
└── Inventory Manager Agent (4 tools)
```

### Key Components

1. **Root Orchestrator** (`agent.py`)
   - Decomposes complex user requests
   - Routes subtasks to appropriate sub-agents
   - Aggregates and synthesizes responses
   - Maintains conversation context

2. **Agent Instructions** (`prompt.py`)
   - Detailed instructions for each agent
   - Never-ask philosophy implementation
   - Default parameter specifications
   - Output format definitions

3. **Tool Integration** (`tools/`)
   - 23+ analytical tools across domains
   - Unified interface for all tools
   - Consistent error handling
   - Visualization support

## Directory Structure

```
orchestration_agent/
├── agent.py                    # Root orchestration agent
├── prompt.py                   # Agent instructions
├── __init__.py
├── sub_agents/                 # Sub-agent implementations
│   └── __init__.py
├── tools/                      # Integrated analytical tools
│   ├── __init__.py
│   ├── anomaly_detection.py
│   ├── churn_prediction.py
│   ├── customer_behaviour.py
│   ├── customer_lifetime_value.py
│   ├── customer_segmentation.py
│   ├── engagement_classifier.py
│   ├── financial_tool.py
│   ├── inventory_manager/
│   │   ├── InventoryHoldingCostAnalyzer.py
│   │   ├── InventoryLevelAnalyzer.py
│   │   ├── SlowMovingInventoryAnalyzer.py
│   │   └── StockOptimizationRecommender.py
│   ├── next_purchase.py
│   ├── next_purchase_predictor.py
│   ├── performance_deviation.py
│   ├── purchase_frequency.py
│   ├── retention_planner.py
│   ├── sales_analyst/
│   │   ├── tools/
│   │   │   ├── DemandForecastEngine.py
│   │   │   ├── ProductPerformanceAnalyzer.py
│   │   │   ├── RegionalSalesAnalyzer.py
│   │   │   ├── SalesPerformanceAnalyzer.py
│   │   │   └── SalesTrendAnalyzer.py
│   │   └── utils/
│   └── transaction_patterns.py
├── database/                   # Database connections
│   ├── connector.py
│   ├── column_mapping.py
│   ├── customers.db
│   ├── sales_agent.db
│   ├── financial_agent.db
│   └── inventory.db
├── utils/                      # Utility functions
│   ├── async_processing.py
│   ├── caching.py
│   ├── config_manager.py
│   ├── error_handling.py
│   ├── health_monitor.py
│   ├── logging_config.py
│   └── tool_registry.py
└── data/                       # Generated reports
    └── reports/
```

## Agent Instructions Philosophy

### Never-Ask Principle
All agents follow a strict "never ask for parameters" rule:
- Use provided values or industry-standard defaults
- Proceed immediately with analysis
- Make intelligent assumptions based on context
- Provide results first, refinements later

### Default Parameters

#### Customer Insights Agent
```python
DEFAULT_TIMEFRAME = "2017-2021"  # Historical analysis period
DEFAULT_SEGMENTS = "all"         # Include all segments
DEFAULT_CONFIDENCE = 0.95        # 95% confidence level
```

#### Sales Analyst Agent
```python
DEFAULT_PERIOD = "last_12_months"
DEFAULT_DIMENSION = "product"
DEFAULT_METRIC = "revenue"
DEFAULT_TOP_N = 10
```

#### Financial Agent
```python
DEFAULT_FORECAST_DAYS = 30
DEFAULT_PERIOD = "month"
```

#### Inventory Manager Agent
```python
DEFAULT_SERVICE_LEVEL = 0.95     # 95% service level
DEFAULT_HOLDING_COST = 0.25      # 25% annual
DEFAULT_AGING_THRESHOLD = 180    # Days
```

## Tool Integration

### Tool Registration Pattern
```python
# In agent.py
from orchestration_agent.tools.customer_behaviour import analyze_customer_behavior

# Register with Customer Insights Agent
customer_agent = Agent(
    name="customer_insights_agent",
    model=model,
    instruction=CUSTOMER_INSTR,
    tools=[
        analyze_customer_behavior,
        # ... other tools
    ]
)
```

### Tool Response Format
```python
{
    "status": "success",
    "data": {...},           # Analysis results
    "summary": "...",        # Text summary
    "insights": [...],       # Key findings
    "visualization": {...},  # Optional chart data
    "recommendations": [...] # Action items
}
```

## Sub-Agent Capabilities

### Customer Insights Agent
**Specializes in**: Customer analytics, behavior patterns, segmentation
**Tools**: 12
- Anomaly detection
- Churn prediction
- Customer behavior analysis
- Lifetime value prediction
- Segmentation
- Engagement classification
- Next purchase prediction
- Performance deviation analysis
- Purchase frequency analysis
- Retention planning
- Transaction pattern analysis

### Sales Analyst Agent
**Specializes in**: Sales performance, forecasting, regional analysis
**Tools**: 5
- Demand forecasting
- Product performance analysis
- Regional sales analysis
- Sales performance analysis
- Sales trend analysis

### Financial Agent
**Specializes in**: Financial metrics, cash flow, revenue forecasting
**Tools**: 2
- Cash flow analysis
- Revenue forecasting

### Inventory Manager Agent
**Specializes in**: Stock optimization, inventory costs, reorder planning
**Tools**: 4
- Holding cost analysis
- Inventory level monitoring
- Slow-moving item detection
- Stock optimization recommendations

## Output Schema

### Dual Output Format
```python
class OutputSchema(BaseModel):
    text: str = Field(
        description="Text output for chat interface"
    )
    speak: str = Field(
        description="Voice-optimized output for audio interface"
    )
```

### Voice Interface Optimization
- Conversational tone in `speak` output
- Progress updates during processing
- Natural language responses
- Engaging and interactive style

## Database Architecture

### Database Files
- `customers.db` - Customer data and transactions
- `sales_agent.db` - Sales and product data
- `financial_agent.db` - Financial records
- `inventory.db` - Inventory and stock data

### Connection Management
```python
from orchestration_agent.database.connector import get_connection

conn = get_connection('customers.db')
```

## Utility Functions

### Caching (`utils/caching.py`)
- Result caching for expensive operations
- TTL-based cache invalidation
- Memory-efficient storage

### Error Handling (`utils/error_handling.py`)
- Structured error responses
- Automatic retry logic
- Graceful degradation

### Health Monitoring (`utils/health_monitor.py`)
- Agent health checks
- Tool availability monitoring
- Database connection status

### Tool Registry (`utils/tool_registry.py`)
- Dynamic tool registration
- Priority-based selection
- Capability discovery

## Configuration

### Environment Variables
```bash
# Model configuration
MODEL="gemini-2.5-flash"
MODEL_PROVIDER="gemini"  # or "groq", "cerebras"

# API keys
GOOGLE_API_KEY="your-key"
GOOGLE_GENAI_USE_VERTEXAI="False"

# Performance
CACHE_TTL=300
MAX_RETRIES=3
TIMEOUT=30
```

## Usage Examples

### Basic Query Processing
```python
from orchestration_agent.agent import root_agent

response = await root_agent.run(
    "Analyze customer churn risk for high-value segments"
)
```

### Multi-Agent Coordination
```python
# Complex query requiring multiple agents
response = await root_agent.run(
    "Compare sales performance with inventory costs and identify optimization opportunities"
)
# Orchestrator will:
# 1. Route to Sales Analyst for performance data
# 2. Route to Inventory Manager for cost analysis
# 3. Synthesize findings and recommendations
```

## Development Guidelines

### Adding New Tools
1. Create tool file in `tools/` directory
2. Follow standard tool pattern
3. Import in relevant agent
4. Add to agent's tool list
5. Update agent instructions if needed

### Tool Pattern Template
```python
def analyze_something(
    param1: Optional[str] = None,
    param2: Optional[str] = None
) -> Dict:
    """
    Tool description.
    
    Args:
        param1: Description (default: value)
        param2: Description (default: value)
    
    Returns:
        Standard response dictionary
    """
    try:
        # Set defaults
        param1 = param1 or DEFAULT_VALUE
        
        # Perform analysis
        results = perform_analysis()
        
        # Return structured response
        return {
            "status": "success",
            "data": results,
            "summary": "Analysis complete",
            "insights": extract_insights(results)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": None
        }
```

## Testing

### Unit Tests
```bash
# Test individual tools
pytest tools/test_customer_behaviour.py

# Test agent orchestration
pytest test_agent.py
```

### Integration Tests
```bash
# Test end-to-end flow
python -m pytest tests/integration/
```

## Performance Optimization

### Parallel Execution
- Orchestrator can execute independent subtasks in parallel
- Async processing for I/O operations
- Connection pooling for database access

### Caching Strategy
- Cache frequently accessed data
- Tool-level result caching
- Session-based context caching

### Resource Management
- Lazy loading of tools
- Memory-efficient data processing
- Connection recycling

## Monitoring and Logs

### Logging Configuration
```python
# In utils/logging_config.py
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('orchestration.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks
```python
from orchestration_agent.utils.health_monitor import check_health

status = check_health()
# Returns agent status, tool availability, database connections
```

## Best Practices

1. **Always provide defaults** - Never block on missing parameters
2. **Return immediately** - Provide initial results, refine if needed
3. **Structure responses** - Use consistent response format
4. **Handle errors gracefully** - Return partial results when possible
5. **Log important events** - Track tool usage and performance
6. **Cache expensive operations** - Reduce redundant calculations
7. **Document tool capabilities** - Clear descriptions for routing

## Troubleshooting

### Common Issues

#### Tool Not Found
```python
# Check tool registration
from orchestration_agent.utils.tool_registry import list_tools
print(list_tools())
```

#### Database Connection Error
```python
# Verify database paths
import os
db_path = 'database/customers.db'
assert os.path.exists(db_path), f"Database not found: {db_path}"
```

#### Agent Response Timeout
```python
# Increase timeout in environment
os.environ['AGENT_TIMEOUT'] = '60'
```

## Related Documentation

- [ADK Setup](../README.md)
- [Main AI Documentation](../../../AI_DOCS.md)
- [Tool Implementations](../tools/)
- [Agent Prompts](./prompt.py)