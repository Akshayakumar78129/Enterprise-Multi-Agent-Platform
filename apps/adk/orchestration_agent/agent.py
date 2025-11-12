"""Root orchestration agent for the travel concierge."""

import os
from typing import List

from google.adk.agents import Agent, LlmAgent, SequentialAgent, LoopAgent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from google.adk.tools import agent_tool
from google.adk.models.lite_llm import LiteLlm
from orchestration_agent import prompt
from pydantic import BaseModel, Field
from orchestration_agent.prompt import ROOT_AGENT_INSTR, CUSTOMER_INSTR, FINANCIAL_INSTR, SALES_INSTR, INVENTORY_INSTR

from orchestration_agent.tools.customer.customer_behaviour import analyze_customer_behavior
from orchestration_agent.tools.finance.cash_flow import analyze_cash_flow
from orchestration_agent.tools.finance.financial_tool import revenue_forecast
from orchestration_agent.tools.customer.customer_segmentation import identify_customer_segments
from orchestration_agent.tools.customer.customer_lifetime_value import predict_customer_ltv
from orchestration_agent.tools.customer.churn_prediction import predict_churn_risk
from orchestration_agent.tools.customer.performance_deviation import analyze_performance_deviations
from orchestration_agent.tools.customer.next_purchase import predict_next_purchase
from orchestration_agent.tools.customer.transaction_patterns import analyze_transaction_patterns
from orchestration_agent.tools.customer.anomaly_detection import detect_anomalies
from orchestration_agent.tools.customer.engagement_classifier import classify_customer_engagement
from orchestration_agent.tools.customer.retention_planner import plan_retention_strategy
from orchestration_agent.tools.customer.purchase_frequency import analyze_purchase_frequency
from orchestration_agent.tools.sales.sales_performance import analyze_sales_performance as analyze_sales_performance_adk
from orchestration_agent.tools.sales.product_performance import analyze_product_performance as analyze_product_performance_adk
from orchestration_agent.tools.sales.sales_analyst import register_tools as register_sales_analyst_tools
from orchestration_agent.tools.sales.sales_analyst.tools.RegionalSalesAnalyzer import analyze_regional_sales
from orchestration_agent.tools.inventory.inventory_manager.InventoryHoldingCostAnalyzer import analyze_holding_costs
from orchestration_agent.tools.inventory.inventory_manager.InventoryLevelAnalyzer import analyze_inventory_levels
# from orchestration_agent.tools.inventory.inventory_manager.InventoryOptimizationAnalyzer import analyze_inventory_optimization
from orchestration_agent.tools.inventory.inventory_manager.SlowMovingInventoryAnalyzer import analyze_slow_moving_inventory
from orchestration_agent.tools.inventory.inventory_manager.StockOptimizationRecommender import optimize_stock_levels


class OutputSchema(BaseModel):
    text: str = Field(description="The text output should be what you want to convey to the user in a chat interface.")
    speak: str = Field(description="The speak output should be what you want to convey to the user in a voice interface keeping it interactive and engaging.")



envModel = os.getenv("MODEL", "gemini-2.5-flash")
modelProvider = os.getenv("MODEL_PROVIDER", "gemini")
model = envModel
if modelProvider == "groq":
        model = LiteLlm(model=f"groq/{envModel}")
elif modelProvider == "cerebras":
        model = LiteLlm(model=f"cerebras/{envModel}")

print(f"Using model: {model}")

class StandardOutputSchema(BaseModel):
        text: str = Field(description="The text output should be what you want to convey to the user.")
        is_visualisation: bool = Field(description="Whether the output uses visualisation or not.")
        tools_called: List[str] = Field(default_factory=list, description="List of tool names that were called during analysis (e.g., ['churn-prediction', 'customer-segmentation'])")


# def standard_output(text: str) -> Agent:
#         return Agent(
#                 name=f"standard_output_{text}",
#                 model=model,
#                 instruction=STANDARD_OUTPUT_INSTR,
#                 output_schema=StandardOutputSchema,
#                 output_key="standard_output",
#                 description="This agent is used to output the text to the user.",
#         )

# Get sales analyst tools (legacy)
sales_analyst_tools = register_sales_analyst_tools()
print("\nRegistered Sales Analyst Tools:")
for tool in sales_analyst_tools:
    print(f"- {tool['name']}: {tool['description']}")

# Add new ADK-based sales tools (these use the same processing services as dashboards)
adk_sales_tools = [
    {
        "name": "analyze_sales_performance_unified",
        "description": "Analyze sales performance using unified ADK data (same as Sales Performance dashboard). Supports time periods, regions, categories, products. Returns consistent data with dashboard.",
        "function": analyze_sales_performance_adk
    },
    {
        "name": "analyze_product_performance_unified",
        "description": "Analyze product performance using unified ADK data (same as Product Performance dashboard). Supports time periods, categories, products, margin filters. Returns consistent data with dashboard.",
        "function": analyze_product_performance_adk
    }
]

print("\nRegistered ADK Sales Tools (Dashboard-Consistent):")
for tool in adk_sales_tools:
    print(f"- {tool['name']}: {tool['description']}")



# Initialize agents with their respective tools
inventory_agent = Agent(
        name="inventory_agent",
        model=model,
        instruction=INVENTORY_INSTR,
        output_key="agent_output",
        tools=[analyze_holding_costs, analyze_inventory_levels, analyze_slow_moving_inventory, optimize_stock_levels]
)

# inventory_output_agent = SequentialAgent(
#         name="inventory_output_agent",
#         description="This agent is used to output the inventory analysis to the user.",
#         sub_agents=[inventory_agent, standard_output("inventory_analysis")]
# )

# Initialize sales agent with tools (ONLY ADK tools for dashboard consistency)
sales_agent = Agent(
        name="sales_agent",
        model=model,
        instruction=SALES_INSTR,
        output_key="agent_output",
        description="Handles sales performance and product analytics. Uses unified ADK data for consistency with dashboards.",
        tools=[tool["function"] for tool in adk_sales_tools]
 )

# sales_output_agent = SequentialAgent(
#         name="sales_output_agent",
#         description="This agent is used to output the sales analysis to the user.",
#         sub_agents=[sales_agent, standard_output("sales_analysis")]
# )

customer_agent = Agent(
        name="customer_insights_agent",
        model=model,
        instruction=CUSTOMER_INSTR,
        output_key="agent_output",
        # Crucial for delegation: Clear description of capability
        description="Handles customer analytics and insights including segmentation, behavior analysis, lifetime value prediction, churn risk prediction, performance deviations, next likely purchases, transaction patterns, anomaly detection, engagement classification, retention action planning, and purchase frequency analysis",
        tools=[analyze_customer_behavior, identify_customer_segments, predict_customer_ltv, predict_churn_risk, analyze_performance_deviations, predict_next_purchase, analyze_transaction_patterns, detect_anomalies, classify_customer_engagement, plan_retention_strategy, analyze_purchase_frequency]
 )

# customer_output_agent = SequentialAgent(
#         name="customer_output_agent",
#         description="This agent is used to output the customer analysis to the user.",
#         sub_agents=[customer_agent, standard_output("customer_analysis")]
# )

financial_agent = Agent(
        name="financial_agent",
        model=model,
        instruction=FINANCIAL_INSTR,
        output_key="agent_output",
        # Crucial for delegation: Clear description of capability
        description="Handles financial analytics and insights including cash flow, revenue forecasting, and performance tracking",
        tools=[analyze_cash_flow, revenue_forecast]
)

# financial_output_agent = SequentialAgent(
#         name="financial_output_agent",
#         description="This agent is used to output the financial analysis to the user.",
#         sub_agents=[financial_agent, standard_output("financial_analysis")]
# )

root_agent = Agent(
        name="orchestration_agent", 
        model=model,
        description=ROOT_AGENT_INSTR,
        output_key="orchestration",
        sub_agents=[customer_agent, financial_agent, sales_agent, inventory_agent],
        # tools=[agent_tool.AgentTool(customer_agent), agent_tool.AgentTool(financial_agent), agent_tool.AgentTool(sales_agent), agent_tool.AgentTool(inventory_agent)]
)

# output_agent = Agent(
#         name="output_agent",
#         model=model,
#         description=OUTPUT_INSTR,
#         output_key="output",
#         output_schema=OutputSchema,
# )

# def exit_tool(tool_context: ToolContext):
#         tool_context.actions.escalate = True
#         return {}

# exit_agent = Agent(
#         name="exit_agent",
#         model=model,
#         instruction=EXIT_INSTR,
#         description="This agent is used to exit the loop and end the conversation.",
#         tools=[exit_tool]
# )

# root_agent = LoopAgent(
#         name="root_agent",
#         sub_agents=[orchestration_agent, output_agent, exit_agent]
# )

# from visualization_agent.agent import create_sequential_pipeline

# root_agent = create_sequential_pipeline(orchestration_agent)
# print("\\nVisualization pipeline created successfully!")
