import wave
import io
import requests
from google import genai
from google.genai import types
import os
import base64
import json
from cartesia import AsyncCartesia
import re
import dotenv
from groq import AsyncGroq
import aiohttp
import asyncio
dotenv.load_dotenv()
from cartesia.tts import OutputFormat_Raw, TtsRequestIdSpecifier
from deepgram import DeepgramClient

COMPONENT_SCHEMA = {
    "spawnableComponents": {
        "purchase-frequency": {
            "components": ["histogram", "heatmap", "quadrant", "regularity", "treemap"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "segment": "string|null",
                "frequency_threshold": "number|null",
                "monetary_threshold": "number|null"
            }
        },
        "product-performance": {
            "components": ["kpis", "overview", "topProducts", "categoryAnalysis", "marginAnalysis", "priceBands"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "categories": "array",
                "products": "array",
                "priceBands": "array",
                "minMargin": "number|null",
                "maxMargin": "number|null",
                "topN": "number"
            }
        },
        "sales-performance": {
            "components": ["overview", "timeSeries", "distribution", "comparativeGrid", "correlationMatrix", "driverAnalysis"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "dimension": "string",
                "metric": "string",
                "time_granularity": "string"
            }
        },
        "customer-segmentation": {
            "components": ["distributionMap", "profileCards", "metricComparison", "kpiTiles"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "segmentType": "string",
                "limit": "number",
                "includeMetrics": "boolean"
            }
        },
        "customer-behaviour": {
            "components": ["radar", "histogram", "treemap", "donut"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "customerSegment": "string|null",
                "limit": "number"
            }
        },
        "churn-prediction": {
            "components": ["riskPyramid", "featureImportance", "probabilityHistogram", "temporalRisk", "segmentMatrix"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "riskThreshold": "number",
                "modelType": "string",
                "customerSegment": "string|null",
                "count": "number"
            }
        },
        "anomaly-detection": {
            "components": ["severityDistribution", "featureContribution", "anomalyTable", "kpiTiles"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "anomalyThreshold": "number",
                "detectionMethod": "string",
                "customerSegment": "string|null"
            }
        },
        "transaction-patterns": {
            "components": ["kpiTiles", "temporalHeatmap", "timeSeriesChart"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "patternType": "string",
                "anomalyThreshold": "number",
                "aggregationLevel": "string"
            }
        },
        "customer-lifetime-value": {
            "components": ["kpiTiles", "ltvDistribution", "predictionAccuracy", "geographicMap", "customerExplorer", "valueContribution", "timeProjection", "filterPanel"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "predictionPeriod": "string",
                "customerSegment": "string|null",
                "valueType": "string",
                "currency": "string"
            }
        },
        "engagement-classifier": {
            "components": ["kpiTiles", "pyramid", "timeline", "opportunityFinder"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "engagementMetrics": "array",
                "classificationThresholds": "object|null",
                "customerSegment": "string|null",
                "channel": "string|null"
            }
        },
        "next-purchase": {
            "components": ["kpiTiles", "confidenceMatrix", "customerJourney", "affinityNetwork"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "timeframe": "string",
                "confidenceThreshold": "number",
                "customerSegment": "string|null",
                "productCategory": "string|null"
            }
        },
        "sales-trends": {
            "components": ["timeSeriesExplorer", "seasonalPatternAnalyzer", "growthRateVisualizer", "kpiTiles"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "timePeriod": "string",
                "metric": "string",
                "dimension": "string|null"
            }
        },
        "regional-sales": {
            "components": ["kpiTiles", "performanceMap", "timeSeriesExplorer"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "country": "string|null",
                "state": "string|null",
                "aggregation": "string"
            }
        },
        "performance-deviation": {
            "components": ["kpiTiles", "performanceExplorer", "featureImportance", "varianceDecomposition", "deviationPatterns"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "metric": "string",
                "dimension": "string",
                "threshold": "number"
            }
        },
        "retention-planner": {
            "components": ["kpiTiles", "churnRiskGauge", "valueRiskMatrix", "actionSankey", "roiWaterfall"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "retentionPeriod": "string",
                "customerSegment": "string|null",
                "interventionBudget": "number"
            }
        },
        "inventory-level-analyzer": {
            "components": ["healthMatrix", "itemAnalyzer", "kpiTiles"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "time_period": "string",
                "category": "string",
                "warehouse_id": "string",
                "min_stock_threshold": "number"
            }
        },
        "inventory-holding-cost-analyzer": {
            "components": ["kpiTiles", "costBreakdown", "excessiveCostGrid", "costTrend", "warehouseComparison"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "category": "string|null",
                "warehouseId": "string|null",
                "annualHoldingCostPercentage": "number",
                "opportunityCostRate": "number"
            }
        },
        "cash-flow": {
            "components": ["kpis", "trends", "operating", "investing", "financing", "projection", "table", "fcf-bridge", "liquidity-timeline", "capital-allocation"],
            "parameters": {
                "dateFrom": "date",
                "dateTo": "date",
                "cashFlowType": "string",
                "departments": "array",
                "regions": "array",
                "minAmount": "number|null"
            }
        },
        "ar-aging-analysis": {
            "components": ["kpis", "overview", "customerMatrix", "forecast", "riskHeatmap", "agingBreakdown"],
            "parameters": {
                "dateFrom": "date",
                "dateTo": "date",
                "customerSegments": "array",
                "riskLevels": "array",
                "minAmount": "number|null",
                "maxAmount": "number|null",
                "wacc": "number",
                "regions": "array"
            }
        }
    }
}


VIS_SCHEMA_PROMPT = """
You are an intelligent metadata extractor and visualization mapper. Your PRIMARY task is to EXTRACT METADATA PARAMETERS (especially dates) from ADK responses, NOT data values.

## Your Critical Role
You must:
1. **EXTRACT THE EXACT DATES FROM ADK RESPONSE TEXT** - Look for phrases like "from 2021-01-01 to 2021-12-31" or "analyzed data from 2021"
2. **USE ONLY THE DATES THE ADK AGENT USED** - Do NOT generate new dates, use exactly what's in the ADK text
3. **DO NOT extract data values** - only metadata parameters (dates, filters, segments)
4. Map the analysis to appropriate visualization components
5. Return properly formatted metadata for visualization components

## CRITICAL DATE EXTRACTION RULES
**MOST IMPORTANT**: FIND AND USE THE EXACT DATES FROM ADK RESPONSE!

Look for these patterns in ADK response:
- "from 2021-01-01 to 2021-12-31" → dateFrom: "2021-01-01", dateTo: "2021-12-31"
- "analyzed full year 2021" → dateFrom: "2021-01-01", dateTo: "2021-12-31"
- "for the period 2021-01-01 through 2021-12-31" → use those exact dates
- "2021 data" → dateFrom: "2021-01-01", dateTo: "2021-12-31"

**DO NOT**:
- Make up dates like "2023-01-01" or "2024-01-01"
- Use current year unless ADK specifically mentions it
- Generate random date ranges

**ALWAYS**:
- Search the ADK response for the actual date range used
- Use dateFrom and dateTo (not start_date/end_date)
- If ADK says "2021-10-01 to 2021-12-31", use EXACTLY those dates

Examples of data extraction:
- "150 high-risk customers (15%)" → {count: 150, percentage: 15, level: "High Risk"}
- "Revenue was $45,000 in January, $52,000 in February" → {labels: ["January", "February"], data: [45000, 52000]}
- "Sales increased by 25% month-over-month" → {growth: 25}
- "500 transactions on Monday, 650 on Tuesday" → {Monday: 500, Tuesday: 650}
- "Product A: 1200 units, Product B: 890 units" → {labels: ["Product A", "Product B"], data: [1200, 890]}

## CRITICAL REQUIREMENTS FOR METADATA-ONLY RESPONSES:

### NEW APPROACH - Return metadata ONLY, no data arrays:
As per the new architecture, visualization components should:
1. Return METADATA parameters only (dates, filters, thresholds)
2. NOT include large data arrays or actual chart data
3. Let the frontend fetch data from summary APIs

### For riskPyramid (METADATA ONLY):
```json
{
  "toolname": "churn-prediction",
  "componentName": "riskPyramid",
  "body": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "risk_level": "High",
    "risk_threshold": 0.7,
    "customer_segment": "Enterprise"
  }
}
```
- Extract parameters from query, NOT data
- Include filters and date ranges
- NO counts, percentages, or actual data

### For featureImportance (METADATA ONLY):
```json
{
  "toolname": "churn-prediction",
  "componentName": "featureImportance",
  "body": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "modelType": "gradient_boosting",
    "top_features": 10
  }
}
```
- Return metadata parameters only
- NO actual feature data or importance values
- Frontend will fetch from /api/churn/summary

### For segmentMatrix (METADATA ONLY):
```json
{
  "toolname": "churn-prediction",
  "componentName": "segmentMatrix",
  "body": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "segments": ["Enterprise", "Mid-Market", "SMB"],
    "include_risk_levels": true
  }
}
```
- Return metadata only
- NO actual segment data or counts
- Frontend fetches real data from API

## Special Rules for METADATA-ONLY Responses:
1. NEVER include actual data arrays in the body
2. Extract PARAMETERS from the user query (dates, filters, thresholds)
3. The body should contain metadata that the frontend will use to fetch data
4. Focus on configuration, not data extraction
5. If ADK provides data, IGNORE it - only extract metadata parameters

## Available Components Schema
""" + json.dumps(COMPONENT_SCHEMA, indent=2) + """

## IMPORTANT: Tool and Component Selection
The schema above shows TOOLS (like "sales-performance", "product-performance") and each tool has a "components" array.
You must:
1. ANALYZE the ADK response to identify ALL tools that were called/executed
2. For EACH tool found in the ADK response, SELECT THE APPROPRIATE TOOL NAME from the schema keys
3. SELECT ALL RELEVANT COMPONENTS from the "components" ARRAY of each identified tool
4. INCLUDE BOTH the tool name and the component details for ALL components in your response
5. If NO tools were called in the ADK response, return an empty array []
6. If MULTIPLE tools were called, include components for ALL of them
7. For churn-prediction tool specifically, include ALL relevant visualizations mentioned:
   - riskPyramid (if risk distribution is discussed)
   - featureImportance (if key factors are mentioned)
   - segmentMatrix (if segment analysis is present)
   - temporalRisk (if time trends are shown)
   - probabilityHistogram (if probability distribution is mentioned)
8. Return MULTIPLE component objects if multiple visualizations are appropriate for the analysis

## Input Format
You will receive:
- **User Query**: The original business question or request
- **ADK Response**: The analytical response from the MultiAgent-adk framework
- **Context**: Any additional context about the analysis

## Output Requirements
Return a JSON array with METADATA ONLY from the user query:

**CRITICAL: Return metadata parameters ONLY, no data arrays!**
**IMPORTANT: Return MULTIPLE components for comprehensive analysis!**

**Example for churn-prediction with MULTIPLE components:**
```json
[
  {
    "toolname": "churn-prediction",
    "componentName": "riskPyramid",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  },
  {
    "toolname": "churn-prediction",
    "componentName": "featureImportance",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  },
  {
    "toolname": "churn-prediction",
    "componentName": "segmentMatrix",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  }
]
```

**For heatmap components:**
```json
{
  "toolname": "tool-name",
  "componentName": "heatmap",
  "body": {
    "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
    "values": [
      [10, 20, 30, 40, 35, 30, 25, 20, 15],
      [15, 25, 35, 45, 40, 35, 30, 25, 20],
      [20, 30, 40, 50, 45, 40, 35, 30, 25],
      [25, 35, 45, 55, 50, 45, 40, 35, 30],
      [30, 40, 50, 60, 55, 50, 45, 40, 35]
    ],
    "title": "Weekly Activity Heatmap"
  }
}
```

**For risk/segmentation components:**
```json
{
  "toolname": "churn-prediction",
  "componentName": "riskPyramid",
  "body": {
    "data": [
      {"level": "High Risk", "count": 150, "percentage": 15, "color": "#f56565"},
      {"level": "Medium Risk", "count": 350, "percentage": 35, "color": "#ed8936"},
      {"level": "Low Risk", "count": 500, "percentage": 50, "color": "#48bb78"}
    ],
    "title": "Customer Risk Distribution"
  }
}
```

**For no tools called in ADK:**
```json
[]
```

**For single tool called in ADK:**
```json
[
  {
    "toolname": "single-tool-name-from-adk-output",
    "componentName": "component-from-that-tool",
    "body": {
      "parameter1": "value_extracted_from_user_query"
    }
  }
]
```

## Component Selection Process
1. **Analyze ADK response** to identify which tools were actually called/executed
2. **For each tool found in ADK response:**
   - Identify the corresponding tool in the schema (e.g., if ADK called a sales analysis tool → "sales-performance")
   - Select appropriate component from that tool's "components" array based on the analysis performed
   - Determine how many components are needed for that tool (could be 1 or multiple)
3. **Use each tool's parameters schema** to build the body for each selected component
4. **Include the tool name** in each response object
5. **Return empty array** if no tools were executed in the ADK response

## Critical Rules

### METADATA Extraction Rules (NO Data Arrays!):
1. **EXTRACT dates from ADK response FIRST** - Look for date ranges mentioned in the ADK analysis
2. **If no dates in ADK response, then extract from user query** - fallback to user query dates
3. **DO NOT extract data values from ADK response** - only metadata parameters
4. **Focus on configuration metadata** - what the analysis used
5. **Include filter criteria** - risk levels, time periods, thresholds
6. **Let frontend fetch actual data** from summary APIs

### What to Extract as Metadata:
- Date ranges FROM ADK RESPONSE: Look for phrases like "from 2021-10-01 to 2021-12-31" or "October to December 2021" in the ADK analysis text
- Date ranges FROM USER QUERY (fallback): "last 30 days", "Q1 2024" → dateFrom, dateTo
- Filters: "high-risk customers" → risk_level: "High"
- Segments: "Enterprise segment" → customer_segment: "Enterprise"
- Metrics: "revenue by region" → metric: "revenue", dimension: "region"
- Time granularity: "monthly trends" → time_granularity: "monthly"

### CRITICAL Date Extraction Priority:
1. **MANDATORY FIRST STEP**: Search ADK response for EXACT dates like:
   - "2021-01-01", "2021-12-31"
   - "from 2021-01-01 to 2021-12-31"
   - "Date Range: 2021-01-01 to 2021-12-31"
   - "January 2021 to December 2021"
   - "Full year 2021"
   - ANY mention of specific dates in the ADK analysis

2. **USE EXACTLY WHAT ADK SAYS**:
   - If ADK says "analyzing data from 2021-10-01 to 2021-12-31", use dateFrom: "2021-10-01", dateTo: "2021-12-31"
   - DO NOT change these dates to 2023 or 2024
   - DO NOT use current year unless ADK specifically says current year

3. **IF NO DATES FOUND IN ADK**:
   - Look at the user query for time references like "30 days", "last month", "Q1 2024"
   - Convert these to appropriate date ranges based on the context
   - Only as LAST RESORT, if absolutely no dates anywhere: Look for context clues about what period was analyzed

4. **FORMAT**: Always use dateFrom and dateTo (not start_date/end_date)

### Parameter Extraction Rules
1. **Date parameters**: Extract dates mentioned in user query (e.g., "2023 sales" → start_date: "2023-01-01", end_date: "2023-12-31")
2. **Metrics**: Use metrics explicitly mentioned or strongly implied in the query
3. **Categories/Dimensions**: Extract specific categories, regions, products mentioned by user
4. **Time granularity**: Infer from user's time-related language ("monthly trends" → "monthly", "daily performance" → "daily")
5. **Thresholds**: Use exact numbers mentioned in query, or use schema defaults if not specified

### Tool and Component Selection Logic
1. **Analyze ADK output first**: Look for tool execution results, function calls, or analysis outputs
2. **Match ADK tools to schema tools**: Map what ADK executed to available visualization tools
3. **Multiple tools handling**: If ADK called multiple tools, include components for each one
4. **Component quantity per tool**: Each tool must use only 1 component, of the best fit for the analysis.
5. **Empty response handling**: If ADK response contains no tool outputs, return []
6. **Prioritize actual execution over intent**: Focus on what tools were actually called, not just what was requested
7. ALL THE FIELDS GIVEN IN THE BODY OF THE VISUALIZATION SCHEMA MUST BE INCLUDED IN YOUR RESPONSE

### Parameter Mapping Guidelines
- **Date Ranges FROM ADK RESPONSE**:
  - If ADK says "from 2021-10-01 to 2021-12-31" → dateFrom: "2021-10-01", dateTo: "2021-12-31"
  - If ADK says "October 2021 through December 2021" → dateFrom: "2021-10-01", dateTo: "2021-12-31"
  - If ADK says "Q4 2021" → dateFrom: "2021-10-01", dateTo: "2021-12-31"
  - USE EXACTLY THESE DATES, DO NOT CHANGE THE YEAR
  
- **Metrics**: Map natural language to schema metrics
  - "revenue" → "revenue" or "sales"
  - "profit margins" → "margin"
  - "units sold" → "units"
  
- **Dimensions**:
  - "by region" → dimension: "region"
  - "product-wise" → category_level: "product"
  - "customer segments" → dimension: "customer_segment"

## CRITICAL: Date Extraction Example

### EXAMPLE OF CORRECT EXTRACTION WITH MULTIPLE COMPONENTS:
**User Query**: "Show me churn risk analysis"
**ADK Response**: "I'll analyze customer churn risk for the period from 2021-01-01 to 2021-12-31. Looking at risk distribution, key factors, and segment analysis..."
**CORRECT EXTRACTION** (return ALL relevant components):
```json
[
  {
    "toolname": "churn-prediction",
    "componentName": "riskPyramid",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  },
  {
    "toolname": "churn-prediction",
    "componentName": "featureImportance",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  },
  {
    "toolname": "churn-prediction",
    "componentName": "segmentMatrix",
    "body": {
      "dateFrom": "2021-01-01",
      "dateTo": "2021-12-31"
    }
  }
]
```
**WRONG** (DO NOT DO THIS):
```json
{
  "body": {
    "dateFrom": "2023-01-01",  // WRONG! ADK said 2021, not 2023
    "dateTo": "2023-12-31"      // WRONG! Making up dates
  }
}
```

## Example Decision Process

### Example 1: Single Tool Called in ADK
**User Query**: "Show me sales performance by region"
**ADK Response**: "Analyzing regional sales data from 2023-01-01 to 2023-12-31..."
**Step 1**: Extract dates from ADK → "from 2023-01-01 to 2023-12-31"
**Step 2**: Map to schema tool → "sales-performance"
**Step 3**: Select components → "timeSeries" for time-based analysis
**Result**:
```json
[
  {
    "toolname": "sales-performance",
    "componentName": "timeSeries",
    "body": {
      "dateFrom": "2023-01-01",  // EXACT dates from ADK: "from 2023-01-01"
      "dateTo": "2023-12-31",    // EXACT dates from ADK: "to 2023-12-31"
      "dimension": "region",
      "metric": "revenue",
      "time_granularity": "monthly"
    }
  }
]
```

### Example 2: Multiple Tools Called in ADK
**User Query**: "Analyze sales trends and customer behavior for Q1 2024"
**ADK Response**: "Called sales_analysis_tool... Results: Q1 sales trends... Called customer_behavior_tool... Results: Customer segmentation analysis..."
**Step 1**: Identify tools in ADK → sales_analysis_tool AND customer_behavior_tool were called
**Step 2**: Map to schema tools → "sales-performance" AND "customer-behaviour"
**Result**:
```json
[
  {
    "toolname": "sales-performance",
    "componentName": "timeSeries",
    "body": {
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "metric": "revenue",
      "time_granularity": "monthly"
    }
  },
  {
    "toolname": "customer-behaviour",
    "componentName": "dashboard",
    "body": {}
  }
]
```

### Example 3: No Tools Called in ADK
**User Query**: "What is the weather today?"
**ADK Response**: "I cannot help with weather information as no relevant analysis tools are available."
**Step 1**: Identify tools in ADK → No tools were called
**Result**:
```json
[]
```

## Quality Assurance Checklist
Before returning your response, verify:
- [ ] ADK response has been analyzed to identify which tools were actually called
- [ ] All tools found in ADK response are represented in the output
- [ ] If no tools were called in ADK, return empty array []
- [ ] All parameter values come from user query, not generated
- [ ] Tool names are exactly from the schema keys (e.g., "sales-performance", "transaction-patterns")
- [ ] Component names are from the "components" arrays of the respective tools
- [ ] Component names exactly match schema (camelCase like "timeSeries", "marginAnalysis")
- [ ] Required parameters for each component are included
- [ ] Date formats are consistent (YYYY-MM-DD)
- [ ] Metrics match available options in schema
- [ ] JSON structure is valid and complete
- [ ] Each object includes both "toolname" and "componentName"

## Edge Cases
- **No tools called**: Return empty array [] if ADK response shows no tool execution
- **Multiple tools called**: Include components for ALL tools that were executed
- **Ambiguous tool mapping**: Choose the most likely schema tool based on ADK output context
- **Missing parameters**: Use schema defaults only when user provides no relevant information
- **Multiple time periods**: Create separate components for each period if needed
- **Complex multi-tool analysis**: Each tool needs single component- include the most appropriate one
- **Tool execution errors**: If ADK shows tool errors but some tools succeeded, include components for successful tools only

## Response Format
Return only the JSON array, no additional text or explanations. Ensure the JSON is properly formatted and valid.

**CRITICAL REQUIREMENTS:**
1. **Analyze ADK response first** - identify which tools were actually called/executed
2. **Return empty array []** if no tools were called in ADK response  
3. **Include ALL tools** that were called in ADK response
4. **Single component per tool** is only allowed, of the best fit for the analysis.
5. Each object in the array must include:
   - "toolname": The exact tool name from the schema that corresponds to the ADK tool called
   - "componentName": The exact component name from that tool's components array
   - "body": Object containing the parameters for that component

Remember: Your success is measured by how accurately you identify which tools were called in the ADK response and translate each tool's output into appropriate visualization components. Always prioritize what tools were actually executed over what was requested.
"""



def remove_markdown_characters(text):
    """
    Remove all markdown special characters from a string.
    
    Args:
        text (str): The input string containing markdown characters
        
    Returns:
        str: Clean string with markdown characters removed
    """
    # Define all markdown special characters
    markdown_chars = r'[*_`~#\[\](){}\\|>+\-=!]'
    
    # Remove all markdown characters
    clean_text = re.sub(markdown_chars, '', text)
    
    # Remove extra whitespace that might be left behind
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text

# Alternative method using string translation (faster for large texts)
def remove_markdown_characters_fast(text):
    """
    Remove markdown characters using string translation (faster method).
    
    Args:
        text (str): The input string containing markdown characters
        
    Returns:
        str: Clean string with markdown characters removed
    """
    # Define markdown characters to remove
    markdown_chars = '*_`~#[](){}\\|>+-=!'
    
    # Create translation table
    translator = str.maketrans('', '', markdown_chars)
    
    # Remove characters and clean up whitespace
    clean_text = text.translate(translator)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text


async def fetch_data(session, url, payload, headers, querystring):
    async with session.post(url, json=payload, headers=headers, params=querystring) as response:
        data = await response.json()
        return data


def wave_file_memory(pcm, channels=1, rate=24000, sample_width=2):
    """
    Convert PCM data to WAV format in memory.
    
    Args:
        pcm: PCM audio data (bytes)
        channels: Number of audio channels (default: 1)
        rate: Sample rate (default: 24000)
        sample_width: Sample width in bytes (default: 2)
    
    Returns:
        bytes: WAV file data as bytes
    """
    
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)
    
    return buffer.getvalue()  # Return bytes instead of BytesIO

async def get_audio_groq(text: str) -> str:
  groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))
  response = {
    "mime_type": "audio/wav",
    "data": ""
  }

  speech_file_path = "speech.wav" 
  model = "playai-tts"
  voice = "Arista-PlayAI"
  response_format = "wav"

  audio_response = await groq_client.audio.speech.create(
    model=model,
    voice=voice,
    input=remove_markdown_characters_fast(text),
    response_format=response_format
  )

  buffer = wave_file_memory(await audio_response.read(), channels=1, rate=44000, sample_width=2)
  audio_base64 = base64.b64encode(buffer).decode('utf-8')
  response["data"] = audio_base64
  return response




async def get_audio_deepgram(text: str) -> dict:
    """Generate audio using Deepgram API and return as dict with mime_type and data."""

    SPEAK_TEXT = {"text": remove_markdown_characters_fast(text)}

    try:
        # Initialize Deepgram client with API key only
        deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY", ""))

        # Configure for MP3 output - pass as dictionary
        options = {
            "model": "aura-2-thalia-en",
            "encoding": "mp3",  # Specify MP3 encoding
        }

        # Call the async REST API
        res = await deepgram.speak.asyncrest.v("1").stream_memory(
            SPEAK_TEXT, options
        )

        # Encode the MP3 data to base64 and return as dict
        audio_base64 = base64.b64encode(res.stream_memory.getbuffer()).decode('utf-8')
        return {
            "mime_type": "audio/mpeg",
            "data": audio_base64
        }

    except Exception as e:
        print(f"Audio generation error: {e}")
        return None



async def get_audio(text: str) -> str:

  gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY", ""))

  
  response = {
    "mime_type": "audio/wav",
    "data": ""
  }

  print("\nGenerating audio\n")

  audio_response = await gemini_client.aio.models.generate_content(
      model="gemini-2.5-flash-preview-tts",
      contents=remove_markdown_characters_fast(text),
      config=types.GenerateContentConfig(
          response_modalities=["AUDIO"],
          speech_config=types.SpeechConfig(
              voice_config=types.VoiceConfig(
                  prebuilt_voice_config=types.PrebuiltVoiceConfig(
                      voice_name='Leda',
                  )
              )
          ),
      )
  )
  response["mime_type"] = "audio/wav"
  buffer = wave_file_memory(audio_response.candidates[0].content.parts[0].inline_data.data)

  cartesia_client = AsyncCartesia(
    api_key=os.getenv("CARTESIA_API_KEY", ""),
  )
   
  chunks = []
  # async for output in cartesia_client.tts.bytes(
  #     model_id="sonic-2",
  #     transcript=remove_markdown_characters_fast(text),
  #     voice={"id": "bf0a246a-8642-498a-9950-80c35e9276b5"},
  #     language="en",
  #     output_format={
  #         "container": "mp3",
  #         "bit_rate": 64000,
  #         "sample_rate": 44100,
  #     },
  # ):
  #     chunks.append(output)

  # buffer = b''.join(chunks)
  # response["mime_type"] = "audio/mp3"

  audio_base64 = base64.b64encode(buffer).decode('utf-8')

  response["data"] = audio_base64

  print("\naudio generated\n")

  return response


def get_audio_from_file():
    path = os.path.join(os.path.dirname(__file__), "audio.wav")
    with open(path, "rb") as file:
        return {"mime_type": "audio/wav", "data": base64.b64encode(file.read()).decode('utf-8')}
    
def get_audio_from_base64(base64_data: str) -> str:
    return base64.b64decode(base64_data)

async def get_visualisation(user_query: str, adk_response: str) -> dict:
    """Generate visualizations by analyzing ADK response using AI to map tools to components."""

    print("getting vis")
    print(f"Query: {user_query[:100]}")
    print(f"ADK Response length: {len(adk_response)} chars")

    # FIRST: Try to extract tool's embedded JSON metadata from the response
    # Tools output JSON in a section like "## Visualization Data (Machine-Readable)"
    import re
    viz_pattern = r'## Visualization Data \(Machine-Readable\)\s*```json\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```'
    viz_match = re.search(viz_pattern, adk_response)

    if viz_match:
        try:
            embedded_json = json.loads(viz_match.group(1))
            print("✅ Found embedded visualization JSON from tool!")
            print(f"Embedded metadata: {json.dumps(embedded_json, indent=2)[:500]}")

            # If it's a single object, wrap in array
            if isinstance(embedded_json, dict):
                embedded_json = [embedded_json]

            return embedded_json
        except json.JSONDecodeError as e:
            print(f"⚠️ Failed to parse embedded JSON: {e}, falling back to AI extraction")

    # Fall back to AI extraction if direct extraction failed
    print("No embedded JSON found, using AI to extract metadata parameters from user query...")
    gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY", ""))
    prompt = f"""
    {VIS_SCHEMA_PROMPT}

    ## Input Data
    **User Query**: {user_query}
    **ADK Response**: {adk_response}

    CRITICAL INSTRUCTION:
    1. SEARCH THE ADK RESPONSE for dates like "2021-10-01 to 2021-12-31" or "Date Range: 2021-10-01"
    2. USE EXACTLY THOSE DATES in your response - DO NOT change the year to 2023 or 2024
    3. If ADK says "2021-10-01", use dateFrom: "2021-10-01", NOT "2023-10-01" or "2024-10-01"
    4. IF NO DATES FOUND IN ADK: Parse user query for time references:
       - "last 30 days" → Calculate 30-day range ending at data boundary
       - "Q1", "Q2", etc → Map to appropriate quarter
       - "last month" → Previous month range
       - If still no dates: Omit date fields to let backend use its own defaults

    IMPORTANT REMINDERS FOR CHURN-PREDICTION:
    - Return ALL relevant visualizations (riskPyramid, featureImportance, segmentMatrix)
    - Each visualization should be a separate object in the array
    - DO NOT limit yourself to just one component
    - If the ADK response mentions risk levels, key factors, and segments, return ALL THREE

    Please analyze the above input and return ALL appropriate visualization components as a JSON array.
    """

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
    except Exception as e:
        print('error in get_visualisation', e)
        return None

    response_text = response.candidates[0].content.parts[0].text.strip()
    response_text = response_text.replace("```json", "").replace("```", "").strip()

    print("\n\nVisualization AI response:\n", response_text[:500])

    try:
        response_json = json.loads(response_text)
        print("\n\nParsed visualization JSON:\n", json.dumps(response_json, indent=2)[:500])

        # Post-process to ensure metadata-only structure
        if isinstance(response_json, list):
            for item in response_json:
                if item.get("body"):
                    body = item["body"]

                    # Check if body contains data arrays (old format) and remove them
                    if isinstance(body, dict):
                        # Remove any 'data' property if it contains arrays
                        if "data" in body and isinstance(body["data"], (list, dict)):
                            print(f"Warning: Removing data array from {item.get('componentName', 'unknown')} - should be metadata only")
                            del body["data"]

                        # Remove any dataset properties
                        if "datasets" in body:
                            print(f"Warning: Removing datasets from {item.get('componentName', 'unknown')} - should be metadata only")
                            del body["datasets"]

                        # Remove any direct data arrays
                        for key in list(body.keys()):
                            if isinstance(body[key], list) and key not in ["segments", "metrics", "dimensions", "filters"]:
                                print(f"Warning: Removing {key} array from body - should be metadata only")
                                del body[key]

        return response_json
    except json.JSONDecodeError as e:
        print(f"Failed to parse visualization JSON: {e}")
        return None

def get_data():
    jsonFile = os.path.join(os.path.dirname(__file__), "data.json")

    with open(jsonFile, "r") as file:
        data = json.load(file)
    
    data["audio"] = get_audio_from_file()


    return data



if __name__ == "__main__":
    data = asyncio.run(get_audio_deepgram("Hello, welcome to Deepgram!"))
    print(data)
