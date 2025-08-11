from google.adk.agents import Agent

from orchestration_agent.tools.financial_tool import cash_flow_analysis, revenue_forecast
from finance.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="financial_agent",
    model=model,
    instruction=PROMPT,
    description="Handles any financial insights and analysis",
    tools=[cash_flow_analysis, revenue_forecast]
)