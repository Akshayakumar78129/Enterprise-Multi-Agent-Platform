"""Agent Router - Intelligent query routing to appropriate agent tools"""

import re
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

@dataclass(frozen=True)
class AgentRoute:
    """Represents a routing rule for an agent"""
    name: str
    tool_module: str
    tool_function: str
    keywords: Tuple[str, ...]  # Use tuple for hashability
    patterns: Tuple[str, ...]  # Use tuple for hashability
    description: str

# Define agent routing configuration
AGENT_ROUTES = [
    AgentRoute(
        name="churn_prediction",
        tool_module="orchestration_agent.tools.churn_prediction",
        tool_function="predict_churn_risk",
        keywords=("churn", "risk", "retention", "at-risk", "high-risk", "customer health"),
        patterns=(r"churn\s+risk", r"customer.*risk", r"retention.*analysis", r"at[\s-]risk"),
        description="Analyzes customer churn risk and provides retention insights"
    ),
    AgentRoute(
        name="sales_performance",
        tool_module="orchestration_agent.tools.sales_performance",
        tool_function="analyze_sales_performance",
        keywords=("sales", "revenue", "deals", "pipeline", "quota", "performance", "growth"),
        patterns=(r"sales\s+performance", r"revenue.*analysis", r"sales.*trend", r"pipeline.*status"),
        description="Provides sales performance metrics and insights"
    ),
    AgentRoute(
        name="customer_behavior",
        tool_module="orchestration_agent.tools.customer_behaviour",
        tool_function="analyze_customer_behavior",
        keywords=("customer", "behavior", "purchase", "buying", "pattern", "engagement"),
        patterns=(r"customer\s+behavior", r"purchase.*pattern", r"buying.*trend", r"customer.*engagement"),
        description="Analyzes customer behavior patterns and engagement"
    ),
    AgentRoute(
        name="customer_segmentation",
        tool_module="orchestration_agent.tools.customer_segmentation",
        tool_function="segment_customers",
        keywords=("segment", "segmentation", "cluster", "group", "categorize", "customer type"),
        patterns=(r"customer\s+segment", r"segment.*analysis", r"customer.*group", r"cluster.*customer"),
        description="Segments customers based on various attributes"
    ),
    AgentRoute(
        name="customer_ltv",
        tool_module="orchestration_agent.tools.customer_lifetime_value",
        tool_function="calculate_customer_ltv",
        keywords=("ltv", "lifetime value", "customer value", "clv", "customer worth"),
        patterns=(r"lifetime\s+value", r"ltv", r"customer.*value", r"clv\s+analysis"),
        description="Calculates and analyzes customer lifetime value"
    ),
    AgentRoute(
        name="anomaly_detection",
        tool_module="orchestration_agent.tools.anomaly_detection",
        tool_function="detect_anomalies",
        keywords=("anomaly", "unusual", "outlier", "abnormal", "irregular", "suspicious"),
        patterns=(r"anomal", r"unusual.*pattern", r"outlier", r"abnormal.*behavior"),
        description="Detects anomalies and unusual patterns in data"
    ),
    AgentRoute(
        name="financial_analysis",
        tool_module="orchestration_agent.tools.financial_tool",
        tool_function="analyze_financial_metrics",
        keywords=("finance", "financial", "profit", "loss", "margin", "cost", "budget", "roi"),
        patterns=(r"financial.*analysis", r"profit.*loss", r"roi\s+analysis", r"budget.*performance"),
        description="Provides financial analysis and metrics"
    ),
    AgentRoute(
        name="inventory_management",
        tool_module="orchestration_agent.tools.inventory_management",
        tool_function="analyze_inventory",
        keywords=("inventory", "stock", "warehouse", "supply", "product availability"),
        patterns=(r"inventory.*level", r"stock.*status", r"warehouse.*management", r"supply.*chain"),
        description="Analyzes inventory levels and supply chain metrics"
    ),
    AgentRoute(
        name="engagement_classifier",
        tool_module="orchestration_agent.tools.engagement_classifier",
        tool_function="classify_engagement",
        keywords=("engagement", "interaction", "activity", "user activity", "engagement level"),
        patterns=(r"engagement.*level", r"user.*interaction", r"activity.*analysis"),
        description="Classifies and analyzes customer engagement levels"
    )
]

class AgentRouter:
    """Routes queries to appropriate agent tools based on content analysis"""

    def __init__(self):
        self.routes = AGENT_ROUTES
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns for efficiency"""
        # Store compiled patterns in a separate dict since routes are frozen
        self.compiled_patterns = {}
        for route in self.routes:
            self.compiled_patterns[route.name] = [re.compile(pattern, re.IGNORECASE) for pattern in route.patterns]

    def find_best_agent(self, query: str) -> Tuple[Optional[AgentRoute], float]:
        """
        Find the best matching agent for a given query

        Args:
            query: User query string

        Returns:
            Tuple of (best_route, confidence_score)
        """
        query_lower = query.lower()
        scores = {}

        for route in self.routes:
            score = 0.0

            # Check keyword matches (weight: 0.3 each)
            keyword_matches = sum(1 for kw in route.keywords if kw in query_lower)
            score += keyword_matches * 0.3

            # Check pattern matches (weight: 0.5 each)
            compiled = self.compiled_patterns.get(route.name, [])
            pattern_matches = sum(1 for pattern in compiled if pattern.search(query))
            score += pattern_matches * 0.5

            # Check for explicit agent mention (weight: 1.0)
            if f"@{route.name}" in query or route.name.replace("_", " ") in query_lower:
                score += 1.0

            scores[route] = score

        # Get the best match
        if scores:
            best_route = max(scores.items(), key=lambda x: x[1])
            if best_route[1] > 0:  # Only return if there's some match
                return best_route[0], best_route[1]

        return None, 0.0

    def extract_agent_mention(self, query: str) -> Tuple[Optional[str], str]:
        """
        Extract explicit agent mention from query (e.g., @sales_agent)

        Args:
            query: User query string

        Returns:
            Tuple of (agent_name, cleaned_query)
        """
        pattern = r'@(\w+)(?:_agent)?'
        match = re.search(pattern, query)

        if match:
            agent_name = match.group(1)
            cleaned_query = re.sub(pattern, '', query).strip()
            return agent_name, cleaned_query

        return None, query

    async def route_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Route a query to the appropriate agent and execute it

        Args:
            query: User query string
            context: Optional context dictionary

        Returns:
            Dict containing agent response
        """
        # Check for explicit agent mention
        agent_mention, cleaned_query = self.extract_agent_mention(query)

        # Find best matching agent
        if agent_mention:
            # Try to find route by explicit mention
            route = next((r for r in self.routes if r.name == agent_mention or
                         r.name.startswith(agent_mention)), None)
            confidence = 1.0 if route else 0.0
        else:
            route, confidence = self.find_best_agent(query)

        if not route:
            return {
                "success": False,
                "message": "I couldn't determine which agent to use for your query. Please try rephrasing or use @agent_name to specify.",
                "suggestions": self.get_agent_suggestions()
            }

        try:
            # Dynamically import and execute the agent tool
            # Use importlib for better control over imports
            import importlib
            import sys

            # Clear any cached imports to ensure fresh import
            if route.tool_module in sys.modules:
                del sys.modules[route.tool_module]

            module = importlib.import_module(route.tool_module)
            tool_function = getattr(module, route.tool_function)

            # Prepare arguments based on the specific tool
            kwargs = self._prepare_tool_arguments(route.name, cleaned_query if agent_mention else query, context)

            # Execute the tool
            result = tool_function(**kwargs)

            return {
                "success": True,
                "agent": route.name,
                "confidence": confidence,
                "result": result,
                "description": route.description
            }

        except ImportError as e:
            # Handle case where Google ADK is not available
            return {
                "success": False,
                "agent": route.name,
                "message": f"Agent '{route.name}' requires Google ADK which is not installed. Dashboard data is still available via API.",
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "agent": route.name,
                "message": f"Error executing agent '{route.name}': {str(e)}",
                "error": str(e)
            }

    def _prepare_tool_arguments(self, agent_name: str, query: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare arguments for specific agent tools

        Args:
            agent_name: Name of the agent
            query: User query
            context: Optional context

        Returns:
            Dict of arguments for the tool function
        """
        # Default arguments for most tools
        kwargs = {}

        # Specific argument preparation based on agent
        if agent_name == "churn_prediction":
            # Extract time period from query
            if "last year" in query.lower():
                kwargs["time_period"] = "last_year"
            elif "last 180" in query.lower():
                kwargs["time_period"] = "last_180_days"
            elif "last 90" in query.lower():
                kwargs["time_period"] = "last_90_days"
            else:
                kwargs["time_period"] = "last_90_days"  # Default

            kwargs["include_visualization"] = True

        elif agent_name == "sales_performance":
            kwargs["query"] = query
            kwargs["include_metrics"] = True

        elif agent_name in ["customer_behavior", "customer_segmentation", "customer_ltv"]:
            kwargs["query"] = query
            if context and "filters" in context:
                kwargs["filters"] = context["filters"]

        elif agent_name == "financial_analysis":
            kwargs["query"] = query
            kwargs["include_forecast"] = "forecast" in query.lower()

        elif agent_name == "inventory_management":
            kwargs["query"] = query
            kwargs["include_recommendations"] = True

        else:
            # Generic arguments
            kwargs["query"] = query

        # Don't add context unless the tool explicitly expects it
        # Most tools don't have a context parameter

        return kwargs

    def get_agent_suggestions(self) -> List[Dict[str, str]]:
        """Get list of available agents with descriptions"""
        return [
            {
                "name": route.name,
                "usage": f"@{route.name}",
                "description": route.description,
                "keywords": route.keywords[:5]  # Show first 5 keywords
            }
            for route in self.routes
        ]

    def get_agent_capabilities(self) -> Dict[str, List[str]]:
        """Get capabilities grouped by category"""
        return {
            "Customer Analytics": [
                "churn_prediction",
                "customer_behavior",
                "customer_segmentation",
                "customer_ltv",
                "engagement_classifier"
            ],
            "Sales & Revenue": [
                "sales_performance",
                "financial_analysis"
            ],
            "Operations": [
                "inventory_management",
                "anomaly_detection"
            ]
        }

# Create singleton instance
agent_router = AgentRouter()

# Export main routing function
async def route_to_agent(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Main entry point for routing queries to agents

    Args:
        query: User query string
        context: Optional context dictionary

    Returns:
        Dict containing agent response
    """
    return await agent_router.route_query(query, context)