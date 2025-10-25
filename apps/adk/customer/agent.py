from google.adk.agents import Agent

from orchestration_agent.tools.customer_behaviour import analyze_customer_behavior
from orchestration_agent.tools.customer_segmentation import identify_customer_segments
from orchestration_agent.tools.customer_lifetime_value import predict_customer_ltv
from orchestration_agent.tools.churn_prediction import predict_churn_risk
from orchestration_agent.tools.performance_deviation import analyze_performance_deviations
from orchestration_agent.tools.next_purchase import predict_next_purchase
from orchestration_agent.tools.transaction_patterns import analyze_transaction_patterns
from orchestration_agent.tools.anomaly_detection import detect_anomalies
from orchestration_agent.tools.engagement_classifier import classify_customer_engagement
from orchestration_agent.tools.retention_planner import plan_retention_strategy

from customer.prompt import PROMPT

from orchestration_agent.agent import model

root_agent = Agent(
    name="customer_agent",
    model=model,
    instruction=PROMPT,
    description="Handles any customer insights and analysis",
    tools=[analyze_customer_behavior, identify_customer_segments, predict_customer_ltv, predict_churn_risk, analyze_performance_deviations, predict_next_purchase, analyze_transaction_patterns, detect_anomalies, classify_customer_engagement, plan_retention_strategy]
)