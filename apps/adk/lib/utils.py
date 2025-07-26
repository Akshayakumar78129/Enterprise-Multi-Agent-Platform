import wave
import io
from google import genai
from google.genai import types
import os
import base64
import json
from cartesia import AsyncCartesia
import re
import dotenv
dotenv.load_dotenv()
from cartesia.tts import OutputFormat_Raw, TtsRequestIdSpecifier

gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY", ""))
cartesia_client = AsyncCartesia(
    api_key=os.getenv("CARTESIA_API_KEY", ""),
)

COMPONENT_SCHEMA = {
    "spawnableComponents": {
        "purchase-frequency": {
            "components": ["histogram", "heatmap", "quadrant", "regularity", "treemap"],
            "parameters": {
                "dateRange": {
                    "start": "date",
                    "end": "date"
                }
            }
        },
        "product-performance": {
            "components": ["salesExplorer", "marginAnalysis", "priceBandDistribution", "growthMatrix"],
            "parameters": {
                "start_date": "date",
                "end_date": "date",
                "metrics": "array",
                "category_level": "string"
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
            "components": ["dashboard", "distributionMap", "profileCards", "metricComparison", "kpiTiles"],
            "parameters": "None"
        },
        "customer-behaviour": {
            "components": ["dashboard", "radar", "histogram", "treemap", "donut"],
            "parameters": "None"
        },
        "churn-prediction": {
            "components": ["dashboard", "riskPyramid", "featureImportance", "probabilityHistogram", "temporalRisk", "segmentMatrix"],
            "parameters": "None"
        },
        "anomaly-detection": {
            "components": ["dashboard", "severityDistribution", "featureContribution", "anomalyTable", "kpiTiles"],
            "parameters": "None"
        },
        "transaction-patterns": {
            "components": ["dashboard", "kpiTiles", "temporalHeatmap", "timeSeriesChart"],
            "parameters": {
                "dateRange": {
                    "start": "date",
                    "end": "date"
                }
            }
        },
        "customer-lifetime-value": {
            "components": ["dashboard", "kpiTiles", "ltvDistribution", "predictionAccuracy", "geographicMap", "customerExplorer", "valueContribution", "timeProjection", "filterPanel"],
            "parameters": {
                "dateRange": {
                    "start": "date",
                    "end": "date"
                }
            }
        },
        "engagement-classifier": {
            "components": ["dashboard", "kpiTiles", "pyramid", "timeline", "opportunityFinder"],
            "parameters": {
                "dateRange": {
                    "start": "date",
                    "end": "date"
                }
            }
        },
        "next-purchase": {
            "components": ["dashboard", "kpiTiles", "confidenceMatrix", "customerJourney", "affinityNetwork"],
            "parameters": {
                "timeframe": "string",
                "confidenceThreshold": "number"
            }
        },
        "sales-trends": {
            "components": ["dashboard", "timeSeriesExplorer", "seasonalPatternAnalyzer", "growthRateVisualizer", "kpiTiles"],
            "parameters": {
                "startDate": "date",
                "endDate": "date",
                "timePeriod": "string",
                "metric": "string",
                "dimension": "string|null"
            }
        },
        "regional-sales": {
            "components": ["dashboard", "kpiTiles", "performanceMap", "timeSeriesExplorer"],
            "parameters": "None"
        },
        "performance-deviation": {
            "components": ["dashboard", "kpiTiles", "performanceExplorer", "featureImportance", "varianceDecomposition", "deviationPatterns"],
            "parameters": "Not specified"
        },
        "retention-planner": {
            "components": ["dashboard", "kpiTiles", "churnRiskGauge", "valueRiskMatrix", "actionSankey", "roiWaterfall"],
            "parameters": "Not specified"
        },
        "inventory-level-analyzer": {
            "components": ["dashboard", "healthMatrix", "itemAnalyzer", "kpiTiles"],
            "parameters": {
                "time_period": "string",
                "category": "string",
                "warehouse_id": "string",
                "min_stock_threshold": "number"
            }
        },
        "inventory-holding-cost-analyzer": {
            "components": ["dashboard", "kpiTiles", "costBreakdown", "excessiveCostGrid", "costTrend", "warehouseComparison"],
            "parameters": {
                "category": "string|null",
                "warehouseId": "string|null",
                "annualHoldingCostPercentage": "number",
                "opportunityCostRate": "number"
            }
        }
    }
}

VIS_SCHEMA_PROMPT = """
You are an intelligent component resolver for a business analytics visualization system. Your task is to analyze user queries and ADK (MultiAgent-adk) responses to determine the most appropriate spawnable components for data visualization.

## Your Role
You act as a bridge between business analysis responses and data visualization. You must:
1. Parse user queries to understand their analytical intent
2. Analyze ADK responses to identify ALL tools that were called and their outputs
3. Map each tool's analysis to appropriate visualization components
4. Extract relevant parameters from the user query (NOT generate random values)
5. Return a structured JSON array with tool names and their components with parameters
6. Handle multiple tool outputs by including components for ALL tools that were called
7. Return empty array if no tool outputs are found in ADK response

## Available Components Schema
""" + json.dumps(COMPONENT_SCHEMA, indent=2) + """

## IMPORTANT: Tool and Component Selection
The schema above shows TOOLS (like "sales-performance", "product-performance") and each tool has a "components" array. 
You must:
1. ANALYZE the ADK response to identify ALL tools that were called/executed
2. For EACH tool found in the ADK response, SELECT THE APPROPRIATE TOOL NAME from the schema keys
3. SELECT COMPONENT NAMES FROM THE "components" ARRAY of each identified tool
4. INCLUDE BOTH the tool name and the component details for ALL tools in your response
5. If NO tools were called in the ADK response, return an empty array []
6. If MULTIPLE tools were called, include components for ALL of them

## Input Format
You will receive:
- **User Query**: The original business question or request
- **ADK Response**: The analytical response from the MultiAgent-adk framework
- **Context**: Any additional context about the analysis

## Output Requirements
Return a JSON array containing objects in this EXACT format:

**For multiple tools called in ADK:**
```json
[
  {
    "toolname": "first-tool-name-from-adk-output",
    "componentName": "component-from-first-tool",
    "body": {
      "parameter1": "value_extracted_from_user_query",
      "parameter2": "value_extracted_from_user_query"
    }
  },
  {
    "toolname": "first-tool-name-from-adk-output",
    "componentName": "another-component-from-first-tool",
    "body": {
      "parameter1": "value_extracted_from_user_query"
    }
  },
  {
    "toolname": "second-tool-name-from-adk-output",
    "componentName": "component-from-second-tool",
    "body": {
      "parameter1": "value_extracted_from_user_query"
    }
  }
]
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
   - Select appropriate components from that tool's "components" array based on the analysis performed
   - Determine how many components are needed for that tool (could be 1 or multiple)
3. **Use each tool's parameters schema** to build the body for each selected component
4. **Include the tool name** in each response object
5. **Return empty array** if no tools were executed in the ADK response

## Critical Rules

### Parameter Extraction Rules
1. **NEVER generate random or calculated values** - all parameter values must come directly from the user query
2. **Date parameters**: Extract dates mentioned in user query (e.g., "2023 sales" → start_date: "2023-01-01", end_date: "2023-12-31")
3. **Metrics**: Use metrics explicitly mentioned or strongly implied in the query
4. **Categories/Dimensions**: Extract specific categories, regions, products mentioned by user
5. **Time granularity**: Infer from user's time-related language ("monthly trends" → "monthly", "daily performance" → "daily")
6. **Thresholds**: Use exact numbers mentioned in query, or use schema defaults if not specified

### Tool and Component Selection Logic
1. **Analyze ADK output first**: Look for tool execution results, function calls, or analysis outputs
2. **Match ADK tools to schema tools**: Map what ADK executed to available visualization tools
3. **Multiple tools handling**: If ADK called multiple tools, include components for each one
4. **Component quantity per tool**: Each tool may need 1 or multiple components based on the complexity of analysis
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
  },
  {
    "toolname": "sales-performance",
    "componentName": "distribution",
    "body": {
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
      "dimension": "region",
      "metric": "revenue"
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
  },
  {
    "toolname": "customer-behaviour",
    "componentName": "radar",
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
- [ ] Multiple components per tool are included when appropriate

## Edge Cases
- **No tools called**: Return empty array [] if ADK response shows no tool execution
- **Multiple tools called**: Include components for ALL tools that were executed
- **Ambiguous tool mapping**: Choose the most likely schema tool based on ADK output context
- **Missing parameters**: Use schema defaults only when user provides no relevant information
- **Multiple time periods**: Create separate components for each period if needed
- **Complex multi-tool analysis**: Each tool may need multiple components - include as many as appropriate
- **Tool execution errors**: If ADK shows tool errors but some tools succeeded, include components for successful tools only

## Response Format
Return only the JSON array, no additional text or explanations. Ensure the JSON is properly formatted and valid.

**CRITICAL REQUIREMENTS:**
1. **Analyze ADK response first** - identify which tools were actually called/executed
2. **Return empty array []** if no tools were called in ADK response  
3. **Include ALL tools** that were called in ADK response
4. **Multiple components per tool** are allowed and encouraged when appropriate
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

async def get_audio(text: str) -> str:
  
  response = {
    "mime_type": "audio/wav",
    "data": ""
  }

  audio_response = gemini_client.models.generate_content(
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

  # chunks = []
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

  return response


def get_audio_from_file():
    path = os.path.join(os.path.dirname(__file__), "audio.wav")
    with open(path, "rb") as file:
        return {"mime_type": "audio/wav", "data": base64.b64encode(file.read()).decode('utf-8')}
    
def get_audio_from_base64(base64_data: str) -> str:
    return base64.b64decode(base64_data)

def get_visualisation(user_query: str, adk_response: str) -> dict:
    prompt = f"""
    {VIS_SCHEMA_PROMPT}
    
    ## Input Data
    **User Query**: {user_query}
    **ADK Response**: {adk_response}
    
    Please analyze the above input and return the appropriate visualization components as a JSON array.
    """

    
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
    except Exception as e:
        # print('error in get_visualisation', e)
        return None
    
    response_text = response.candidates[0].content.parts[0].text.strip()

    response_text = response_text.replace("```json", "").replace("```", "").strip()

    # print("\n\nresponse_text\n\n", response_text)

    response_json = json.loads(response_text)

    # print("\n\nresponse_json\n\n", response_json)

    return response_json
