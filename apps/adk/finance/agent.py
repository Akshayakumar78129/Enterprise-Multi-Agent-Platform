from google.adk.agents import Agent

from orchestration_agent.tools.finance.financial_tool import cash_flow_analysis, revenue_forecast
from orchestration_agent.tools.finance.ar_aging_analysis import analyze_ar_aging
from finance.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="financial_agent",
    model=model,
    instruction=PROMPT,
    description="Handles any financial insights and analysis including AR aging",
    tools=[cash_flow_analysis, revenue_forecast, analyze_ar_aging]
)