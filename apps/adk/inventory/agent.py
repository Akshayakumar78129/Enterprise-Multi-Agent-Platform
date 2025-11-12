from google.adk.agents import Agent

# Import new inventory tools from updated locations
from orchestration_agent.tools.inventory.holding_cost import analyze_holding_costs
from orchestration_agent.tools.inventory.inventory_level import analyze_inventory_levels
from orchestration_agent.tools.inventory.stock_optimization import optimize_stock_levels

# Keep old tools from inventory_manager for now (to be migrated)
from orchestration_agent.tools.inventory.inventory_manager.SlowMovingInventoryAnalyzer import analyze_slow_moving_inventory

from inventory.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="inventory_agent",
    model=model,
    instruction=PROMPT,
    description="Handles inventory insights and analysis including holding costs, stock levels, optimization, and slow-moving inventory",
    tools=[
        analyze_holding_costs,        # Holding cost analysis
        analyze_inventory_levels,     # Stock level analysis
        optimize_stock_levels,        # Stock optimization with EOQ and reorder points
        analyze_slow_moving_inventory # Slow-moving inventory analysis
    ]
)