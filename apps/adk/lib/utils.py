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
from deepgram import (
    DeepgramClient,
    ClientOptionsFromEnv,
    SpeakOptions,
)

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
            "components": ["salesExplorer", "marginAnalysis", "priceBandDistribution", "growthMatrix"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "metrics": "array",
                "category_level": "string",
                "min_sales_threshold": "number|null",
                "time_granularity": "string"
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
            "components": ["distributionMap", "profileCards", "metricComparison", "kpiTiles", "evolutionTimeline", "attributeHeatmap"],
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
        }
    }
}


VIS_SCHEMA_PROMPT = """
You are an intelligent data extractor and visualization mapper. Your PRIMARY task is to EXTRACT ACTUAL DATA from ADK responses and format it for visualization components.

## Your Critical Role
You must:
1. EXTRACT all numerical data, percentages, counts, and values from the ADK response text
2. Parse and identify actual numbers mentioned in the analysis
3. Convert extracted data into chart-ready data structures
4. Map the analysis to appropriate visualization components
5. Return properly formatted data for immediate visualization

## Data Extraction Rules
**MOST IMPORTANT**: Extract REAL NUMBERS from the ADK response, not parameters!

Examples of data extraction:
- "150 high-risk customers (15%)" → {count: 150, percentage: 15, level: "High Risk"}
- "Revenue was $45,000 in January, $52,000 in February" → {labels: ["January", "February"], data: [45000, 52000]}
- "Sales increased by 25% month-over-month" → {growth: 25}
- "500 transactions on Monday, 650 on Tuesday" → {Monday: 500, Tuesday: 650}
- "Product A: 1200 units, Product B: 890 units" → {labels: ["Product A", "Product B"], data: [1200, 890]}

## CRITICAL REQUIREMENTS FOR CHURN-PREDICTION COMPONENTS:

### For riskPyramid:
**MUST include ALL 4 risk levels** with complete data:
```json
{
  "toolname": "churn-prediction",
  "componentName": "riskPyramid",
  "body": {
    "data": [
      {"level": "Very High", "count": NUMBER, "percentage": NUMBER, "color": "#ef4444"},
      {"level": "High", "count": NUMBER, "percentage": NUMBER, "color": "#f59e0b"},
      {"level": "Medium", "count": NUMBER, "percentage": NUMBER, "color": "#eab308"},
      {"level": "Low", "count": NUMBER, "percentage": NUMBER, "color": "#10b981"}
    ]
  }
}
```
- Extract counts from text like "Low Risk: 500 customers"
- Calculate percentages if not provided
- ALWAYS include all 4 levels, even if count is 0

### For featureImportance:
**MUST include feature names and importance values**:
```json
{
  "toolname": "churn-prediction",
  "componentName": "featureImportance",
  "body": {
    "data": [
      {"name": "Recency", "importance": 90, "impact": 90},
      {"name": "Frequency", "importance": 75, "impact": 75},
      {"name": "Monetary", "importance": 60, "impact": 60}
    ]
  }
}
```
- Extract feature names exactly as mentioned (e.g., "Recency", not "Feature 1")
- Convert percentages properly (90%, not 905)
- Use importance value for impact if impact not specified

### For segmentMatrix:
**MUST include segment and risk level breakdown**:
```json
{
  "toolname": "churn-prediction",
  "componentName": "segmentMatrix",
  "body": {
    "data": [
      {"segment": "Enterprise", "Low": 20, "Medium": 30, "High": 35, "Very High": 15},
      {"segment": "Mid-Market", "Low": 40, "Medium": 25, "High": 20, "Very High": 15}
    ]
  }
}
```

## Special Parsing Rules for Churn Data:
1. If ADK mentions "Visualization Data (Machine-Readable)" section, PRIORITIZE extracting from that JSON
2. Look for structured data sections in the ADK response first
3. Risk levels MUST be: "Very High", "High", "Medium", "Low" (exact casing)
4. Feature names should be meaningful (Recency, Frequency, etc.), not generic (Feature 1, Feature 2)

## Available Components Schema
""" + json.dumps(COMPONENT_SCHEMA, indent=2) + """

## IMPORTANT: Tool and Component Selection
The schema above shows TOOLS (like "sales-performance", "product-performance") and each tool has a "components" array. 
You must:
1. ANALYZE the ADK response to identify ALL tools that were called/executed
2. For EACH tool found in the ADK response, SELECT THE APPROPRIATE TOOL NAME from the schema keys
3. SELECT COMPONENT NAME FROM THE "components" ARRAY of each identified tool
4. INCLUDE BOTH the tool name and the component details for ALL tools in your response
5. If NO tools were called in the ADK response, return an empty array []
6. If MULTIPLE tools were called, include components for ALL of them
7. For each tool, you must select the most appropriate component from the "components" array
8. Each tool must have only one component, of the best fit for the analysis.

## Input Format
You will receive:
- **User Query**: The original business question or request
- **ADK Response**: The analytical response from the MultiAgent-adk framework
- **Context**: Any additional context about the analysis

## Output Requirements
Return a JSON array with EXTRACTED DATA from the ADK response:

**CRITICAL: Extract actual numbers from the ADK response text and put them in the body field!**

**For chart components - EXTRACT numbers from text:**
```json
{
  "toolname": "sales-performance",
  "componentName": "barchart",
  "body": {
    "labels": ["Jan", "Feb", "Mar"],  // Extract month names from ADK text
    "datasets": [{
      "label": "Revenue",
      "data": [45000, 52000, 61000],  // EXTRACT these numbers from ADK response!
      "backgroundColor": "rgba(0, 224, 255, 0.8)"
    }]
  }
}
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

### Data EXTRACTION Rules (NOT Generation!)
1. **PARSE the ADK response text to find ALL numbers, percentages, and values**
2. **EXTRACT actual data mentioned in the ADK response** - don't make up numbers
3. **If ADK says "150 customers"** → extract 150, don't generate random data
4. **If ADK says "$45,000 revenue"** → extract 45000 for the chart
5. **If ADK mentions percentages like "15% high-risk"** → extract 15
6. **Create data arrays from the extracted numbers** for chart visualization

### What to Extract:
- Numbers with units: "1200 units", "$45K", "150 customers" → extract the numbers
- Percentages: "increased 25%", "15% of total" → extract the percentages
- Time series: "Jan: 100, Feb: 150, Mar: 200" → extract as array [100, 150, 200]
- Categories: "High: 150, Medium: 350, Low: 500" → extract as structured data

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
- **Date Ranges**: 
  - "2023" → start_date: "2023-01-01", end_date: "2023-12-31"
  - "last quarter" → calculate based on current context
  - "January to March" → start_date: "2024-01-01", end_date: "2024-03-31"
  
- **Metrics**: Map natural language to schema metrics
  - "revenue" → "revenue" or "sales"
  - "profit margins" → "margin"
  - "units sold" → "units"
  
- **Dimensions**:
  - "by region" → dimension: "region"
  - "product-wise" → category_level: "product"
  - "customer segments" → dimension: "customer_segment"

## Example Decision Process

### Example 1: Single Tool Called in ADK
**User Query**: "Show me sales performance by region for 2023"
**ADK Response**: "Called sales_analysis_tool... Results: Regional sales data for 2023..."
**Step 1**: Identify tools in ADK → sales_analysis_tool was called
**Step 2**: Map to schema tool → "sales-performance"
**Step 3**: Select components → "timeSeries" for time-based analysis, "distribution" for regional breakdown
**Result**:
```json
[
  {
    "toolname": "sales-performance",
    "componentName": "timeSeries",
    "body": {
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
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
        deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY", ""), config=ClientOptionsFromEnv())

        # Configure for MP3 output
        options = SpeakOptions(
            model="aura-2-thalia-en",
            encoding="mp3",  # Specify MP3 encoding
        )

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

    # First try to extract JSON directly from the "Visualization Data (Machine-Readable)" section
    if "Visualization Data (Machine-Readable)" in adk_response:
        try:
            print("Found Visualization Data section, extracting JSON directly...")

            # Find the JSON block after "Visualization Data (Machine-Readable)"
            viz_section_start = adk_response.find("Visualization Data (Machine-Readable)")
            if viz_section_start != -1:
                # Look for ```json after this section
                json_start = adk_response.find("```json", viz_section_start)
                if json_start != -1:
                    json_end = adk_response.find("```", json_start + 7)
                    if json_end != -1:
                        json_str = adk_response[json_start + 7:json_end].strip()
                        print(f"Extracted JSON string: {json_str[:200]}...")

                        viz_data = json.loads(json_str)
                        print(f"Parsed visualization data: {json.dumps(viz_data, indent=2)[:500]}")
                        print(f"[DEBUG] riskPyramid data: {viz_data.get('riskPyramid', 'NOT FOUND')}")
                        print(f"[DEBUG] featureImportance data: {viz_data.get('featureImportance', 'NOT FOUND')}")

                        # Transform to expected format for frontend
                        result = []

                        # Check if this is churn prediction data
                        if "riskPyramid" in viz_data and viz_data["riskPyramid"]:
                            print(f"Adding riskPyramid with {len(viz_data['riskPyramid'])} levels")
                            # Wrap array in 'data' property as expected by RiskPyramid component
                            result.append({
                                "toolname": "churn-prediction",
                                "componentName": "riskPyramid",
                                "body": {"data": viz_data["riskPyramid"]}  # Wrap in data property
                            })

                        if "featureImportance" in viz_data and viz_data["featureImportance"]:
                            print(f"Adding featureImportance with {len(viz_data['featureImportance'])} features")
                            # Wrap array in 'data' property as expected by AIFeatureImportance component
                            result.append({
                                "toolname": "churn-prediction",
                                "componentName": "featureImportance",
                                "body": {"data": viz_data["featureImportance"]}  # Wrap in data property
                            })

                        if "segmentMatrix" in viz_data and viz_data["segmentMatrix"]:
                            print(f"Adding segmentMatrix with {len(viz_data['segmentMatrix'])} segments")
                            # Wrap array in 'data' property for consistency
                            result.append({
                                "toolname": "churn-prediction",
                                "componentName": "segmentMatrix",
                                "body": {"data": viz_data["segmentMatrix"]}  # Wrap in data property
                            })

                        if len(result) > 0:
                            print(f"Successfully extracted {len(result)} visualizations from JSON")
                            print(f"Final visualization response: {json.dumps(result, indent=2)[:500]}")
                            return json.dumps(result)  # Return JSON string for consistency

        except Exception as e:
            print(f"Failed to extract JSON directly: {e}")
            print("Falling back to AI extraction...")

    # Fall back to AI extraction if direct extraction failed
    gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY", ""))
    prompt = f"""
    {VIS_SCHEMA_PROMPT}

    ## Input Data
    **User Query**: {user_query}
    **ADK Response**: {adk_response}

    Please analyze the above input and return the appropriate visualization components as a JSON array.
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

        # Post-process to ensure consistent data structure for visualization components
        if isinstance(response_json, list):
            for item in response_json:
                if item.get("toolname") == "churn-prediction" and item.get("body"):
                    # Check if body contains raw array data (from AI response)
                    body = item["body"]

                    # If body is a list, wrap it in { data: [...] }
                    if isinstance(body, list):
                        item["body"] = {"data": body}
                        print(f"Wrapped {item['componentName']} body in data property")

                    # If body is an object but doesn't have 'data' property and isn't parameters
                    elif isinstance(body, dict) and "data" not in body:
                        # Check if it looks like parameter data (has start_date, end_date, etc)
                        param_keys = {"start_date", "end_date", "riskThreshold", "modelType", "customerSegment", "count"}
                        if not any(key in body for key in param_keys):
                            # This might be misformatted data, log it
                            print(f"Warning: {item['componentName']} body doesn't have 'data' property: {body}")

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
