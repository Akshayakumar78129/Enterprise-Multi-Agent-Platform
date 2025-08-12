from google.adk.agents import Agent

from orchestration_agent.tools.inventory_manager.InventoryHoldingCostAnalyzer import analyze_holding_costs
from orchestration_agent.tools.inventory_manager.InventoryLevelAnalyzer import analyze_inventory_levels
from orchestration_agent.tools.inventory_manager.SlowMovingInventoryAnalyzer import analyze_slow_moving_inventory
from orchestration_agent.tools.inventory_manager.StockOptimizationRecommender import optimize_stock_levels

from inventory.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="inventory_agent",
    model=model,
    instruction=PROMPT,
    description="Handles any inventory insights and analysis",
    tools=[analyze_holding_costs, analyze_inventory_levels, analyze_slow_moving_inventory, optimize_stock_levels]
)