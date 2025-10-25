"""AI-powered insights generator using Google Gemini

This module provides centralized AI insights generation for all dashboards,
combining fast rule-based insights with creative Gemini-powered analysis.
"""

import os
import time
from typing import Dict, List, Optional, Any
from functools import lru_cache
import google.generativeai as genai

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def generate_ai_insights(
    dashboard_type: str,
    kpis: Dict[str, Any],
    data_summary: Dict[str, Any],
    filters: Optional[Dict[str, Any]] = None
) -> List[str]:
    """Generate AI-powered insights using Gemini 2.5 Flash

    Args:
        dashboard_type: Type of dashboard (e.g., 'churn_prediction', 'customer_ltv')
        kpis: Key performance indicators from the dashboard
        data_summary: Summary of data for context (top segments, trends, etc.)
        filters: Applied filters for context

    Returns:
        List of AI-generated insight strings, or empty list on error

    Example:
        >>> insights = generate_ai_insights(
        ...     dashboard_type='churn_prediction',
        ...     kpis={'totalCustomers': 1234, 'highRiskCount': 156},
        ...     data_summary={'revenue_at_risk': 1250000, 'top_factor': 'Transaction Frequency'}
        ... )
    """
    if not GEMINI_API_KEY:
        print("[AI Insights] GEMINI_API_KEY not set, skipping AI insights generation")
        return []

    try:
        start_time = time.time()

        # Build the prompt
        prompt = _build_insight_prompt(dashboard_type, kpis, data_summary, filters)

        # Generate using Gemini
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,  # Balance creativity and consistency
                max_output_tokens=1500,  # ~300 words for 3-5 insights
                top_p=0.9
            )
        )

        # Parse response
        insights = _parse_ai_response(response.text)

        generation_time = (time.time() - start_time) * 1000  # Convert to ms
        print(f"[AI Insights] Generated {len(insights)} insights for {dashboard_type} in {generation_time:.0f}ms")

        return insights

    except Exception as e:
        print(f"[AI Insights] Error generating insights for {dashboard_type}: {e}")
        return []  # Graceful fallback


def _build_insight_prompt(
    dashboard_type: str,
    kpis: Dict[str, Any],
    data_summary: Dict[str, Any],
    filters: Optional[Dict[str, Any]]
) -> str:
    """Build dashboard-specific prompt for Gemini

    This imports the appropriate prompt template and formats it with data.
    """
    try:
        from lib.insight_prompts import get_prompt_template

        # Get dashboard-specific template
        template = get_prompt_template(dashboard_type)

        # Format with actual data
        prompt = template.format(
            kpis=kpis,
            data_summary=data_summary,
            filters=filters or {},
            **kpis,  # Unpack KPIs for direct access
            **data_summary  # Unpack summary for direct access
        )

        return prompt

    except Exception as e:
        print(f"[AI Insights] Error building prompt: {e}")
        # Fallback to generic prompt
        return _build_generic_prompt(dashboard_type, kpis, data_summary)


def _build_generic_prompt(
    dashboard_type: str,
    kpis: Dict[str, Any],
    data_summary: Dict[str, Any]
) -> str:
    """Fallback generic prompt if template not found"""

    # Format KPIs for display
    kpis_text = "\n".join([f"- {k}: {v}" for k, v in kpis.items()])

    # Format data summary
    summary_text = "\n".join([f"- {k}: {v}" for k, v in data_summary.items()])

    return f"""You are a senior business analyst reviewing {dashboard_type.replace('_', ' ')} data.

CONTEXT:
Dashboard: {dashboard_type.replace('_', ' ').title()}

Key Metrics:
{kpis_text}

Data Summary:
{summary_text}

INSTRUCTIONS:
Generate 3-5 strategic, actionable insights that:
1. Explain WHY this matters for business outcomes
2. Provide SPECIFIC action items (not generic advice)
3. Include expected outcomes, ROI, or success metrics
4. Consider segment/category-specific strategies where relevant
5. Prioritize by urgency using: CRITICAL | HIGH | MODERATE | INFO

FORMAT:
- One insight per line
- 2-3 sentences each
- Start with priority label (CRITICAL, HIGH, MODERATE, INFO)
- Include "**Action:**" for actionable items
- Be specific with numbers and timelines

EXAMPLE:
CRITICAL: High-value segment shows 30% risk rate (2x normal), indicating potential competitive pressure. **Action:** Conduct win-loss interviews with 10 churned accounts within 2 weeks to identify gaps. Expected outcome: 15-20% risk reduction through targeted interventions.
"""


def _parse_ai_response(response_text: str) -> List[str]:
    """Parse Gemini response into list of insight strings

    Args:
        response_text: Raw text response from Gemini

    Returns:
        List of cleaned insight strings
    """
    if not response_text:
        return []

    # Split by newlines and filter empty lines
    lines = [line.strip() for line in response_text.split('\n') if line.strip()]

    # Filter for lines that look like insights (start with priority labels or bullets)
    insights = []
    for line in lines:
        # Check if line starts with priority labels or bullets (NO EMOJIS)
        if (line.startswith('CRITICAL:') or line.startswith('HIGH:') or
            line.startswith('MODERATE:') or line.startswith('INFO:') or
            line.startswith('HIGH-VALUE:') or line.startswith('GROWTH OPP:') or
            line.startswith('RISK:') or line.startswith('STRATEGIC:') or
            line.startswith('VIP PRIORITY:') or line.startswith('EXPANSION:') or
            line.startswith('ACCELERATION:') or line.startswith('SCALE:') or
            line.startswith('- ') or line.startswith('* ')):

            # Remove bullet points if present
            cleaned = line.lstrip('- *').strip()
            if cleaned and len(cleaned) > 20:  # Must be substantial
                insights.append(cleaned)

    # If no priority-prefixed insights found, take substantial lines with Action:
    if not insights:
        insights = [line for line in lines if len(line) > 50 and '**Action:**' in line]

    return insights[:5]  # Limit to 5 insights max


# Optional: Add caching for identical requests (useful for development)
@lru_cache(maxsize=50)
def _cached_generate(dashboard_type: str, kpis_hash: str, summary_hash: str) -> List[str]:
    """Cached version for identical requests (experimental)

    Note: Only use if kpis/summary can be reliably hashed
    """
    # This is a placeholder for potential caching implementation
    pass
