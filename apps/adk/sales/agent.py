from google.adk.agents import Agent

from orchestration_agent.tools.sales.sales_analyst import register_tools
from sales.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="sales_agent",
    model=model,
    instruction=PROMPT,
    description="Handles any sales analytics and insights including demand forecast, product performance, sales trends, sales performance",
    tools=[tool["function"] for tool in register_tools()]
)