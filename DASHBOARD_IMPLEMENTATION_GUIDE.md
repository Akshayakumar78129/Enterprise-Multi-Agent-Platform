# Dashboard Migration & Implementation Guide

**Version**: 1.0
**Last Updated**: 2025-10-07
**Purpose**: Complete guide for implementing or migrating any dashboard following the standardized architecture used in Sales Performance, Customer Segmentation, Customer LTV, and Product Performance dashboards.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [Phase 1: Backend ADK Tool](#phase-1-backend-adk-tool)
4. [Phase 2: Frontend Visualization Components](#phase-2-frontend-visualization-components)
5. [Phase 3: Enterprise-IQ Integration](#phase-3-enterprise-iq-integration)
6. [Phase 4: Context & State Management](#phase-4-context--state-management)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Common Issues & Fixes](#common-issues--fixes)
9. [Success Criteria Checklist](#success-criteria-checklist)
10. [Reference Implementations](#reference-implementations)

---

## Architecture Overview

### Technology Stack
- **Backend**: Python 3.11+, FastAPI, SQLite
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js, Recharts
- **State**: Redux Toolkit + React Context API
- **AI Agent**: Google Gemini 2.5 Flash

### Key Patterns

#### 1. Metadata-Only Visualization Pattern
**Problem**: Agent tools returning large datasets cause token bloat and slow responses.

**Solution**: Tools output only filter metadata, not data arrays. Frontend fetches actual data from summary APIs.

```python
# ❌ OLD: Tool outputs full data
{
  "topProducts": [{"name": "Laptop", "revenue": 50000}, ...],  # 100+ items
  "categoryData": [...]  # Large arrays
}

# ✅ NEW: Tool outputs only metadata
{
  "toolname": "product-performance",
  "componentName": "topProducts",
  "body": {
    "dateFrom": "2017-01-01",
    "dateTo": "2021-12-31",
    "categories": ["Technology"],
    "topN": 20
    // Only filter parameters, NO data
  }
}
```

#### 2. Component Registry System
Maps `toolname.componentName` to React components dynamically.

```typescript
// apps/frontend/src/app/enterprise-iq/page.tsx
const componentRegistry = {
  'product-performance': {
    kpis: dynamic(() => import('../product-performance/components').then(mod => mod.ProductKPIs)),
    overview: dynamic(() => import('../product-performance/components').then(mod => mod.ProductPerformanceOverview)),
    topProducts: dynamic(() => import('../product-performance/components').then(mod => mod.TopProductsTable))
  }
};
```

#### 3. Prop Mappers
Transform API response structure to component props format.

```typescript
// apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts
'product-performance.topProducts': (summary) => {
  return {
    data: summary.mainData?.topProducts || [],
    loading: false
  };
}
```

#### 4. KPI Card Standards (Churn Prediction Reference)
**Problem**: Inconsistent KPI card styling, sizing, and formatting across dashboards creates poor UX.

**Solution**: All dashboards use shared `KPIRow` and `KPICard` components with standardized configuration.

**Reference Implementation** (Churn Prediction):
```typescript
// apps/frontend/src/app/churn-prediction/components/ChurnKPIs.tsx
export function ChurnKPIs({ data, loading }: ChurnKPIsProps) {
  const kpis = useMemo(() => {
    return [
      {
        id: "overall-churn-risk",
        title: "Overall Churn Risk",
        value: overallRisk,
        format: "percentage" as const,
        color: "#38bdf8",
      },
      {
        id: "critical-risk-customers",
        title: "At Risk Customers",
        value: atRiskCount,
        format: "number" as const,
        color: "#ef4444",
      },
      {
        id: "revenue-at-risk",
        title: "Revenue at Risk",
        value: revenueAtRisk,
        format: "currency" as const,
        color: "#f59e0b",
      },
      // ... more KPIs
    ];
  }, [data]);

  return <KPIRow kpis={kpis} columns={5} animationDelay={50} />;
}
```

**Shared Components** (`packages/components/src/kpi/`):
- `KPIRow.tsx` - Grid layout manager with responsive columns
- `KPICard.tsx` - Individual KPI card with animations and formatting

**Standard KPI Structure**:
```typescript
interface KPIData {
  id: string;                    // Unique identifier
  title: string;                 // Card header
  value: string | number;        // Metric value
  format: "number" | "currency" | "percentage" | "text";
  color?: string;                // Accent color (hex)
  subtitle?: string;             // Optional subtext
  trend?: number;                // Optional trend value
  trendDirection?: "up" | "down" | "neutral";
}
```

**Styling Standards**:
- **Grid**: `minmax(200px, 1fr)` - Equal width cards, responsive wrapping
- **Min Height**: Cards auto-adjust based on content
- **Title**: `text-sm font-medium text-muted`
- **Value**: `text-2xl sm:text-3xl font-bold text-foreground`
- **Format Options**:
  - `currency`: Compact notation (e.g., "$30M" instead of "$30,054,281")
  - `number`: Compact notation (e.g., "150K" instead of "150,000")
  - `percentage`: Fixed 1 decimal (e.g., "15.5%")
  - `text`: Plain string display
- **Animation**: Number count-up with easing, staggered delay
- **Card Style**: Glass-card with gradient background overlay
- **Hover**: Subtle lift effect (`-translate-y-1`)

**Usage in All Dashboards**:
```typescript
<KPIRow kpis={kpis} columns={5} animationDelay={50} />
```

**Benefits**:
- ✅ Uniform card width, height, and spacing across all dashboards
- ✅ Consistent title and metric styling
- ✅ Standardized number formatting (compact notation)
- ✅ Smooth animations with controlled delay
- ✅ Single source of truth for styling updates

#### 5. Sync Processing Service
Wrapper pattern for async database operations in agent tools.

```python
class ProductPerformanceProcessingService:
    def _run_async(self, func, *args, **kwargs):
        """Wrapper to run async functions synchronously"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(func(*args, **kwargs))

    def get_product_performance_data(self, filters: dict):
        """Sync wrapper for agent tool"""
        return self._run_async(self._get_product_performance_data, filters)
```

#### 6. Navigation State Management
**Problem**: When navigation drawer opens with blur overlay, floating action buttons (FABs) remain accessible due to higher z-index, causing UX inconsistency.

**Solution**: Lift navigation state to AppLayout and apply blur/disabled state to FABs when navigation is open.

**Z-Index Hierarchy**:
```
z-[60]  → Floating Action Buttons (blurred when navigation open)
z-[55]  → Expanded panels (full-screen mode)
z-50    → Navigation drawer + Side panels
z-40    → Navigation overlay (blur backdrop) + Dashboard header
z-1     → Main content
```

**Implementation Pattern**:

```typescript
// 1. DashboardNavigation.tsx - Notify parent of state changes
export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  onNavigationChange,  // ← New callback prop
  ...
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Notify parent when navigation state changes
  useEffect(() => {
    onNavigationChange?.(isOpen);
  }, [isOpen, onNavigationChange]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
      )}
      <div className="fixed left-0 top-0 h-full w-80 bg-surface z-50">
        {/* Navigation content */}
      </div>
    </>
  );
};

// 2. AppLayout.tsx - Manage navigation state
export function AppLayout({ ... }: AppLayoutProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <>
      <DashboardNavigation onNavigationChange={setIsNavigationOpen} />
      <FloatingActionButtons isNavigationOpen={isNavigationOpen} />
    </>
  );
}

// 3. FloatingActionButtons.tsx - Blur and disable when navigation open
export function FloatingActionButtons({
  isNavigationOpen = false,
  ...
}: FloatingActionButtonsProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 z-[60] flex flex-col items-end gap-3 transition-all duration-300",
        isNavigationOpen && "opacity-30 blur-sm pointer-events-none"
      )}
      style={{ right: rightPosition }}
    >
      {/* FABs render here */}
    </div>
  );
}
```

**Behavior**:
- ✅ Navigation opens → Overlay blurs content (z-40)
- ✅ Navigation drawer visible (z-50)
- ✅ FABs blurred out and non-interactive (opacity-30 blur-sm pointer-events-none)
- ✅ User can only interact with navigation or close overlay
- ✅ Navigation closes → FABs return to normal state

---

## Implementation Phases

### Phase 1: Backend ADK Tool (2-3 hours)

#### Step 1.1: Update Tool Output Format

**File**: `apps/adk/orchestration_agent/tools/{dashboard_name}.py`

```python
def analyze_product_performance(
    time_period: str = "default",
    categories: list = [],
    products: list = [],
    min_margin: float = None,
    max_margin: float = None,
    top_n: int = 20
) -> str:
    """Analyze product performance with metadata-only output"""

    # Initialize filters with 2017-2021 default
    filters = {}
    if time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    else:
        # Parse time_period (e.g., "2021", "Q1 2021", "Jan 2021")
        filters.update(parse_time_period(time_period))

    # Add other filters
    if categories:
        filters['categories'] = categories
    if products:
        filters['products'] = products
    if min_margin is not None:
        filters['minMargin'] = min_margin
    if max_margin is not None:
        filters['maxMargin'] = max_margin
    filters['topN'] = top_n

    # Get data from processing service
    service = ProductPerformanceProcessingService()
    data = service.get_product_performance_data(filters)

    # Generate text report for AI
    report = generate_text_report(data)

    # Add metadata-only visualization section
    viz_metadata = {
        "toolname": "product-performance",
        "componentName": "overview",  # or "topProducts", "categoryAnalysis", etc.
        "body": {
            "dateFrom": filters.get('dateFrom'),
            "dateTo": filters.get('dateTo'),
            "categories": filters.get('categories', []),
            "products": filters.get('products', []),
            "minMargin": filters.get('minMargin'),
            "maxMargin": filters.get('maxMargin'),
            "topN": filters.get('topN', 20)
        }
    }

    output = f"""{report}

## Visualization Data (Machine-Readable)
```json
{json.dumps(viz_metadata, indent=2)}
```

<output>
{json.dumps(viz_metadata)}
</output>
<is_visualisation>true</is_visualisation>
"""

    return output
```

**Key Points**:
- ✅ Default time period: 2017-2021
- ✅ Metadata-only in visualization section
- ✅ Include `<output>` and `<is_visualisation>true</is_visualisation>` tags
- ✅ Text report for AI + JSON for graph spawning

#### Step 1.2: Update COMPONENT_SCHEMA

**File**: `apps/adk/lib/utils.py`

```python
COMPONENT_SCHEMA = {
    "product-performance": {
        "components": [
            "kpis",              # KPI tiles
            "overview",          # Main overview chart
            "topProducts",       # Top products table
            "categoryAnalysis",  # Category comparison
            "marginAnalysis",    # Margin scatter plot
            "priceBands"         # Price band distribution
        ],
        "parameters": {
            "start_date": "date",
            "end_date": "date",
            "categories": "array",
            "products": "array",
            "priceBands": "array",
            "minMargin": "number|null",
            "maxMargin": "number|null",
            "topN": "number"
        }
    }
}
```

**Key Points**:
- ✅ List all component names that AI can suggest
- ✅ Define all parameter types
- ✅ Match frontend component names exactly

#### Step 1.3: Implement Hybrid Insights Generation

**Overview**: Combine fast rule-based insights with AI-powered strategic analysis using Google Gemini. This hybrid approach provides both deterministic insights (always present, no API cost) and creative strategic recommendations (optional, API-based).

**Architecture**:
```
Rule-Based Insights (Python)         AI Insights (Gemini)
      ↓                                     ↓
  Fast, Deterministic          +    Creative, Strategic
  No API Cost                       ~$0.0004 per request
  Always Present                    Graceful Fallback
      ↓                                     ↓
                    Combined Response
                    {
                      insights: [...],      // Rule-based
                      ai_insights: [...],   // AI-powered
                      insights_metadata: {...}
                    }
```

##### Step 1.3.1: Create AI Insights Generator Module

**File**: `apps/adk/lib/ai_insights_generator.py` (create if not exists)

```python
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
    """Generate AI-powered insights using Gemini 2.0 Flash

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
    kpis_text = "\\n".join([f"- {k}: {v}" for k, v in kpis.items()])

    # Format data summary
    summary_text = "\\n".join([f"- {k}: {v}" for k, v in data_summary.items()])

    return f\"\"\"You are a senior business analyst reviewing {dashboard_type.replace('_', ' ')} data.

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
- Start with text priority label (CRITICAL:, HIGH:, MODERATE:, INFO:)
- NO EMOJIS - use text labels only for professional appearance
- Include "**Action:**" for actionable items
- Be specific with numbers and timelines

EXAMPLE:
CRITICAL: High-value segment shows 30% risk rate (2x normal), indicating potential competitive pressure. **Action:** Conduct win-loss interviews with 10 churned accounts within 2 weeks to identify gaps. Expected outcome: 15-20% risk reduction through targeted interventions.
\"\"\"


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
    lines = [line.strip() for line in response_text.split('\\n') if line.strip()]

    # Filter for lines that look like insights (start with text priority labels or bullets)
    insights = []
    for line in lines:
        # Check if line starts with text priority labels (NO EMOJIS)
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
```

##### Step 1.3.2: Create Dashboard-Specific Prompt Templates

**File**: `apps/adk/lib/insight_prompts.py` (create if not exists)

```python
"""Dashboard-specific prompt templates for AI insights generation

Each dashboard has a customized prompt that provides context and instructions
for Gemini to generate strategic, actionable insights.
"""

from typing import Dict


def get_prompt_template(dashboard_type: str) -> str:
    """Get the appropriate prompt template for a dashboard type

    Args:
        dashboard_type: Dashboard identifier (e.g., 'churn_prediction', 'customer_ltv')

    Returns:
        Formatted prompt template string

    Raises:
        KeyError: If dashboard_type not found (caller should handle)
    """
    templates = {
        'churn_prediction': CHURN_PREDICTION_PROMPT,
        'churn': CHURN_PREDICTION_PROMPT,  # Alias
        'customer_segmentation': CUSTOMER_SEGMENTATION_PROMPT,
        'customer_ltv': CUSTOMER_LTV_PROMPT,
        'ltv': CUSTOMER_LTV_PROMPT,  # Alias
        'product_performance': PRODUCT_PERFORMANCE_PROMPT,
        'sales_performance': SALES_PERFORMANCE_PROMPT,
    }

    if dashboard_type not in templates:
        raise KeyError(f"No prompt template found for dashboard: {dashboard_type}")

    return templates[dashboard_type]


# ============================================================================
# CHURN PREDICTION PROMPT
# ============================================================================

CHURN_PREDICTION_PROMPT = \"\"\"You are a senior customer success analyst reviewing churn risk data for strategic decision-making.

CONTEXT:
- Dashboard: Churn Prediction Analysis
- Total Customers: {total_customers:,}
- High Risk Count: {high_risk_count} customers ({high_risk_pct:.1f}%)
- Revenue at Risk: ${revenue_at_risk:,.0f}
- Top Churn Factor: {top_factor} ({factor_importance:.1f}% importance)

INSTRUCTIONS:
As a strategic advisor, generate 3-5 insights that go beyond the numbers. Focus on:
1. **Root Cause Analysis**: WHY are specific segments/cohorts at higher risk?
2. **Strategic Implications**: What does this mean for growth, revenue, and market position?
3. **Tactical Actions**: SPECIFIC interventions with timelines and expected ROI
4. **Predictive Patterns**: Early warning signs and proactive measures
5. **Segment Strategy**: Differentiated approaches for different customer types

PRIORITY LEVELS:
- CRITICAL: Immediate action required (revenue impact >$500k or >20% of segment at risk)
- HIGH: Action needed within 7 days (significant revenue exposure)
- MODERATE: Monitor and plan intervention (trend concern)
- INFO: Strategic context or longer-term consideration

FORMAT REQUIREMENTS:
- One insight per line
- 2-3 sentences each
- Start with text priority label (CRITICAL:, HIGH:, MODERATE:, INFO:) - NO EMOJIS
- Include "**Action:**" section with specific steps
- Add expected outcomes with numbers (e.g., "Expected: 25% churn reduction, $200k revenue protected")
- Reference specific segments or customer groups
- Include timelines (24h, 7 days, Q2, etc.)

EXAMPLE:
🚨 CRITICAL: Enterprise segment's 35% high-risk rate (2.5x higher than SMB) combined with 65% transaction frequency importance suggests pricing-value misalignment. **Action:** Within 48 hours, launch executive outreach to top 10 at-risk Enterprise accounts, conduct value assessment calls, and prepare customized retention offers up to 15% discount. Expected: 40-50% retention rate, $450k revenue protected.

AVOID:
- Generic advice like "improve customer service"
- Stating obvious facts without interpretation
- Recommendations without business impact metrics
- Vague timelines like "soon" or "eventually"

Generate your insights now:\"\"\"


# Add more prompt templates for other dashboards following the same pattern...
# CUSTOMER_SEGMENTATION_PROMPT = ...
# CUSTOMER_LTV_PROMPT = ...
# PRODUCT_PERFORMANCE_PROMPT = ...
# SALES_PERFORMANCE_PROMPT = ...
```

**Key Template Design Principles**:
- ✅ Include dashboard-specific context (KPIs, metrics, data summary)
- ✅ Define clear output format with emoji priority indicators
- ✅ Request actionable recommendations with timelines and ROI
- ✅ Provide examples of desired output
- ✅ List things to avoid (generic advice, obvious facts)
- ✅ Use format strings for dynamic data insertion

##### Step 1.3.3: Update Processing Service with Hybrid Insights

**File**: `apps/adk/domains/{dashboard_name}/processing_service.py`

Add the AI insights generation method to your processing service:

```python
from typing import Dict, List

class DashboardProcessingService:

    def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Generate dashboard summary with hybrid insights"""

        # ... existing code to fetch and process data ...

        # Generate rule-based insights (fast, always present)
        insights = self._generate_insights(data, kpis)

        # Generate AI-powered insights (optional, with graceful fallback)
        ai_insights = self._generate_ai_insights(data, kpis, filters)

        return {
            'kpiMetrics': kpis,
            'mainData': visualizations,
            'insights': insights,  # Rule-based (backward compatible)
            'ai_insights': ai_insights,  # AI-powered (new)
            'insights_metadata': {
                'rule_based_count': len(insights),
                'ai_insights_count': len(ai_insights),
                'insights_version': 'hybrid_v1'
            },
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'filters_applied': filters
            }
        }

    def _generate_insights(self, data: Dict, kpis: Dict) -> List[str]:
        """Generate rule-based insights (fast, deterministic)

        These insights are always present and provide immediate value without API calls.
        Focus on data-driven observations with actionable recommendations.

        Returns:
            List of formatted insight strings with priority indicators
        """
        insights = []

        # Example: High-value customer risk insight
        high_risk_count = kpis.get('highRiskCount', 0)
        if high_risk_count > 0:
            total = kpis.get('totalCustomers', 1)
            risk_pct = (high_risk_count / total * 100)
            revenue_at_risk = kpis.get('revenueAtRisk', 0)

            if risk_pct > 20:
                insights.append(
                    f"🚨 CRITICAL: {high_risk_count} high-risk customers ({risk_pct:.1f}% of base) "
                    f"represent ${revenue_at_risk:,.0f} in potential revenue loss. "
                    f"**Action:** Launch immediate retention campaign targeting top 20% by LTV. "
                    f"Deploy personalized outreach within 48h. "
                    f"Expected: 30-40% retention rate, ${revenue_at_risk * 0.35:,.0f} protected."
                )
            elif risk_pct > 10:
                insights.append(
                    f"HIGH: {high_risk_count} customers at churn risk represent {risk_pct:.1f}% of base. "
                    f"**Action:** Implement automated re-engagement campaign within 7 days. "
                    f"Expected: 25% risk reduction."
                )

        # Add more rule-based insights...

        # Always provide a fallback insight if nothing specific was generated
        if not insights:
            insights = [
                f"INFO: Dashboard analysis completed for {kpis.get('totalCustomers', 0):,} customers",
                "INFO: Review segment performance and trends for optimization opportunities"
            ]

        return insights

    def _generate_ai_insights(self, data: Dict, kpis: Dict, filters: Dict) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            data: Full data results from analysis
            kpis: KPI metrics from dashboard
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate additional metrics for AI context
            # ... dashboard-specific metric calculations ...

            # Example for churn dashboard:
            total_customers = len(data.get('customers', []))
            high_risk_count = sum(1 for c in data.get('customers', []) if c.get('churnRisk', 0) > 0.7)
            revenue_at_risk = sum(c.get('ltv', 0) for c in data.get('customers', []) if c.get('churnRisk', 0) > 0.7)

            # Build context for AI
            kpis_dict = {
                'total_customers': total_customers,
                'high_risk_count': high_risk_count,
                'high_risk_pct': (high_risk_count / total_customers * 100) if total_customers > 0 else 0,
                'revenue_at_risk': revenue_at_risk,
                # ... more metrics ...
            }

            data_summary = {
                'top_factor': 'Transaction Frequency',  # Example
                'factor_importance': 65.0,  # Example
                # ... more summary data ...
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='churn_prediction',  # Match your dashboard type
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            print("[ProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[ProcessingService] Error generating AI insights: {e}")
            return []  # Graceful fallback
```

**Key Implementation Points**:
- ✅ **Import at method level**: Prevents module import errors from breaking entire service
- ✅ **Graceful fallbacks**: Always return empty list on error, never crash
- ✅ **Separate fields**: `insights` (rule-based) and `ai_insights` (AI) for backward compatibility
- ✅ **Metadata tracking**: Track counts and version for monitoring
- ✅ **Non-blocking**: AI generation won't interfere with SSE streaming
- ✅ **Dashboard-specific metrics**: Calculate relevant context for each dashboard type

##### Step 1.3.4: Install Required Dependencies

**File**: `apps/adk/requirements.txt`

Add Gemini SDK if not already present:

```txt
google-generativeai>=0.3.0
```

Install:
```bash
cd apps/adk
pip install -r requirements.txt
```

##### Step 1.3.5: Environment Configuration

**File**: `.env` (root directory)

Add Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

**Get API Key**:
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Add to `.env` file

**Cost Estimate**:
- Model: Gemini 2.0 Flash
- Cost: ~$0.0004 per dashboard load (1500 tokens output)
- Monthly estimate: ~$12 for 30,000 dashboard views

##### Step 1.3.6: Testing Hybrid Insights

**Test 1: AI Module Availability**

```bash
cd apps/adk
python -c "
from lib.ai_insights_generator import generate_ai_insights
import os

# Check API key
if os.getenv('GEMINI_API_KEY'):
    print('✅ GEMINI_API_KEY is set')
else:
    print('❌ GEMINI_API_KEY not set')

# Test generation
insights = generate_ai_insights(
    dashboard_type='churn_prediction',
    kpis={'total_customers': 1000, 'high_risk_count': 150},
    data_summary={'revenue_at_risk': 500000, 'top_factor': 'Test'}
)

print(f'Generated {len(insights)} AI insights:')
for i, insight in enumerate(insights, 1):
    print(f'{i}. {insight[:100]}...')
"
```

**Expected Output**:
```
✅ GEMINI_API_KEY is set
[AI Insights] Generated 4 insights for churn_prediction in 1234ms
Generated 4 AI insights:
1. CRITICAL: 15% churn risk concentration indicates immediate revenue threat...
2. HIGH: Transaction frequency correlation suggests engagement...
3. MODERATE: Segment analysis reveals...
4. INFO: Long-term trend shows...
```

**Test 2: Processing Service Integration**

```python
from domains.churn_prediction.processing_service import ChurnProcessingService

service = ChurnProcessingService()
result = service.get_dashboard_summary({
    'dateFrom': '2017-01-01',
    'dateTo': '2021-12-31'
})

print(f"✅ Rule-based insights: {len(result['insights'])}")
print(f"✅ AI insights: {len(result['ai_insights'])}")
print(f"✅ Metadata: {result['insights_metadata']}")

# Verify both insight types
assert 'insights' in result
assert 'ai_insights' in result
assert 'insights_metadata' in result
print("✅ All tests passed!")
```

**Test 3: Error Handling**

```python
# Test without API key
import os
os.environ.pop('GEMINI_API_KEY', None)

result = service.get_dashboard_summary({
    'dateFrom': '2017-01-01',
    'dateTo': '2021-12-31'
})

# Should have rule-based insights but empty AI insights
assert len(result['insights']) > 0
assert len(result['ai_insights']) == 0
print("✅ Graceful fallback works correctly")
```

##### Step 1.3.7: Best Practices for Prompt Engineering

**1. Context-Rich Prompts**:
```python
# ✅ Good: Specific context
PROMPT = \"\"\"You are analyzing {dashboard_type} for a {company_size} company.

Current State:
- Total Customers: {total_customers:,}
- High Risk: {high_risk_count} ({high_risk_pct:.1f}%)
- Revenue Impact: ${revenue_at_risk:,.0f}
\"\"\"

# ❌ Bad: Generic context
PROMPT = "Analyze this dashboard data and provide insights."
```

**2. Structured Output Format**:
```python
# ✅ Good: Clear format requirements
\"\"\"
FORMAT:
- Start with text priority label: CRITICAL: | HIGH: | MODERATE: | INFO:
- NO EMOJIS - text labels only for professional appearance
- 2-3 sentences per insight
- Include "**Action:**" section
- Add expected outcomes with numbers
\"\"\"

# ❌ Bad: No format specification
\"\"\"Generate some insights about the data.\"\"\"
```

**3. Examples in Prompt**:
```python
# ✅ Good: Show desired output
\"\"\"
EXAMPLE:
🚨 CRITICAL: Enterprise segment's 35% high-risk rate suggests pricing misalignment.
**Action:** Within 48h, launch executive outreach to top 10 at-risk accounts.
Expected: 40-50% retention, $450k protected.
\"\"\"

# ❌ Bad: No examples
\"\"\"Generate insights in a good format.\"\"\"
```

**4. Dashboard-Specific Templates**:
```python
# ✅ Good: Tailored to dashboard
CHURN_PROMPT = \"\"\"Focus on retention strategies and customer risk...\"\"\"
LTV_PROMPT = \"\"\"Focus on value expansion and tier progression...\"\"\"
SALES_PROMPT = \"\"\"Focus on performance gaps and pipeline quality...\"\"\"

# ❌ Bad: One generic prompt for all
GENERIC_PROMPT = \"\"\"Analyze the data and provide insights.\"\"\"
```

##### Step 1.3.8: Monitoring and Optimization

**Add Logging**:

```python
import time
import logging

logger = logging.getLogger(__name__)

def generate_ai_insights(...):
    start = time.time()

    try:
        insights = ...
        duration = (time.time() - start) * 1000

        logger.info(
            f"AI Insights: {dashboard_type} | "
            f"Generated: {len(insights)} | "
            f"Duration: {duration:.0f}ms | "
            f"Success: True"
        )

        return insights
    except Exception as e:
        duration = (time.time() - start) * 1000
        logger.error(
            f"AI Insights: {dashboard_type} | "
            f"Duration: {duration:.0f}ms | "
            f"Success: False | "
            f"Error: {str(e)}"
        )
        return []
```

**Metrics to Track**:
- ✅ Generation success rate
- ✅ Average generation time
- ✅ API costs per dashboard
- ✅ Insight quality scores (manual review)
- ✅ User engagement with AI insights

#### Step 1.3.9: Performance Optimization - Async AI Insights

**CRITICAL**: AI insights generation MUST NOT block the main dashboard endpoint. This section defines the required architecture for optimal performance.

**Problem**: AI insights generation (1-2 seconds via Gemini API) can significantly slow down dashboard load times if implemented incorrectly.

**Solution**: Separate caching for AI insights with async generation.

##### Architecture Pattern

```
User Request → get_dashboard_summary() → Fast Response (< 500ms)
                       ↓
              Rule-based insights (< 50ms)
                       +
              AI insights (cached separately, 30min TTL)
                       ↓
              Combined unified insights array
```

**Key Principles**:
1. **Separate Cache**: AI insights cached independently with longer TTL (30 min vs 5 min for data)
2. **Non-blocking**: Use `asyncio.to_thread()` to run AI generation in thread pool
3. **Unified Output**: Single `insights` array combining rule-based + AI (NOT separate arrays)
4. **Graceful Degradation**: Return rule-based insights if AI generation fails

##### Implementation

**File**: `apps/adk/domains/{dashboard_name}/processing_service.py`

**Step 1: Add Async AI Insights Method**

```python
@cache_dashboard_endpoint(dashboard_type='{dashboard_name}_ai_insights', ttl=1800)
async def _get_cached_ai_insights(
    self,
    filters: Dict,
    # ... data parameters needed for AI context
) -> List[str]:
    """Get AI insights from cache or generate async (non-blocking)

    Cached separately with longer TTL (30 min) since AI insights are less filter-dependent.
    Uses asyncio.to_thread() to run blocking AI generation in thread pool.

    Returns:
        List of AI-generated insight strings (empty on error)
    """
    try:
        # Run AI generation in thread pool to avoid blocking event loop
        ai_insights = await asyncio.to_thread(
            self._generate_ai_insights,
            # ... pass data parameters
        )
        return ai_insights
    except Exception as e:
        print(f"[{self.__class__.__name__}] Error in _get_cached_ai_insights: {e}")
        return []  # Graceful fallback
```

**Step 2: Update Main Summary Method**

```python
@cache_dashboard_endpoint(dashboard_type='{dashboard_name}', ttl=300)
async def get_dashboard_summary(self, filters: Dict) -> Dict:
    """Main dashboard endpoint - combines SQL and ML"""
    try:
        # Get all data metrics in parallel
        # ... data fetching code ...

        # Generate rule-based insights (fast, < 50ms)
        rule_based_insights = self._generate_insights(
            # ... data parameters
        )

        # Get AI insights from separate cache (non-blocking, async)
        ai_insights = await self._get_cached_ai_insights(
            filters,
            # ... data parameters
        )

        # ✅ COMBINE into single unified insights array
        combined_insights = rule_based_insights + ai_insights

        # ✅ Return unified insights in single field
        return {
            # ... other data fields ...
            "insights": combined_insights,  # UNIFIED: rule-based + AI
            "insights_metadata": {
                "total_count": len(combined_insights),
                "rule_based_count": len(rule_based_insights),
                "ai_count": len(ai_insights),
                "insights_version": "unified_v2"
            }
        }
    except Exception as e:
        # ... error handling ...
```

##### What NOT to Do

❌ **WRONG - AI blocking main endpoint**:
```python
@cache_dashboard_endpoint(dashboard_type='dashboard', ttl=300)
async def get_dashboard_summary(self, filters: Dict) -> Dict:
    # ...
    ai_insights = self._generate_ai_insights(...)  # BLOCKS for 1-2 seconds!
    return {"insights": insights, "ai_insights": ai_insights}  # WRONG: separate arrays
```

❌ **WRONG - Synchronous AI in async method**:
```python
def _generate_ai_insights(self, ...):  # NOT async
    # Makes blocking API call to Gemini
    response = model.generate_content(...)  # BLOCKS event loop!
```

❌ **WRONG - Separate insights arrays**:
```python
return {
    "insights": rule_based_insights,
    "ai_insights": ai_insights  # Don't split them!
}
```

##### Performance Metrics

**Expected Performance**:

| Metric | Before Optimization | After Optimization | Improvement |
|--------|-------------------|-------------------|-------------|
| First load (cache miss) | 2000-3000ms | 400-600ms | **5x faster** |
| Cached load (cache hit) | 200-300ms | 200-300ms | Same |
| AI insights availability | Blocking | Async/Cached | Non-blocking |

**Success Criteria**:
- ✅ Dashboard loads in < 500ms with cache
- ✅ AI insights do NOT block main endpoint
- ✅ Single unified `insights` array returned
- ✅ Metadata tracks insight sources (rule-based vs AI counts)
- ✅ Graceful degradation if AI fails

##### Frontend Integration

**File**: `apps/frontend/src/app/{dashboard-name}/hooks/use{Dashboard}Data.ts`

```typescript
// ✅ CORRECT: Use unified insights from backend
const insights = useMemo(() => {
  // Backend returns combined rule-based + AI insights
  return rawData?.insights || [];
}, [rawData]);

// ❌ WRONG: Don't generate insights in frontend
const insights = useMemo(() => {
  // Calculating insights here duplicates backend work
  return calculateInsights(data);
}, [data]);
```

**Why This Matters**:
- Frontend gets one consistent source of insights
- No need to handle merging logic in frontend
- Backend controls insight generation and caching strategy
- Easier to update insight logic (only in one place)

##### Cache Configuration

**AI Insights Cache**:
- **Dashboard Type**: `{dashboard_name}_ai_insights`
- **TTL**: 1800 seconds (30 minutes)
- **Rationale**: AI insights are less dependent on specific filter values and more expensive to generate

**Main Data Cache**:
- **Dashboard Type**: `{dashboard_name}`
- **TTL**: 300 seconds (5 minutes)
- **Rationale**: Data updates more frequently and depends heavily on filters

##### Testing

**Test 1: Verify Non-blocking**
```bash
# First request (cache miss) should still be fast
time curl -X POST http://localhost:8000/api/{dashboard}/summary

# Expected: < 600ms (not 2000ms+)
```

**Test 2: Verify Unified Insights**
```bash
# Response should have single insights array
curl -X POST http://localhost:8000/api/{dashboard}/summary | jq '.insights'

# Should return: ["Insight 1", "Insight 2", "AI Insight 1", ...]
# NOT: separate .insights and .ai_insights fields
```

**Test 3: Verify Metadata**
```bash
# Check insights metadata
curl -X POST http://localhost:8000/api/{dashboard}/summary | jq '.insights_metadata'

# Should return:
# {
#   "total_count": 7,
#   "rule_based_count": 4,
#   "ai_count": 3,
#   "insights_version": "unified_v2"
# }
```

##### Migration Guide

If updating existing dashboard from old pattern:

**Backend Changes**:
1. Add `_get_cached_ai_insights()` method with separate cache
2. Use `asyncio.to_thread()` for AI generation
3. Combine insights arrays before returning
4. Remove separate `ai_insights` field from response
5. Update `insights_version` to "unified_v2"

**Frontend Changes**:
1. Update hook to use `rawData?.insights` directly
2. Remove local insight generation logic
3. Update components expecting separate arrays

**Example Migration**:
```python
# BEFORE
return {
    "insights": rule_based,
    "ai_insights": ai_insights
}

# AFTER
return {
    "insights": rule_based + ai_insights,
    "insights_metadata": {...}
}
```

#### Step 1.4: Implement Backend Caching

**Overview**: Add caching to all processing service methods to reduce database load and improve response times. The centralized caching system ensures consistent behavior across all dashboards.

**Architecture**:
```
Request → Check Cache → Cache Hit? → Return Cached Data
                    ↓
                 Cache Miss
                    ↓
            Execute Query
                    ↓
         Store in Cache (with TTL)
                    ↓
           Return Fresh Data
```

##### Step 1.4.1: Verify Centralized Cache Module Exists

**File**: `apps/adk/domains/common/dashboard_cache.py`

This module should already exist with:
- `generate_dashboard_cache_key()` - Creates unique cache keys based on dashboard_type + endpoint + filters
- `cache_dashboard_endpoint()` - Decorator for both async and sync functions
- `DashboardCacheManager` - Global cache manager

**Verify cache key generation is filter-safe**:
```python
# The cache key includes normalized filters in MD5 hash
# Different filter combinations create different cache entries
# Example: dateFrom=2021-01-01 creates different key than dateFrom=2021-06-01
```

##### Step 1.4.2: Add Cache Decorators to Processing Service Methods

**File**: `apps/adk/domains/{dashboard_name}/processing_service.py`

Add the `@cache_dashboard_endpoint` decorator to all data-fetching methods:

```python
from domains.common.dashboard_cache import cache_dashboard_endpoint

class DashboardProcessingService:

    @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint with caching (5 min TTL)"""
        # ... existing code ...

    @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
    async def get_detailed_data(self, filters: Dict) -> List[Dict]:
        """Detailed data endpoint with caching"""
        # ... existing code ...

    @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
    async def get_segment_analysis(self, filters: Dict) -> List[Dict]:
        """Segment analysis with caching"""
        # ... existing code ...
```

**TTL Guidelines by Dashboard Type**:
```python
# Churn Prediction, Customer LTV, Segmentation: 5 min (300s)
ttl=300

# Sales Performance, Product Performance: 3 min (180s)
ttl=180

# Inventory, Stock Levels: 2 min (120s)
ttl=120

# Financial Metrics, Cash Flow: 10 min (600s)
ttl=600
```

##### Step 1.4.3: Methods to Cache

Cache these method types in your processing service:

1. **Main Summary Endpoint**:
   ```python
   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_dashboard_summary(self, filters: Dict) -> Dict:
   ```

2. **Detailed Analysis Methods**:
   ```python
   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_customer_stats(self, filters: Dict) -> List[Dict]:

   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_segment_risk(self, filters: Dict) -> List[Dict]:

   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_monthly_trends(self, filters: Dict) -> List[Dict]:
   ```

3. **Feature/Metric Calculations**:
   ```python
   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_feature_importance(self, filters: Dict) -> List[Dict]:

   @cache_dashboard_endpoint(dashboard_type='your_dashboard', ttl=300)
   async def get_probability_distribution(self, filters: Dict) -> List[Dict]:
   ```

**Do NOT cache**:
- Helper methods that don't touch the database
- Methods that generate insights (rule-based or AI)
- Internal transformation methods (prefix with `_`)

##### Step 1.4.4: Verify Cache Behavior

**Test 1: Cache Key Uniqueness**
```python
# Different filters should create different cache keys
from domains.common.dashboard_cache import generate_dashboard_cache_key

key1 = generate_dashboard_cache_key('churn', 'summary', {'dateFrom': '2021-01-01', 'dateTo': '2021-12-31'})
key2 = generate_dashboard_cache_key('churn', 'summary', {'dateFrom': '2021-06-01', 'dateTo': '2021-12-31'})

assert key1 != key2, "Different filters must create different cache keys"
print("✅ Cache keys are unique per filter combination")
```

**Test 2: Cache Hit/Miss**
```python
from domains.your_dashboard.processing_service import YourProcessingService
import time

service = YourProcessingService()
filters = {'dateFrom': '2021-01-01', 'dateTo': '2021-12-31'}

# First call - cache miss (slower)
start = time.time()
result1 = await service.get_dashboard_summary(filters)
time1 = (time.time() - start) * 1000

# Second call - cache hit (faster)
start = time.time()
result2 = await service.get_dashboard_summary(filters)
time2 = (time.time() - start) * 1000

print(f"First call (cache miss): {time1:.0f}ms")
print(f"Second call (cache hit): {time2:.0f}ms")
print(f"Speedup: {time1/time2:.1f}x faster")

assert time2 < time1 * 0.5, "Cached call should be at least 2x faster"
print("✅ Caching is working correctly")
```

**Test 3: Cache Response Metadata**
```python
# Cached responses include metadata
result = await service.get_dashboard_summary(filters)

# Check for cache metadata in response (if implemented)
if '_cached' in result.get('metadata', {}):
    print(f"✅ Cache hit: {result['metadata']['_cached']}")
    print(f"   Cache key: {result['metadata'].get('_cache_key', 'N/A')}")
```

##### Step 1.4.5: Cache Management (Optional)

**Clear cache for specific dashboard**:
```python
from domains.common.dashboard_cache import DashboardCacheManager

cache_manager = DashboardCacheManager()

# Clear all cache for a dashboard type
cache_manager.clear_dashboard_cache('churn')

# Clear specific endpoint
cache_manager.clear_endpoint_cache('churn', 'summary')

# Clear all cache
cache_manager.clear_all()

# Get cache stats
stats = cache_manager.get_stats()
print(f"Cache entries: {stats['total_entries']}")
print(f"Hit rate: {stats['hit_rate']:.1f}%")
```

**Key Points**:
- ✅ **Filter-aware**: Different filter combinations create different cache entries
- ✅ **Automatic**: Decorator handles all cache logic
- ✅ **TTL-based**: Cache expires after configured time
- ✅ **Centralized**: Same system across all dashboards
- ✅ **Non-blocking**: Cache operations don't slow down requests
- ✅ **Safe**: Cache failures don't break functionality

---

### Phase 2: Frontend Visualization Components (4-6 hours)

#### Step 2.1: Create Visualization Components

**Directory**: `apps/frontend/src/app/{dashboard-name}/components/visualizations/`

Create 4-6 visualization components based on dashboard needs. Common types:

##### 2.1.1 KPI Component (AnimatedKPITile)

```typescript
// components/index.tsx
import { AnimatedKPITile } from 'components/index';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

export function DashboardKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const kpis = [
    {
      title: 'Total Revenue',
      value: metrics?.totalRevenue || 0,  // Pass raw number, KPICard will format as $30.1M
      format: 'currency' as const,
      subtitle: 'All time',
      icon: DollarSign,
      trend: metrics?.revenueGrowth || 0,
      color: '#8b5cf6' as const
    },
    {
      title: 'Total Units',
      value: metrics?.totalUnits || 0,  // Pass raw number, KPICard will format as 150K
      format: 'number' as const,
      subtitle: 'Units sold',
      icon: Package,
      color: '#10b981' as const
    }
    // ... more KPIs
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => (
        <AnimatedKPITile key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
}
```

##### 2.1.2 Table Component

```typescript
// visualizations/DataTable.tsx
import React, { useState } from 'react';
import { DashboardSection } from 'components/index';
import { ArrowUpDown, Search } from 'lucide-react';

interface DataTableProps {
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
}

export function DataTable({ data = [], loading = false, onRowClick }: DataTableProps) {
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  });

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return (
    <DashboardSection title="Data Table">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th onClick={() => handleSort('name')} className="cursor-pointer p-3 text-left">
                Name <ArrowUpDown className="inline h-4 w-4" />
              </th>
              <th onClick={() => handleSort('revenue')} className="cursor-pointer p-3 text-right">
                Revenue <ArrowUpDown className="inline h-4 w-4" />
              </th>
              {/* More columns */}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className="border-b border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <td className="p-3">{row.name}</td>
                <td className="p-3 text-right">${row.revenue.toLocaleString()}</td>
                {/* More cells */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
}
```

##### 2.1.3 Chart Component (Chart.js)

```typescript
// visualizations/PerformanceChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { DashboardSection } from 'components/index';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PerformanceChartProps {
  data: {
    revenue?: number[];
    units?: number[];
    labels?: string[];
  };
  loading?: boolean;
}

export function PerformanceChart({ data = {}, loading = false }: PerformanceChartProps) {
  const { revenue = [], units = [], labels = [] } = data;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenue,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4
      },
      {
        label: 'Units',
        data: units,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      },
      tooltip: {
        backgroundColor: 'rgb(31, 41, 55)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Units',
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  if (!labels.length || !revenue.length) {
    return (
      <DashboardSection title="Performance Chart">
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title="Performance Chart">
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </DashboardSection>
  );
}
```

##### 2.1.4: KPI Formatting Best Practices

**Number Display Format**: Use compact notation for better readability.

The `KPICard` component automatically formats large numbers using compact notation:

**Formatting Behavior**:
- **Currency**: `$30.1M` instead of `$30,054,281`
- **Numbers**: `150K` instead of `150,000`
- **Percentage**: `85.3%` (unchanged, no compact needed)
- **Text**: Displayed as-is

**✅ CORRECT Implementation**:
```typescript
// Pass raw numeric values, let KPICard format automatically
const kpis = [
  {
    id: "revenue-at-risk",
    title: "Revenue at Risk",
    value: 30054281,  // Raw number
    format: "currency" as const,
    color: "#f59e0b",
  },
  {
    id: "at-risk-customers",
    title: "At Risk Customers",
    value: 156000,  // Raw number
    format: "number" as const,
    color: "#ef4444",
  },
  {
    id: "churn-rate",
    title: "Churn Rate",
    value: 15.3,  // Raw percentage
    format: "percentage" as const,
    color: "#38bdf8",
  },
  {
    id: "risk-status",
    title: "Risk Status",
    value: "High",  // Text value
    format: "text" as const,
    color: "#ef4444",
  }
];

// Display will show:
// Revenue at Risk: $30.1M
// At Risk Customers: 156K
// Churn Rate: 15.3%
// Risk Status: High
```

**❌ WRONG - Manual Formatting**:
```typescript
// DON'T manually format numbers - let KPICard handle it
const kpis = [
  {
    value: `$${(30054281 / 1000000).toFixed(1)}M`,  // ❌ DON'T DO THIS
    format: "text",  // ❌ Wrong format type
  },
  {
    value: `${(156000 / 1000).toFixed(0)}K`,  // ❌ DON'T DO THIS
    format: "text",
  }
];
```

**Why Use Compact Notation**:
- ✅ **Readability**: Easier to scan at a glance
- ✅ **Space-efficient**: Fits better in KPI tiles
- ✅ **Professional**: Industry-standard format
- ✅ **Consistent**: Automatic formatting across all dashboards
- ✅ **Localization**: `Intl.NumberFormat` handles i18n automatically

**Number Scaling Examples**:

| Raw Value | Currency Format | Number Format |
|-----------|----------------|---------------|
| 500 | $500 | 500 |
| 1,234 | $1.2K | 1.2K |
| 30,054 | $30.1K | 30.1K |
| 456,789 | $457K | 457K |
| 1,234,567 | $1.2M | 1.2M |
| 30,054,281 | **$30.1M** | 30.1M |
| 1,234,567,890 | $1.2B | 1.2B |

**Precision Control**:
- Values < 1,000: Show full number (e.g., 456)
- Values ≥ 1,000: Show compact with 1 decimal (e.g., 1.2K)
- This provides good balance between precision and readability

**When to Use Text Format**:
Use `format: "text"` only for non-numeric displays:
- Statuses: "Active", "Pending", "Critical"
- Categories: "High Risk", "Medium Priority"
- Custom formatted values: "45 ↑ 12 ↓" (Risk Transitions)
- Dates: "Last updated: 2 hours ago"

**Dashboard-Specific Examples**:

```typescript
// Churn Prediction
{
  title: "Revenue at Risk",
  value: 30054281,        // → $30.1M
  format: "currency"
}

// Customer LTV
{
  title: "Total Portfolio Value",
  value: 125000000,       // → $125M
  format: "currency"
}

// Sales Performance
{
  title: "Annual Revenue",
  value: 2500000,         // → $2.5M
  format: "currency"
}

// Product Performance
{
  title: "Units Sold",
  value: 456789,          // → 457K
  format: "number"
}
```

**Testing KPI Formatting**:
```typescript
// Test with various magnitudes to verify formatting
const testValues = [
  { value: 123, expected: "123" },           // No compact
  { value: 1234, expected: "1.2K" },
  { value: 12345, expected: "12.3K" },
  { value: 123456, expected: "123K" },
  { value: 1234567, expected: "1.2M" },
  { value: 12345678, expected: "12.3M" },
  { value: 123456789, expected: "123M" },
  { value: 1234567890, expected: "1.2B" },
];
```

**Edge Cases Handled Automatically**:
- **Small numbers** (< 1,000): Display full value
- **Negative numbers**: -$30.1M (correct formatting)
- **Zero**: $0 or 0
- **Decimals**: Rounded appropriately (1.23M → 1.2M)

**Performance**:
- `Intl.NumberFormat` with compact notation is highly optimized
- No measurable performance impact vs standard formatting
- Built-in browser API with excellent cross-browser support

##### 2.1.5: Visualization Labeling Standards

**MANDATORY REQUIREMENTS for ALL Visualizations:**

All charts and graphs MUST include the following labels for clarity and accessibility:

**Label Checklist:**
- [ ] **Chart Title**: Clear, descriptive title (can be in parent component or internal to visualization)
- [ ] **X-Axis Label**: Text describing what the horizontal axis represents
- [ ] **Y-Axis Label**: Text describing what the vertical axis represents
- [ ] **Legend**: If multiple data series, include clearly labeled legend
- [ ] **Tooltips**: Show detailed information on hover
- [ ] **Units**: Clearly indicate units of measurement (%, $, count, etc.)

**Implementation Guidelines:**

**For SVG Custom Charts** (like RiskTrendsOverTime, custom area charts):

```tsx
// X-axis label - centered below the chart
<text
  x={chartArea.left + chartArea.width / 2}
  y={chartArea.bottom + 40}
  textAnchor="middle"
  className="text-sm fill-muted-foreground"
>
  {xAxisLabel}  // e.g., "Date", "Time Period", "Month"
</text>

// Y-axis label - rotated, left of chart
<text
  x={chartArea.left - 40}
  y={chartArea.top + chartArea.height / 2}
  textAnchor="middle"
  transform={`rotate(-90 ${chartArea.left - 40} ${chartArea.top + chartArea.height / 2})`}
  className="text-sm fill-muted-foreground"
>
  {yAxisLabel}  // e.g., "Number of Customers", "Revenue ($)", "Count"
</text>
```

**For Chart.js/Recharts** (library-based charts):

```tsx
// Chart.js example
const options = {
  scales: {
    x: {
      title: {
        display: true,
        text: 'Date',  // X-axis label
        color: 'rgb(156, 163, 175)'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Revenue ($)',  // Y-axis label
        color: 'rgb(156, 163, 175)'
      }
    }
  },
  plugins: {
    title: {
      display: true,
      text: 'Revenue Trends Over Time'  // Chart title
    },
    legend: {
      display: true,
      position: 'bottom'  // Legend
    }
  }
};
```

**Dynamic Scaling Requirements:**

- ✅ **ALWAYS calculate max values from data** - NEVER hard-code axis maximums
- ✅ **Add padding**: Use `Math.max(...data) * 1.1` to add 10% headroom
- ✅ **Round intelligently**: Round max values to nearest sensible increment (e.g., 500, 1000)

```tsx
// ❌ WRONG: Hard-coded max value
const maxValue = 2500;  // BAD! What if data exceeds this?

// ✅ CORRECT: Dynamic max value
const maxValue = Math.max(...data.map(d => d.total)) * 1.1;
const roundedMax = Math.ceil(maxValue / 500) * 500;  // Round to nearest 500
```

**Common Label Examples by Chart Type:**

| Chart Type | X-Axis Label | Y-Axis Label | Example Title |
|------------|--------------|--------------|---------------|
| Time Series | "Date" / "Month" / "Time Period" | "Count" / "Revenue ($)" / "Number of Customers" | "Sales Trends Over Time" |
| Bar Chart | "Category" / "Product" / "Region" | "Value" / "Count" / "Amount" | "Sales by Product Category" |
| Histogram | "Value Range" / "Probability" | "Frequency" / "Count" | "Churn Probability Distribution" |
| Scatter Plot | "[Metric Name]" | "[Metric Name]" | "Customer Lifetime Value vs. Engagement" |
| Heatmap | "[Dimension 1]" | "[Dimension 2]" | "Risk by Segment Matrix" |

**Tooltip Implementation - MANDATORY:**

ALL custom SVG visualizations MUST use the shared `ChartTooltip` component for consistency and accessibility. This ensures:
- Consistent styling across all dashboards
- Proper color contrast and readability
- Accessible tooltip behavior
- Theme-aware appearance

**Required Implementation Pattern:**

```tsx
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export const MyVisualization = ({ data }) => {
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // On hover handlers for interactive elements
  const handleMouseEnter = (item: DataItem, e: React.MouseEvent) => {
    const tooltipItems: TooltipItem[] = [
      {
        label: "Metric Name",
        value: item.value,
        color: item.color,  // Optional: Color indicator
      },
      {
        label: "Secondary Metric",
        value: item.secondaryValue,
      },
    ];

    showTooltip(
      e.clientX,
      e.clientY,
      item.name,  // Tooltip title
      tooltipItems
    );
  };

  const handleMouseMove = (item: DataItem, e: React.MouseEvent) => {
    // Same tooltip items as mouseEnter
    showTooltip(e.clientX, e.clientY, item.name, tooltipItems);
  };

  return (
    <div>
      {/* Your visualization with mouse event handlers */}
      <div
        onMouseEnter={(e) => handleMouseEnter(item, e)}
        onMouseLeave={hideTooltip}
        onMouseMove={(e) => handleMouseMove(item, e)}
      >
        {/* Chart elements */}
      </div>

      {/* Render tooltip at end of component */}
      <ChartTooltip
        {...tooltipData}
        variant="dark"
        size="sm"
        showArrow={false}
      />
    </div>
  );
};
```

**ChartTooltip Props:**
- `variant`: "default" | "dark" | "light" (default: "default")
- `size`: "sm" | "md" | "lg" (default: "md")
- `showArrow`: boolean (default: true)
- `footer`: Optional footer text or component

**IMPORTANT: Header Color Fix**
- The tooltip header MUST use theme colors: `border-border text-foreground`
- NEVER use opacity-based colors like `border-current opacity-20` as they can blend with the graph background
- This ensures proper contrast and readability in all contexts

**Exception for Library-Based Charts:**
- Chart.js and Recharts components may use their native tooltip systems
- Ensure native tooltips are styled to match theme colors
- Use `hsl(var(--foreground))`, `hsl(var(--background))`, `hsl(var(--border))` for consistency

**Examples of Components Using ChartTooltip:**
- ✅ `RiskTrendsOverTime.tsx`
- ✅ `SegmentComparisonMatrix.tsx`
- ✅ `ProbabilityHistogram.tsx`
- ✅ `RiskPyramid.tsx`
- ✅ `AIFeatureImportance.tsx`

##### 2.1.6: Card Layout Consistency Standards

**MANDATORY: Equal Height for Horizontal Layouts**

When multiple visualization cards are placed on the same horizontal level (same row in a grid), they MUST have equal heights for visual consistency and professional appearance.

**Why This Matters:**
- Creates balanced, professional layouts
- Prevents awkward height mismatches
- Improves visual hierarchy
- Better user experience on all screen sizes

**Implementation Patterns:**

**Pattern 1: Fixed Height with Flexbox** (Recommended for most cases)

```tsx
// Parent grid container
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
  {/* Card 1: AI Feature Importance */}
  <div className="h-full flex flex-col">
    <h3 className="text-lg font-semibold mb-4">AI Feature Importance</h3>
    <ChartCard className="flex-1 min-h-[500px]">
      {/* Chart content */}
    </ChartCard>
  </div>

  {/* Card 2: Segment Comparison Matrix */}
  <div className="h-full flex flex-col">
    <h3 className="text-lg font-semibold mb-4">Segment Comparison Matrix</h3>
    <ChartCard className="flex-1 min-h-[500px]">
      {/* Chart content */}
    </ChartCard>
  </div>
</div>
```

**Pattern 2: Explicit Height Classes** (For simpler layouts)

```tsx
<div className="grid grid-cols-2 gap-4">
  <ChartCard className="h-[500px]">
    {/* Card 1 content */}
  </ChartCard>
  <ChartCard className="h-[500px]">
    {/* Card 2 content */}
  </ChartCard>
</div>
```

**Pattern 3: Auto-Height with Min-Height** (For dynamic content)

```tsx
<div className="flex gap-4">
  <div className="flex-1 min-h-[500px]">
    {/* Card 1 */}
  </div>
  <div className="flex-1 min-h-[500px]">
    {/* Card 2 */}
  </div>
</div>
```

**Height Selection Guidelines:**

| Content Type | Recommended Min Height | Notes |
|--------------|----------------------|-------|
| Simple Charts (bar, line) | `h-[400px]` or `min-h-[400px]` | Compact, easy to scan |
| Complex Visualizations | `h-[500px]` or `min-h-[500px]` | Room for details, legends |
| Tables with Data | `h-[600px]` or `min-h-[600px]` | Allows scrolling, more rows |
| Dashboard Cards | `h-[300px]` or `min-h-[300px]` | Quick KPI overview |

**Implementation Checklist:**
- [ ] Cards on same row have consistent height classes
- [ ] Use either explicit height (`h-[Xpx]`) or flex pattern (`flex-1` with `min-h-[Xpx]`)
- [ ] Test at different screen sizes (sm, md, lg, xl, 2xl)
- [ ] Ensure content fits without overflow (add `overflow-auto` if needed)
- [ ] Consider responsive breakpoints - may stack vertically on mobile

**Common Mistakes to Avoid:**
- ❌ Mixing height specifications (one card with `h-[500px]`, another with `h-auto`)
- ❌ Forgetting to test at xl+ breakpoints where cards appear side-by-side
- ❌ Using only `min-h` without flex context (may not stretch to match sibling)
- ❌ Hard-coding content height instead of using card container height

**Responsive Behavior:**

```tsx
// Cards stack on small screens, side-by-side on large screens
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
  {/* On mobile (< xl): Cards stack vertically, each can have natural height */}
  {/* On desktop (xl+): Cards side-by-side, MUST have equal heights */}

  <div className="h-full flex flex-col">
    {/* This ensures equal heights only when in grid layout */}
  </div>
</div>
```

##### 2.1.7: Single Card Per Visualization Rule ⚠️ CRITICAL

**MANDATORY REQUIREMENT**: Each visualization must have EXACTLY ONE card border around it. Never nest cards or create double borders.

**Why This Matters:**
- Double cards create visual clutter and confusion
- Reduces professional appearance
- Wastes screen real estate with unnecessary padding
- Creates inconsistent spacing across dashboard

**The Rule:**

> **If a visualization component has its own card/border styling built-in, do NOT wrap it in an external Card component**

**Correct Patterns:**

**Pattern 1: Component with Built-In Card** (No external wrapper needed)

```tsx
// ✅ CORRECT: Component already has card styling
<DashboardSection>
  <div
    onClick={(e) => {
      if (e.shiftKey) {
        // Shift-click handling
      }
    }}
  >
    <SegmentDistributionMap data={data} />
    {/* SegmentDistributionMap internally has: */}
    {/*   border: '2px solid #e8d4e6' */}
    {/*   borderRadius: '12px' */}
    {/*   boxShadow: '...' */}
  </div>
</DashboardSection>

// ❌ WRONG: Double card (external Card + internal styling)
<DashboardSection>
  <Card className="glass-card">  {/* ← External card */}
    <SegmentDistributionMap data={data} />
    {/* SegmentDistributionMap also has border/card styling ← Internal card */}
  </Card>
</DashboardSection>
```

**Pattern 2: Component WITHOUT Built-In Card** (External Card wrapper needed)

```tsx
// ✅ CORRECT: Chart.js/Recharts components have no built-in borders
<div className="h-full flex flex-col">
  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
    Customer Segment Distribution
  </h3>
  <Card className="glass-card flex-1 min-h-[450px]">
    <BarChart data={data} height={400} />
    {/* BarChart has NO built-in border/card styling */}
  </Card>
</div>

// ❌ WRONG: No card wrapper when component doesn't have styling
<div>
  <h3>Customer Segment Distribution</h3>
  <BarChart data={data} height={400} />
  {/* No border, no background - looks incomplete */}
</div>
```

**How to Check if Component Has Built-In Card:**

1. **Read the component file** - Look for inline styles or className with borders:
   ```tsx
   // HAS built-in card if you see:
   style={{
     border: '2px solid ...',
     borderRadius: '12px',
     boxShadow: '...'
   }}

   // OR:
   className="border rounded-lg shadow-lg bg-white"
   ```

2. **Visual inspection** - If the component already has a visible border/shadow when rendered alone, it has built-in card styling

3. **Common patterns:**
   - ✅ Custom complex components (maps, multi-part visualizations) → Usually have built-in styling
   - ✅ Chart.js/Recharts components → NO built-in card (need external Card wrapper)
   - ✅ Simple bar/line/pie charts → NO built-in card (need external Card wrapper)

**Exceptions:**
- **Segment Profile Cards**: These are card collections where each item is a card - this is intentional
- **KPI Cards**: Each KPI is a card within the KPIRow component - this is the standard pattern
- **Multi-card layouts**: Dashboard sections can contain multiple separate cards side-by-side

**Testing Checklist:**
- [ ] Inspect each visualization in browser DevTools
- [ ] Count the number of border/box-shadow layers
- [ ] If you see 2+ borders around a single chart → Fix required
- [ ] Verify shift-click still works after removing extra Card wrapper

**Common Violation:**
The most common mistake is adding a Card wrapper to SegmentDistributionMap, which already has complete card styling built into the component.

#### Step 2.2: Export All Components

```typescript
// visualizations/index.tsx
export { PerformanceChart } from './PerformanceChart';
export { DataTable } from './DataTable';
export { CategoryChart } from './CategoryChart';
export { ScatterChart } from './ScatterChart';
// ... all visualizations
```

```typescript
// components/index.tsx
export { DashboardKPIs } from './DashboardKPIs';

export {
  PerformanceChart,
  DataTable,
  CategoryChart,
  ScatterChart
} from './visualizations';
```

#### Step 2.7: Implement Frontend Caching with React Query

**Overview**: Add client-side caching to reduce unnecessary API calls and improve dashboard performance. React Query provides a stale-while-revalidate caching strategy that matches the backend cache TTL.

**Benefits**:
- ✅ **Instant loading**: Stale data shown immediately while fresh data fetches in background
- ✅ **Reduced API calls**: Same filter combination uses cache instead of re-fetching
- ✅ **Automatic refetching**: Handles window focus, network reconnection, and intervals
- ✅ **Request deduplication**: Multiple components requesting same data trigger single API call
- ✅ **Cache synchronization**: QueryKey includes filters for unique cache entries

##### Step 2.7.1: Install React Query

**File**: `apps/frontend/package.json`

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    // ... other dependencies
  }
}
```

**Install**:
```bash
cd apps/frontend
pnpm install
```

##### Step 2.7.2: Create Query Provider

**File**: `apps/frontend/src/app/providers/QueryProvider.tsx` (create new file)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient instance with stale-while-revalidate strategy
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes (matching backend TTL)
            staleTime: 5 * 60 * 1000,
            // Keep data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed queries once
            retry: 1,
            // Don't refetch on window focus (user can manually refresh)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**Key Configuration**:
- `staleTime: 5 * 60 * 1000` - Data considered fresh for 5 minutes (matches backend cache)
- `gcTime: 10 * 60 * 1000` - Keep unused data in cache for 10 minutes
- `retry: 1` - Retry failed requests once before showing error
- `refetchOnWindowFocus: false` - Don't refetch when user switches tabs

##### Step 2.7.3: Add Provider to Root Layout

**File**: `apps/frontend/src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "components/src/styles.css";
import "./globals.css";
import { ThemeProvider } from "components/index";
import ReduxProvider from "./providers/ReduxProvider";
import QueryProvider from "./providers/QueryProvider";  // Add import

export const metadata: Metadata = {
  title: "Enterprise Dashboards",
  description: "Multi-dashboard enterprise analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="soft-pastel" className="theme-soft-pastel" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen" data-theme="soft-pastel" suppressHydrationWarning>
        <QueryProvider>  {/* Wrap with QueryProvider */}
          <ReduxProvider>
            <ThemeProvider defaultTheme="soft-pastel">
              {children}
            </ThemeProvider>
          </ReduxProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

##### Step 2.7.4: Refactor Data Hook with React Query

**Original Pattern** (without caching):
```typescript
// hooks/useDashboardData.ts - OLD
export function useDashboardData(filters: DashboardFilters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/summary', {
          method: 'POST',
          body: JSON.stringify(filters)
        });
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  return { data, loading, error };
}
```

**React Query Pattern** (with caching):
```typescript
// hooks/useDashboardData.ts - NEW
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

async function fetchDashboardSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/your-dashboard/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.statusText}`);
  }

  return response.json();
}

export function useDashboardData(filters: DashboardFilters) {
  // Build filter params
  const filterParams = useMemo(() => ({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    products: filters.products.length > 0 ? filters.products : undefined,
    // ... other filters
  }), [filters]);

  // Use React Query with unique cache key per filter combination
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-name', filterParams],  // Unique key per filter set
    queryFn: () => fetchDashboardSummary(filterParams),
    staleTime: 5 * 60 * 1000,  // 5 minutes (matches backend cache)
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

  // Process and transform data
  const processedData = useMemo(() => {
    if (!rawData) return null;
    // ... data transformation logic
    return transformedData;
  }, [rawData]);

  return {
    data: processedData,
    loading,
    error,
    isFetching,  // Shows if background refetch is happening
  };
}
```

**Key Points**:
- ✅ **queryKey includes filters**: Different filters create different cache entries
- ✅ **Automatic caching**: React Query handles cache storage and retrieval
- ✅ **Background refetching**: `isFetching` indicates stale data being updated
- ✅ **Request deduplication**: Multiple calls with same queryKey share result

##### Step 2.7.5: Update Component to Use isFetching

Show background refetch indicator to users:

```typescript
// page.tsx
export default function DashboardPage() {
  const { filters } = useDashboardContext();
  const { data, loading, error, isFetching } = useDashboardData(filters);

  return (
    <div className="relative">
      {/* Background refetch indicator */}
      {isFetching && !loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      {/* ... rest of dashboard */}
    </div>
  );
}
```

##### Step 2.7.6: Testing Frontend Caching

**Test 1: Verify Cache Behavior in DevTools**

1. Open dashboard and open DevTools Network tab
2. Apply filters and load data (should see API call)
3. Change view/tab and come back (no new API call - using cache)
4. Wait 5 minutes and interact (background refetch starts)
5. Apply same filters again (cache hit, no API call)
6. Apply different filters (cache miss, new API call)

**Expected Behavior**:
```
Initial Load:        API Call  ✅ (cache miss)
Same filters:        No Call   ✅ (cache hit)
Different filters:   API Call  ✅ (new cache entry)
After 5 min stale:   Background Refetch ✅ (stale-while-revalidate)
```

**Test 2: Verify Multiple Components Share Cache**

```typescript
// Component A
function ComponentA() {
  const { data } = useDashboardData(filters);
  // Uses cache
}

// Component B
function ComponentB() {
  const { data } = useDashboardData(filters);
  // Shares cache with Component A, no duplicate API call
}
```

**Test 3: Performance Comparison**

```typescript
// Without caching: Every filter change = API call
Filter Change 1: 450ms API call
Filter Change 2: 420ms API call
Filter Change 3: 480ms API call

// With caching: Repeated filters = instant
Filter Change 1: 450ms API call (cache miss)
Filter Change 2: <5ms cache hit ⚡
Filter Change 1: <5ms cache hit ⚡
```

##### Step 2.7.7: Advanced: Manual Cache Invalidation

Invalidate cache when user performs actions:

```typescript
import { useQueryClient } from '@tanstack/react-query';

function DashboardActions() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate specific dashboard cache
    queryClient.invalidateQueries({ queryKey: ['dashboard-name'] });
  };

  const handleClearCache = () => {
    // Clear all cache
    queryClient.clear();
  };

  return (
    <button onClick={handleRefresh}>
      Refresh Data
    </button>
  );
}
```

##### Step 2.7.8: Troubleshooting

**Issue**: Cache not working, API called every time

**Fix**: Check queryKey is stable (use useMemo for filter params):
```typescript
// ❌ Wrong: Creates new object every render
const { data } = useQuery({
  queryKey: ['dashboard', { filters }],  // Object identity changes
  ...
});

// ✅ Correct: Stable object with useMemo
const filterParams = useMemo(() => ({ ...filters }), [filters]);
const { data } = useQuery({
  queryKey: ['dashboard', filterParams],
  ...
});
```

**Issue**: Stale data shown for too long

**Fix**: Reduce staleTime or enable refetchOnWindowFocus:
```typescript
staleTime: 2 * 60 * 1000,  // 2 minutes instead of 5
refetchOnWindowFocus: true,  // Refetch when user switches back to tab
```

**Key Points**:
- ✅ **Two-layer caching**: Backend (5 min) + Frontend (5 min) = Fast experience
- ✅ **Filter-aware**: queryKey includes all filters for unique cache entries
- ✅ **Automatic**: No manual cache management needed
- ✅ **Background updates**: Stale data shown while fresh data fetches
- ✅ **Request deduplication**: Single API call for multiple components
- ✅ **Consistent TTL**: Frontend staleTime matches backend cache TTL

---

### Phase 3: Enterprise-IQ Integration (1-2 hours)

#### Step 3.1: Update Component Registry

**File**: `apps/frontend/src/app/enterprise-iq/page.tsx`

```typescript
const componentRegistry = {
  // ... existing dashboards

  'product-performance': {
    kpis: dynamic(() => import('../product-performance/components').then(mod => mod.ProductKPIs)),
    overview: dynamic(() => import('../product-performance/components').then(mod => mod.ProductPerformanceOverview)),
    topProducts: dynamic(() => import('../product-performance/components').then(mod => mod.TopProductsTable)),
    categoryAnalysis: dynamic(() => import('../product-performance/components').then(mod => mod.CategoryPerformanceChart)),
    marginAnalysis: dynamic(() => import('../product-performance/components').then(mod => mod.MarginAnalysisScatter)),
    priceBands: dynamic(() => import('../product-performance/components').then(mod => mod.PriceBandDistribution))
  }
};
```

**Key Points**:
- ✅ Use `dynamic()` for code splitting
- ✅ Match component names from COMPONENT_SCHEMA
- ✅ Use correct import paths

#### Step 3.2: Add Prop Mappers

**File**: `apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts`

```typescript
export const componentPropMappers: Record<string, (summary: any) => any> = {
  // ... existing mappers

  // Product Performance KPIs
  'product-performance.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  // Product Performance Overview
  'product-performance.overview': (summary) => {
    return {
      data: {
        revenue: summary.mainData?.topProducts?.map(p => p.revenue) || [],
        units: summary.mainData?.topProducts?.map(p => p.unitsSold) || [],
        margin: summary.mainData?.topProducts?.map(p => p.marginPercent) || [],
        labels: summary.mainData?.topProducts?.map(p => p.productName) || []
      },
      loading: false
    };
  },

  // Top Products Table
  'product-performance.topProducts': (summary) => {
    return {
      data: summary.mainData?.topProducts || [],
      loading: false
    };
  },

  // Category Analysis Chart
  'product-performance.categoryAnalysis': (summary) => {
    return {
      data: summary.mainData?.categoryPerformance || [],
      loading: false
    };
  },

  // Margin Analysis Scatter
  'product-performance.marginAnalysis': (summary) => {
    return {
      data: summary.mainData?.marginAnalysis || [],
      loading: false
    };
  },

  // Price Band Distribution
  'product-performance.priceBands': (summary) => {
    return {
      data: summary.mainData?.priceBandDistribution || [],
      loading: false
    };
  }
};
```

**Key Points**:
- ✅ Map `toolname.componentName` to transformation function
- ✅ Transform API structure (`mainData`, `kpiMetrics`) to component props
- ✅ Handle missing data with fallbacks (`|| []`, `|| {}`)
- ✅ Always set `loading: false` (chat context already handled loading)

---

### Phase 4: Context & State Management (1-2 hours)

#### Step 4.1: Create Context with Filters

**File**: `apps/frontend/src/app/{dashboard-name}/context.tsx`

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager, getSelectionManager } from '../sales-performance/services/SelectionManager';

export interface DashboardFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  products: string[];
  // ... other filters
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  selectedDimension: string;
  setSelectedDimension: React.Dispatch<React.SetStateAction<string>>;
  selectedMetric: string;
  setSelectedMetric: React.Dispatch<React.SetStateAction<string>>;
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardData: any;
  setDashboardData: React.Dispatch<React.SetStateAction<any>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Dimension and metric selection
  const [selectedDimension, setSelectedDimension] = useState<string>('category');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // Always start with default filters (2017-2021)
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    categories: [],
    products: []
  });

  // Load filters from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboardFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {}
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboardFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // Load dimension/metric from localStorage
  useEffect(() => {
    const savedDimension = localStorage.getItem('dashboardDimension');
    const savedMetric = localStorage.getItem('dashboardMetric');
    if (savedDimension) setSelectedDimension(savedDimension);
    if (savedMetric) setSelectedMetric(savedMetric);
  }, []);

  // Save dimension/metric to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboardDimension', selectedDimension);
    } catch {}
  }, [selectedDimension]);

  useEffect(() => {
    try {
      localStorage.setItem('dashboardMetric', selectedMetric);
    } catch {}
  }, [selectedMetric]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectedDimension,
      setSelectedDimension,
      selectedMetric,
      setSelectedMetric,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      dashboardData,
      setDashboardData,
    }),
    [
      filters,
      selectedDimension,
      selectedMetric,
      selectionManager,
      isChatOpen,
      isBIModalOpen,
      dashboardData
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
```

**Key Points**:
- ✅ Default date range: 2017-2021
- ✅ localStorage persistence for all filters
- ✅ SelectionManager for chart interactions
- ✅ Panel states (isChatOpen, isBIModalOpen)
- ✅ Proper React.useMemo to prevent re-renders
- ✅ selectedDimension and selectedMetric for drill-downs

#### Step 4.2: Update Page Layout

**File**: `apps/frontend/src/app/{dashboard-name}/page.tsx`

```typescript
"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import {
  DashboardKPIs,
  PerformanceChart,
  DataTable,
  CategoryChart
} from './components';
import { useDashboardContext } from './context';
import { useDashboardData } from './hooks/useDashboardData';

export default function DashboardPage() {
  const { filters, setDashboardData } = useDashboardContext();

  const {
    loading,
    error,
    kpiMetrics,
    mainData,
    hasNoData
  } = useDashboardData(filters);

  React.useEffect(() => {
    if (mainData) {
      setDashboardData(mainData);
    }
  }, [mainData, setDashboardData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Dashboard",
      }}
    >
      <div className="space-y-6">
        {/* KPIs Section */}
        <DashboardSection title="Key Metrics">
          <DashboardKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Data Table - Full Width */}
        <DashboardSection title="Details">
          <DataTable data={mainData?.items || []} loading={loading} />
        </DashboardSection>

        {/* Charts - 2 Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={mainData?.chartData} loading={loading} />
          <CategoryChart data={mainData?.categoryData} loading={loading} />
        </div>
      </div>
    </PageLoader>
  );
}
```

#### Step 4.3: Navigation State Management (Already Implemented)

**Purpose**: Ensure floating action buttons (FABs) are blurred and disabled when navigation drawer is open to maintain consistent overlay behavior.

**Files Modified** (shared components - affects all dashboards automatically):
- `packages/components/src/layout/DashboardNavigation.tsx`
- `packages/components/src/layout/AppLayout.tsx`
- `packages/components/src/ui/FloatingActionButtons.tsx`

**Implementation Details**:

1. **DashboardNavigation.tsx** - Added callback to notify parent of state changes
```typescript
interface DashboardNavigationProps {
  onNavigationChange?: (isOpen: boolean) => void; // ← New prop
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  onNavigationChange,
  ...
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Notify parent when navigation state changes
  useEffect(() => {
    onNavigationChange?.(isOpen);
  }, [isOpen, onNavigationChange]);
};
```

2. **AppLayout.tsx** - Manages navigation state and passes to FABs
```typescript
export function AppLayout({ ... }: AppLayoutProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <>
      <DashboardNavigation
        onNavigationChange={setIsNavigationOpen}
      />
      <FloatingActionButtons
        isNavigationOpen={isNavigationOpen}
      />
    </>
  );
}
```

3. **FloatingActionButtons.tsx** - Blurs and disables when navigation is open
```typescript
interface FloatingActionButtonsProps {
  isNavigationOpen?: boolean; // ← New prop
}

export function FloatingActionButtons({
  isNavigationOpen = false,
  ...
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 z-[60] flex flex-col items-end gap-3 transition-all duration-300",
        isNavigationOpen && "opacity-30 blur-sm pointer-events-none"
      )}
      style={{ right: rightPosition }}
    >
      {/* FABs render here */}
    </div>
  );
}
```

**Expected Behavior**:
- ✅ Navigation opens → Blur overlay covers content → FABs blurred out (opacity-30 blur-sm)
- ✅ FABs are non-interactive (pointer-events-none) when navigation is open
- ✅ Navigation closes → FABs return to normal state
- ✅ Works automatically for all 8 customer dashboards (shared components)
- ✅ Consistent UX - FABs remain visible but disabled like dashboard content

**No Action Required**: This pattern is already implemented in the shared components. All dashboards using `AppLayout` automatically inherit this behavior.

---

#### Step 4.4: Date Range Filter Standardization (Churn Prediction Reference)

**Purpose**: Standardize time period filtering across all 8 customer dashboards using Churn Prediction's DateRangeFilter implementation.

**Reference Implementation** (Churn Prediction):

**Frontend Filter Component** (`apps/frontend/src/app/churn-prediction/components/ChurnFilters.tsx`):
```typescript
export function ChurnFilters({ filters, onFiltersChange, onReset }: ChurnFiltersProps) {
  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,  // { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        multiSelect: [
          // ... other filters
        ],
      }}
      onReset={onReset}
    />
  );
}
```

**Standard DateRange Interface**:
```typescript
interface DateRange {
  startDate: string;  // Format: "YYYY-MM-DD"
  endDate: string;    // Format: "YYYY-MM-DD"
}
```

**Shared Component** (`packages/components/src/filters/DateRangeFilter.tsx`):
- **Presets**: Last 7/30/90 Days, This Month, Last Month, This Year, Custom Range
- **Format**: ISO date strings (YYYY-MM-DD)
- **UX**: Dropdown select for presets, expandable custom date picker
- **Validation**: Start date cannot exceed end date
- **Persistence**: Saved to localStorage via context

**Default Date Range**:
```typescript
// Default to full dataset range: 2017-01-01 to 2021-12-31
const defaultFilters = {
  dateRange: {
    startDate: "2017-01-01",
    endDate: "2021-12-31"
  },
  // ... other filters
};
```

**Backend Parameter Mapping**:
```python
# Frontend sends: { dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" } }
# Backend receives: { dateFrom: "2017-01-01", dateTo: "2021-12-31" }

def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
    # Extract date range from filters
    date_from = filters.get('dateFrom', '2017-01-01')
    date_to = filters.get('dateTo', '2021-12-31')

    # Use in SQL queries
    query = """
        SELECT * FROM customers
        WHERE order_date BETWEEN :date_from AND :date_to
    """
    # ...
```

**Context Interface Update**:
```typescript
// All 8 dashboards should have this in their context interface
interface DashboardFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  // ... other filters specific to dashboard
}
```

**Implementation Checklist for Each Dashboard**:
- [ ] Filter component uses `<FilterBar config={{ dateRange: { enabled: true } }} />`
- [ ] Context interface includes `dateRange: { startDate, endDate }`
- [ ] Default values set to 2017-01-01 through 2021-12-31
- [ ] Backend processing service handles `dateFrom` and `dateTo` parameters
- [ ] SQL queries use date range filtering
- [ ] Data hook passes `dateRange` to API correctly

**Benefits**:
- ✅ Consistent UX across all 8 customer dashboards
- ✅ Same date presets and custom range picker
- ✅ Uniform date format (YYYY-MM-DD)
- ✅ Consistent default range (2017-2021 dataset)
- ✅ Single shared component for maintenance

---

### Phase 5: Testing & Validation (2-3 hours)

#### Step 5.1: Test Backend Tool

```bash
cd apps/adk
python -c "
from orchestration_agent.tools.product_performance import analyze_product_performance
result = analyze_product_performance('2021')
print(result[:2000])
print('...')
print('Has visualization tag:', '<is_visualisation>true</is_visualisation>' in result)
"
```

**Verify**:
- ✅ Tool returns text report
- ✅ Contains `## Visualization Data (Machine-Readable)` section
- ✅ Has `<output>` and `<is_visualisation>true</is_visualisation>` tags
- ✅ Metadata includes filters only, no data arrays

#### Step 5.2: Test API Endpoint

```bash
curl -X POST http://localhost:8000/api/product-performance/summary \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2017-01-01",
    "dateTo": "2021-12-31"
  }'
```

**Verify**:
- ✅ Returns `{kpiMetrics, mainData, insights, metadata}`
- ✅ kpiMetrics has all expected fields
- ✅ mainData has all expected arrays (topProducts, categoryPerformance, etc.)
- ✅ No errors in response

#### Step 5.3: Test Dashboard

1. Navigate to `/product-performance` in browser
2. Open DevTools console
3. Check for:
   - ✅ All visualizations load with data
   - ✅ KPIs display correctly
   - ✅ Charts render without errors
   - ✅ Table sorting and searching works
   - ✅ No console errors
   - ✅ Loading states work correctly

#### Step 5.4: Test Enterprise-IQ Chat

1. Open chat interface
2. Test queries:
   ```
   "Show me product performance for 2021"
   "Filter by Technology category"
   "Show products with margin over 30%"
   "Compare revenue across categories"
   ```
3. Verify:
   - ✅ Graphs spawn in canvas
   - ✅ Components load with correct data
   - ✅ Filters apply correctly
   - ✅ Follow-up queries work
   - ✅ Component names match registry

#### Step 5.5: Validate Data Consistency

1. **Dashboard**: Note KPI values (Total Revenue, Total Units, etc.)
2. **Chat**: Ask "Show me product performance for 2021"
3. **Compare**: Verify numbers match EXACTLY between dashboard and chat

**Example**:
```
Dashboard KPIs:
- Total Revenue: $142.5M
- Total Units: 45,832
- Avg Margin: 28.3%

Chat Response:
- Total Revenue: $142.5M ✅
- Total Units: 45,832 ✅
- Avg Margin: 28.3% ✅
```

If numbers don't match:
- ❌ Check if both use same date range (2017-2021)
- ❌ Check if filters are applied consistently
- ❌ Check if both call same processing service

---

## Common Issues & Fixes

### Issue 1: "ModuleNotFoundError: No module named 'orchestration_agent.services'"

**Cause**: Incorrect import path in tool file.

**Fix**:
```python
# ❌ Wrong
from orchestration_agent.services.processing.product_performance_processing import ProductPerformanceProcessingService

# ✅ Correct
from domains.product_performance.processing_service import ProductPerformanceProcessingService
```

### Issue 2: Charts not rendering / blank canvas

**Cause**: Chart.js not registered correctly.

**Fix**:
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add if using filled areas
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add if using filled areas
);
```

### Issue 3: "Hydration mismatch" errors

**Cause**: localStorage accessed during SSR.

**Fix**:
```typescript
// ❌ Wrong: Accessing localStorage immediately
const [filters, setFilters] = useState<Filters>(() => {
  const saved = localStorage.getItem('filters');
  return saved ? JSON.parse(saved) : defaultFilters;
});

// ✅ Correct: Load in useEffect
const [filters, setFilters] = useState<Filters>(defaultFilters);

useEffect(() => {
  try {
    const saved = localStorage.getItem('filters');
    if (saved) {
      setFilters(JSON.parse(saved));
    }
  } catch {}
}, []);
```

### Issue 4: Component not spawning in chat

**Cause**: Missing registry entry or wrong component name.

**Fix**:
1. Check COMPONENT_SCHEMA matches registry:
```python
# utils.py
"components": ["overview", "topProducts", "kpis"]
```

```typescript
// page.tsx
'product-performance': {
  overview: dynamic(...),
  topProducts: dynamic(...),
  kpis: dynamic(...)
}
```

2. Check tool output has correct componentName:
```python
viz_metadata = {
    "toolname": "product-performance",
    "componentName": "overview",  # Must match registry key
    "body": {...}
}
```

### Issue 5: Data not loading / empty charts

**Cause**: Prop mapper not transforming data correctly.

**Fix**:
```typescript
// ❌ Wrong: Direct mapping without fallback
'product-performance.overview': (summary) => {
  return {
    data: {
      revenue: summary.mainData.topProducts.map(p => p.revenue),  // Will crash if undefined
      // ...
    }
  };
}

// ✅ Correct: Safe mapping with fallbacks
'product-performance.overview': (summary) => {
  return {
    data: {
      revenue: summary.mainData?.topProducts?.map(p => p.revenue) || [],
      units: summary.mainData?.topProducts?.map(p => p.unitsSold) || [],
      margin: summary.mainData?.topProducts?.map(p => p.marginPercent) || [],
      labels: summary.mainData?.topProducts?.map(p => p.productName) || []
    },
    loading: false
  };
}
```

### Issue 6: Date range inconsistency

**Cause**: Different default dates in different places.

**Fix**: Use 2017-2021 EVERYWHERE:
```python
# Backend tool
filters['dateFrom'] = '2017-01-01'
filters['dateTo'] = '2021-12-31'
```

```typescript
// Frontend context
const [filters, setFilters] = useState({
  dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
  // ...
});
```

```typescript
// Frontend hook
const defaultFilters = {
  dateFrom: '2017-01-01',
  dateTo: '2021-12-31'
};
```

---

## Success Criteria Checklist

### Backend
- [ ] Tool outputs metadata-only format
- [ ] Tool has `<is_visualisation>true</is_visualisation>` tag
- [ ] COMPONENT_SCHEMA updated with all components
- [ ] Default time period: 2017-2021
- [ ] **DATA CONSISTENCY**: All dashboards use the SAME default date range (2017-2021) to ensure consistent "Total Customers" and other cross-dashboard metrics
- [ ] **DATA CONSISTENCY**: Filter engine (`apps/adk/database/filter_engine.py`) applies identical date defaults regardless of table type (transaction, loyalty, AR_DETAIL, etc.)
- [ ] **DATA CONSISTENCY**: API responses for the same time period produce identical base metrics (e.g., total customers, total revenue) across different dashboards
- [ ] **DATA CONSISTENCY**: Total customer counts must use `transactions_df['customer_id'].nunique()` or `customers_df['customer_id'].nunique()`, NOT derived data like predictions count
- [ ] **NO HARDCODED DATA**: NEVER use hardcoded/mock/sample data arrays in backend or frontend, even as fallbacks
- [ ] **NO HARDCODED DATA**: Return empty arrays `[]` or empty states instead of fake data
- [ ] **NO HARDCODED DATA**: Do NOT hardcode metric values (e.g., `return 5.2` for growth, `accuracy: 0.85` for model accuracy)
- [ ] **NO HARDCODED DATA**: Default date ranges (2017-2021) are acceptable as they match actual dataset, but should be documented
- [ ] **NO HARDCODED DATA**: If historical data unavailable for trends/comparisons, remove the field entirely rather than returning 0 or fake values
- [ ] **FILTER CONSISTENCY**: Filters with same semantic meaning (e.g., "Customer Segment", "Risk Level") must have IDENTICAL dropdown options across all dashboards
- [ ] **FILTER CONSISTENCY**: Filter option labels, values, and order must be standardized (e.g., ["Champions", "Loyal", "At Risk"] not ["Champions", "Loyal Customers", "At-Risk"])
- [ ] **FILTER CONSISTENCY**: Shared filter configurations MUST be imported from `apps/frontend/src/lib/constants/filterOptions.ts` - NEVER define inline
- [ ] **FILTER CONSISTENCY**: Available centralized filters: `CUSTOMER_SEGMENT_OPTIONS`, `RFM_SEGMENT_OPTIONS`, `REGION_OPTIONS`, `VALUE_CATEGORY_OPTIONS`, `RISK_LEVEL_OPTIONS`, `BEHAVIOR_TYPE_OPTIONS`, `DEFAULT_DATE_RANGE`
- [ ] **FILTER CONSISTENCY**: Import example: `import { REGION_OPTIONS, CUSTOMER_SEGMENT_OPTIONS } from '@/lib/constants/filterOptions'`
- [ ] Processing service handles all filters correctly
- [ ] **Caching**: All data-fetching methods have `@cache_dashboard_endpoint` decorators
- [ ] **Caching**: TTL configured appropriately for dashboard type
- [ ] **Caching**: Cache key generation includes filters for uniqueness
- [ ] **Hybrid Insights**: Both rule-based and AI insights implemented
- [ ] **Hybrid Insights**: Graceful fallback when AI unavailable
- [ ] **Performance**: AI insights do NOT block main endpoint (use separate cache)
- [ ] **Performance**: AI insights cached separately with 30-min TTL
- [ ] **Performance**: AI generation uses `asyncio.to_thread()` for non-blocking execution
- [ ] **Insights**: Single unified `insights` array returned (NOT separate arrays)
- [ ] **Insights**: Metadata tracks insight sources (rule_based_count, ai_count, total_count)
- [ ] **Insights**: insights_version set to "unified_v2"

### Frontend Components
- [ ] All visualization components created (4-6 components)
- [ ] KPIs use AnimatedKPITile
- [ ] Charts use dark theme colors
- [ ] Tables have sorting and searching
- [ ] All components have loading states
- [ ] All components have empty states
- [ ] **Caching**: React Query installed and configured
- [ ] **Caching**: QueryProvider added to root layout
- [ ] **Caching**: Data hooks refactored to use `useQuery`
- [ ] **Caching**: queryKey includes all filters for unique cache entries
- [ ] **Caching**: staleTime matches backend cache TTL (5 min)

### Enterprise-IQ Integration
- [ ] All components added to componentRegistry
- [ ] All components have prop mappers
- [ ] Prop mappers handle missing data (|| [], || {})
- [ ] Component names match COMPONENT_SCHEMA

### Context & State
- [ ] Context has all required fields
- [ ] Filters interface matches backend
- [ ] Default date range: 2017-2021
- [ ] localStorage persistence works
- [ ] SelectionManager integrated
- [ ] Panel states (isChatOpen, isBIModalOpen)
- [ ] **Navigation State**: FABs blurred and disabled when navigation drawer is open (automatic via AppLayout)

### Testing
- [ ] Backend tool test passes
- [ ] API endpoint returns correct structure
- [ ] Dashboard loads without errors
- [ ] All visualizations display data
- [ ] Charts render correctly
- [ ] Table sorting/searching works
- [ ] Chat spawns graphs correctly
- [ ] Data consistency verified (dashboard = chat)
- [ ] **DATA CONSISTENCY ACROSS DASHBOARDS**: Total Customers matches across all dashboards (Churn, Segmentation, LTV) when using same date filters
- [ ] **DATA CONSISTENCY ACROSS DASHBOARDS**: Base metrics (revenue, customers, transactions) match between dashboards for the same time period
- [ ] **DATA CONSISTENCY ACROSS DASHBOARDS**: Default date range (2017-2021) produces identical counts/sums in all dashboard KPIs
- [ ] **FILTER CONSISTENCY ACROSS DASHBOARDS**: Same filter types have identical dropdown options across dashboards (e.g., "Customer Segment" filter shows same segments in Churn and Segmentation dashboards)
- [ ] **FILTER CONSISTENCY ACROSS DASHBOARDS**: Filter option labels match exactly (e.g., all dashboards use "Champions" not mix of "Champions" and "Champion Customers")
- [ ] **FILTER CONSISTENCY ACROSS DASHBOARDS**: Filter option order is consistent (alphabetical or by importance, but same across all dashboards)
- [ ] **Caching**: Backend cache hit/miss behavior verified
- [ ] **Caching**: Different filters create different cache entries
- [ ] **Caching**: Frontend cache working (Network tab shows reduced API calls)
- [ ] **Caching**: Background refetch working after staleTime expires
- [ ] **Insights**: Both rule-based and AI insights display correctly
- [ ] **Performance**: Dashboard loads in < 500ms with cache hit
- [ ] **Performance**: Dashboard loads in < 600ms with cache miss (AI async)
- [ ] **Performance**: AI insights appear without blocking main data load
- [ ] **Insights**: Response has single `insights` array (no separate `ai_insights`)
- [ ] **Insights**: insights_metadata present with correct counts
- [ ] **Navigation**: FABs blurred (opacity-30 blur-sm) when navigation drawer opens
- [ ] **Navigation**: FABs are non-interactive (pointer-events-none) when navigation is open
- [ ] **Navigation**: FABs return to normal state when navigation drawer closes
- [ ] **Navigation**: Only navigation and overlay are interactive when drawer is open

---

## Dashboard Standardization Patterns (2025 Update)

### Overview

This section documents the standardization patterns implemented across all 8 customer dashboards to ensure consistency in user experience, code architecture, and functionality.

**Affected Dashboards:**
1. Churn Prediction
2. Customer Segmentation
3. Customer Lifetime Value
4. Customer Behavior
5. Anomaly Detection
6. Engagement Classifier
7. Transaction Patterns
8. Performance Deviation

---

### 1. Navigation: Home Button Pattern

**Location:** `packages/components/src/layout/DashboardNavigation.tsx`

**Implementation:**
```typescript
{currentPath !== '/enterprise-iq' && (
  <div className="mb-6">
    <button
      onClick={() => {
        onNavigate('/enterprise-iq');
        setIsOpen(false);
      }}
      className="w-full text-left px-3 py-3 rounded-lg bg-accent text-background hover:bg-accent/90 transition-colors font-medium"
    >
      Home
    </button>
  </div>
)}
```

**Key Points:**
- Home button only visible when NOT on Enterprise-IQ landing page
- Text-only (no icon) for clean appearance
- Navigates to `/enterprise-iq`
- Positioned at top of navigation panel

---

### 2. Filter Reset with localStorage Clear

**Problem:** Filters persisted between sessions even after reset, causing user confusion.

**Solution:** All dashboard layouts must clear localStorage on filter reset.

**Standard Pattern:**
```typescript
// In layout.tsx HeaderFilters component
<DashboardFilters
  filters={filters}
  onFiltersChange={setFilters}
  onReset={() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard_name_filters');
    }
    // Reset to defaults
    setFilters({
      dateRange: {
        startDate: "2017-01-01",
        endDate: "2021-12-31",
      },
      // ... other default values
    });
  }}
/>
```

**localStorage Keys Convention:**
- `churnFilters` and `churnTimeRange` (Churn Prediction)
- `segmentation_filters` (Customer Segmentation)
- `ltv_filters` (Customer LTV)
- `behaviorFilters` (Customer Behavior)
- `anomalyFilters` (Anomaly Detection)
- `engagement_classifier_filters` (Engagement Classifier)
- `transactionFilters` (Transaction Patterns)
- `performance_deviation_filters` (Performance Deviation)

---

### 3. Table Standardization

**Reference:** Churn Prediction's `CustomerRiskDetails` table

**Standard Component:** `DataTable` from `packages/components`

**Required Features:**
- ✅ Search functionality
- ✅ Pagination (configurable page size)
- ✅ Sortable columns
- ✅ Shift-click on rows for selection
- ✅ Responsive design
- ✅ Loading states
- ✅ Empty states

**Implementation Pattern:**
```typescript
import { DataTable } from 'components/index';

// Normalize data
const rows = data.map((item, index) => ({
  id: item.id || `row-${index}`,
  // ... map fields to consistent structure
}));

// Define columns
const columns: ColumnDefinition[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => row.name
  },
  // ... more columns
];

// Render
<DataTable
  data={rows}
  columns={columns}
  searchable
  selectable={false}
  pageSize={10}
  onRowClick={(row, event) => {
    if (event?.shiftKey) {
      shiftClickManager.addPoint({
        label: `Row: ${row.name}`,
        value: `Value: ${row.value}`,
        source: 'Table Name'
      }, event.nativeEvent);
    }
  }}
/>
```

---

### 4. Graph Title Standardization (UPDATED 2025)

**Problem:** Inconsistent title placement and styling - some inside cards, some in DashboardSection, varying font sizes and colors.

**Solution:** ALL graph titles must:
1. Be positioned ABOVE their cards as standalone h3 headings
2. Use UNIFORM styling across all dashboards
3. Have responsive font sizing for mobile and desktop
4. Match the ChartContainer component pattern

**Standard Pattern for Individual Chart Titles:**
```typescript
<DashboardSection>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
    {/* Individual Chart */}
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Chart Title</h3>
      <Card
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Chart Title",
            value: `Chart description`,
            source: 'Dashboard Name - Chart'
          }, event.nativeEvent);
        }}
      >
        {/* Chart content */}
      </Card>
    </div>
  </div>
</DashboardSection>
```

**Standard H3 Title Styling (REQUIRED):**
```tsx
className="text-base sm:text-lg font-semibold text-foreground mb-4"
```

**Breakdown:**
- `text-base` - Base font size for mobile (16px)
- `sm:text-lg` - Larger font size for desktop (18px)
- `font-semibold` - Semi-bold weight (600)
- `text-foreground` - Theme-aware text color
- `mb-4` - Consistent bottom margin (1rem / 16px)

**Section Title Guidelines:**
- ✅ ONLY "Key Metrics" should have a DashboardSection title prop
- ❌ All other sections should use `<DashboardSection>` WITHOUT title prop
- ✅ Individual charts get h3 titles above their cards

**Examples:**

✅ **CORRECT** - KPI Section (only place with section title):
```typescript
<DashboardSection title="Key Metrics">
  <KPIRow kpis={kpis} />
</DashboardSection>
```

✅ **CORRECT** - Chart Section (no section title, only chart titles):
```typescript
<DashboardSection>
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Risk Distribution Pyramid</h3>
      <ChartCard className="glass-card card-hover" onShiftClick={...}>
        <RiskPyramid data={data} />
      </ChartCard>
    </div>
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Churn Probability Distribution</h3>
      <ChartCard className="glass-card card-hover" onShiftClick={...}>
        <ProbabilityHistogram data={data} />
      </ChartCard>
    </div>
  </div>
</DashboardSection>
```

❌ **INCORRECT** - Title inside Card:
```typescript
<ChartCard title="Chart Title">  {/* DON'T DO THIS */}
  <Chart />
</ChartCard>
```

❌ **INCORRECT** - Section title for non-KPI sections:
```typescript
<DashboardSection title="Analysis Section">  {/* DON'T DO THIS */}
  <div>...</div>
</DashboardSection>
```

❌ **INCORRECT** - Inconsistent h3 styling:
```typescript
<h3 className="text-lg font-semibold mb-2 text-foreground">  {/* DON'T DO THIS */}
```

**Chart.js Configuration:**
- ❌ Do NOT use Chart.js plugin title config: `plugins: { title: { display: true, text: 'Chart Title' } }`
- ✅ Disable Chart.js titles in component options: `plugins: { title: { display: false } }`

**Important Rules:**
1. NEVER use `title` or `description` props on Card/ChartCard components
2. NEVER use varying h3 className patterns - always use the standard
3. NEVER add section titles except "Key Metrics"
4. ALWAYS wrap chart in a div with h3 title above it
5. ALWAYS use the exact className pattern for responsive sizing

**Exception:**
- Customer Segmentation's "Segment Profiles" section keeps titles inside cards (this is intentional for that specific design pattern)

---

### 5. Shift-Click Functionality

**Universal Implementation:** All KPI cards, chart cards, data points, and table rows must support shift-click.

#### 5.1 Base Component Support

**KPICard Component:**
```typescript
// packages/components/src/kpi/KPICard.tsx
export interface KPICardProps {
  // ... existing props
  onClick?: (event: React.MouseEvent) => void;
  onShiftClick?: (event: React.MouseEvent) => void;
}

const handleClick = (event: React.MouseEvent) => {
  if (event.shiftKey && onShiftClick) {
    onShiftClick(event);
  } else if (onClick) {
    onClick(event);
  }
};

<div onClick={handleClick} className={/* ... */}>
```

**KPIRow Component:**
```typescript
// packages/components/src/kpi/KPIRow.tsx
export interface KPIRowProps {
  kpis: KPIData[];
  onKPIClick?: (kpi: KPIData, event: React.MouseEvent) => void;
  onKPIShiftClick?: (kpi: KPIData, event: React.MouseEvent) => void;
}
```

**Card/ChartCard Components:**
```typescript
// packages/components/src/ui/Card.tsx
// packages/components/src/ui/ChartCard.tsx
export interface CardProps {
  // ... existing props
  onClick?: () => void;
  onShiftClick?: (event: React.MouseEvent) => void;
}
```

#### 5.2 KPI Implementation Pattern

**Using KPIRow:**
```typescript
import { KPIRow, getShiftClickManager } from 'components/index';

const shiftClickManager = getShiftClickManager();

<KPIRow
  kpis={kpiTiles}
  columns={5}
  animationDelay={50}
  onKPIShiftClick={(kpi, event) => {
    shiftClickManager.addPoint({
      label: kpi.title,
      value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
      source: 'Dashboard Name KPIs'
    }, event.nativeEvent);
  }}
/>
```

**Using Individual KPICard:**
```typescript
<KPICard
  title="Metric Name"
  value={value}
  icon={icon}
  loading={loading}
  onShiftClick={(event) => {
    shiftClickManager.addPoint({
      label: "Metric Name",
      value: value.toString(),
      source: 'Dashboard KPIs'
    }, event.nativeEvent);
  }}
/>
```

#### 5.3 Chart Implementation Pattern

**For Card Components:**
```typescript
import { Card, getShiftClickManager } from 'components/index';

const shiftClickManager = getShiftClickManager();

<Card
  onShiftClick={(event) => {
    shiftClickManager.addPoint({
      label: "Chart Name",
      value: `Chart description`,
      source: 'Dashboard Name - Chart'
    }, event.nativeEvent);
  }}
>
  {/* Chart content */}
</Card>
```

**For ChartCard Components:**
```typescript
import { ChartCard, getShiftClickManager } from 'components/index';

const shiftClickManager = getShiftClickManager();

<ChartCard
  className="glass-card card-hover"
  onShiftClick={(event) => {
    shiftClickManager.addPoint({
      label: "Chart Name",
      value: `Chart description`,
      source: 'Dashboard Name - Chart'
    }, event.nativeEvent);
  }}
>
  {/* Chart content */}
</ChartCard>
```

#### 5.4 Data Point Implementation Pattern

**For Chart.js Charts:**
```typescript
// Inside chart options
onClick: (event: any, elements: any[]) => {
  if (elements.length > 0 && event?.native?.shiftKey) {
    const index = elements[0].index;
    const dataPoint = data[index];

    shiftClickManager.addPoint({
      label: `${dataPoint.label}`,
      value: `${dataPoint.value}`,
      source: 'Chart Name - Data Point'
    }, event.native);
  }
}
```

**For Custom Visualizations:**
```typescript
<div
  onClick={(e) => {
    if (e.shiftKey) {
      shiftClickManager.addPoint({
        label: `Data: ${item.label}`,
        value: `Value: ${item.value}`,
        source: 'Visualization Name'
      }, e.nativeEvent);
    }
  }}
>
  {/* Custom visualization element */}
</div>
```

#### 5.5 Table Row Implementation

See "Table Standardization" section above for DataTable shift-click pattern.

---

### 6. Filter Consistency

**Standard:** All dashboard filters use `FilterBar` component from shared components library.

**Layout Structure:**
```typescript
// In layout.tsx
function HeaderFilters() {
  const { filters, setFilters } = useDashboardContext();
  return (
    <DashboardFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={/* See section 2 for reset pattern */}
    />
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  // ... context setup

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      <HeaderFilters />
      <div className="mt-6">
        {children}
      </div>
    </div>
  );

  return (
    <>
      <AppLayout
        title="Dashboard Name"
        mainContent={mainContent}
        {/* ... other props */}
      />
    </>
  );
}
```

**Best Practices:**
- ✅ Keep filter component in separate file (e.g., `DashboardFilters.tsx`)
- ✅ Use consistent prop naming: `filters`, `onFiltersChange`, `onReset`
- ✅ Wrap AppLayout in Fragment (`<> </>`) for consistency
- ✅ Use standard padding: `p-4 sm:p-6 lg:p-8`

---

### 7. Import Standardization

**Standard Imports:**
```typescript
// Page-level components
import {
  DashboardSection,
  PageLoader,
  Card,
  ChartCard,
  KPIRow,
  DataTable,
  getShiftClickManager
} from 'components/index';
```

**Context Imports:**
```typescript
import { useDashboardContext } from './context';
import { useDashboardData } from './hooks/useDashboardData';
```

---

### 8. Code Organization Checklist

When implementing or updating dashboards, ensure:

**File Structure:**
- [ ] `page.tsx` - Main dashboard page
- [ ] `layout.tsx` - Layout with filters and AppLayout
- [ ] `context.tsx` - Context provider with state management
- [ ] `components/` - Dashboard-specific components
  - [ ] `{Dashboard}Filters.tsx` - Filter component
  - [ ] `{Dashboard}KPIs.tsx` - KPI component
  - [ ] `visualizations/` - Chart components (if complex)
  - [ ] `index.tsx` - Component exports
- [ ] `hooks/` - Custom hooks
  - [ ] `use{Dashboard}Data.ts` - Data fetching hook

**Component Structure:**
- [ ] All KPI cards have shift-click handlers
- [ ] All charts have shift-click handlers on cards
- [ ] All charts have shift-click handlers on data points
- [ ] All tables use DataTable component with shift-click
- [ ] All graph titles are positioned above cards
- [ ] All filters use FilterBar component
- [ ] Filter reset clears localStorage

**Integration:**
- [ ] Tool registered in `toolApiRegistry.ts`
- [ ] Components registered in `ComponentRegistry.tsx`
- [ ] Prop mappers defined in `componentPropMappers.ts`
- [ ] Dashboard added to `dashboards.ts` constants

---

### 9. Testing Checklist

**Shift-Click Functionality:**
- [ ] Shift-clicking KPI cards adds to selection
- [ ] Shift-clicking chart cards adds to selection
- [ ] Shift-clicking data points adds to selection
- [ ] Shift-clicking table rows adds to selection
- [ ] Selected items appear in ChatBot context
- [ ] Multiple shift-clicks accumulate selections
- [ ] Clear selection button works

**Filter Functionality:**
- [ ] Filter changes update visualizations
- [ ] Filter reset clears all selections
- [ ] Filter reset clears localStorage
- [ ] New session starts with fresh data (no persisted filters)
- [ ] Filter state persists during session

**Visual Consistency:**
- [ ] All graph titles are above cards
- [ ] All tables use DataTable component
- [ ] Home button appears in navigation (except on Enterprise-IQ)
- [ ] Layout matches other dashboards

---

## Reference Implementations

### Complete Examples

1. **Sales Performance** - `apps/frontend/src/app/sales-performance/`
   - Full implementation with 6 visualization components
   - Complex filtering (regions, categories, products, channels)
   - Time series analysis
   - Reference for multi-axis charts

2. **Customer Segmentation** - `apps/frontend/src/app/customer-segmentation/`
   - RFM analysis visualization
   - Scatter plots and heatmaps
   - Customer cohort tables
   - Reference for segment analysis

3. **Customer LTV** - `apps/frontend/src/app/customer-ltv/`
   - Lifetime value calculations
   - Cohort retention analysis
   - Predictive modeling visualizations
   - Reference for time-based metrics

4. **Product Performance** - `apps/frontend/src/app/product-performance/`
   - Product analysis and comparison
   - Category performance charts
   - Margin analysis scatter plots
   - Reference for product-centric dashboards

### Key Files to Reference

**Backend**:
- `apps/adk/orchestration_agent/tools/sales_performance.py` - Tool structure
- `apps/adk/domains/sales_performance/processing_service.py` - Processing service pattern
- `apps/adk/lib/utils.py` - COMPONENT_SCHEMA format

**Frontend**:
- `apps/frontend/src/app/sales-performance/page.tsx` - Page layout
- `apps/frontend/src/app/sales-performance/context.tsx` - Context pattern
- `apps/frontend/src/app/sales-performance/components/visualizations/` - Chart examples
- `apps/frontend/src/app/enterprise-iq/page.tsx` - Component registry
- `apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts` - Prop mapper examples

---

## Filter Implementation Standards (2025 Update)

### Rule: Single Filter Location Per Dashboard

**Problem:** Some dashboards had duplicate filters in both `layout.tsx` AND `page.tsx`, causing:
- Inconsistent filter state
- Confusing user experience
- Difficult maintenance
- Different field naming conventions

**Solution:** Filters must ONLY exist in ONE location per dashboard

### Standard Pattern

**✅ CORRECT - Filters in page.tsx ONLY:**

```typescript
// page.tsx
export default function DashboardPage() {
  const { filters, setFilters } = useDashboardContext();

  return (
    <PageLoader isLoading={loading}>
      {/* Filters at top of page */}
      <DashboardSection>
        <FilterBar
          config={{
            dateRange: {
              enabled: true,
              value: filters.dateRange ? {
                from: new Date(filters.dateRange.startDate),
                to: new Date(filters.dateRange.endDate)
              } : { from: new Date('2017-01-01'), to: new Date('2021-12-31') },
              onChange: (range) => {
                if (range?.from && range?.to) {
                  setFilters({
                    ...filters,
                    dateRange: {
                      startDate: range.from.toISOString().split('T')[0],
                      endDate: range.to.toISOString().split('T')[0]
                    }
                  });
                }
              }
            },
            multiSelect: [
              {
                id: 'regions',
                label: 'Regions',
                options: [...],
                value: filters.regions || [],
                onChange: (values) => setFilters({ ...filters, regions: values }),
                placeholder: 'Select regions...'
              }
            ]
          }}
          onReset={() => {
            // Clear localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('dashboard_filters');
            }
            // Reset to defaults
            setFilters({
              dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
              regions: [],
              // ... other defaults
            });
          }}
          showResetButton={true}
        />
      </DashboardSection>

      {/* Rest of dashboard content */}
    </PageLoader>
  );
}
```

**❌ INCORRECT - Duplicate filters:**
```typescript
// layout.tsx - DON'T DO THIS
function HeaderFilters() {
  return <CustomFilters ... />; // ❌ Creates duplicate
}

// AND page.tsx - Having filters here too
<FilterBar ... /> // ❌ Results in two filter sets
```

### Filter Field Naming Standards

**Use consistent field names across all dashboards:**

| Field Type | Standard Name | Example Value |
|-----------|---------------|---------------|
| Date Range | `dateRange: { startDate, endDate }` | `{ startDate: '2017-01-01', endDate: '2021-12-31' }` |
| Multi-Select Arrays | `customerSegments`, `regions`, `valueCategories` | `['Enterprise', 'Mid-Market']` |
| Search | `search` | `'customer name'` |
| Single-Select | `selectedRegion`, `selectedType` | `'North America'` |

**Important:**
- Always clear localStorage in onReset handler
- Always provide default values in reset
- Always use FilterBar component from `components/index`
- Never create custom filter components in layout.tsx

---

## Filter Dropdown Z-Index Standards (2025 Update)

### Problem: Dropdown Overlap When Filters Wrap

When filters wrap to multiple lines on smaller screens, dropdown menus from top-row filters would overlap or blend with bottom-row filters, making them unusable.

**Visual Example:**
```
[Filter 1 ▼] [Filter 2 ▼]
[Filter 3  ] [Filter 4  ]
     |
     └─ Dropdown appears here but gets cut off
        by Filter 3 and 4 below
```

### Solution: Proper Z-Index Hierarchy

**Updated Z-Index Values:**

```typescript
// Container: NO z-index (just relative)
<div ref={dropdownRef} className={`relative ${className}`}>

// Dropdown Menu: z-[100]
{isOpen && (
  <div className="absolute z-[100] w-full mt-1 ... top-full">
```

**Why This Works:**
- **Container has NO z-index**: Avoids creating a new stacking context
  - Using `position: relative` with a z-index creates a stacking context
  - Child elements' z-index becomes relative to that context, not global
  - Removing z-index from container lets children have global z-index values

- **Dropdown has `z-[100]`**: Ensures it appears above ALL content globally
  - Above other filters (no z-index)
  - Above cards and charts (z-10 or z-20)
  - Above dashboard sections (no z-index)
  - Below modals and navigation (z-50, z-100+)

**Key Concept - Stacking Context:**
```typescript
// ❌ WRONG - Creates stacking context
<div className="relative z-30">  {/* Stacking context */}
  <div className="absolute z-[100]">  {/* z-100 only within parent context */}
    Dropdown
  </div>
</div>

// ✅ CORRECT - No stacking context
<div className="relative">  {/* No z-index = no stacking context */}
  <div className="absolute z-[100]">  {/* z-100 is global */}
    Dropdown
  </div>
</div>
```

### Files Updated

Apply this pattern to all filter components:

1. **MultiSelectFilter.tsx**
   - Line 69: Container - `className={relative ${className}}` (NO z-index)
   - Line 133: Dropdown - `className="absolute z-[100] ..."` (GLOBAL z-index)

2. **SingleSelectFilter.tsx**
   - Line 54: Container - `className={relative ${className}}` (NO z-index)
   - Line 89: Dropdown - `className="absolute z-[100] ..."` (GLOBAL z-index)

3. **DateRangeFilter.tsx** - (Uses Select component, already handles z-index correctly)

### Testing

After implementation, test:
1. Resize browser to force filter wrapping
2. Open dropdown from top-row filter
3. Verify dropdown appears ABOVE bottom-row filters
4. Verify dropdown is fully visible and clickable
5. Test on mobile, tablet, and desktop viewports

---

## Table Row Shift-Click Standard (2025 Update)

### Requirement

**ALL tables MUST support shift-click on rows for multi-point selection in Business Intelligence panel.**

### Implementation

#### 1. DataTable Component Fix

The `DataTable` component must pass the event object to `onRowClick`:

```typescript
// packages/components/src/tables/DataTable.tsx

// Type definition (line 19)
export interface DataTableProps<T> {
  // ...
  onRowClick?: (row: T, event?: React.MouseEvent<HTMLTableRowElement>) => void;
  // ...
}

// Row rendering (line 214)
<tr
  onClick={(event) => onRowClick?.(row, event)}  // ✅ Pass event
>
```

**✅ CORRECT:**
```typescript
onClick={(event) => onRowClick?.(row, event)}
```

**❌ INCORRECT:**
```typescript
onClick={() => onRowClick?.(row)}  // Missing event parameter
```

#### 2. Table Component Pattern

Every table component must implement shift-click in its `onRowClick` handler:

```typescript
import { getShiftClickManager } from 'components/index';

export function CustomerTable({ data, loading }: Props) {
  const shiftClickManager = getShiftClickManager();

  // Define columns
  const columns: ColumnDefinition[] = [
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      render: (row) => row.customer_name
    },
    // ... more columns
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      searchable
      pageSize={10}
      onRowClick={(row, event) => {
        if (event?.shiftKey) {
          // Shift+click: Add to multi-select for BI panel
          shiftClickManager.addPoint({
            label: `Customer: ${row.name}`,
            value: `Total Spend: $${row.totalSpend.toFixed(2)}, Status: ${row.status}`,
            source: 'Dashboard Name - Table Name'
          }, event.nativeEvent);
        } else {
          // Regular click: Show customer details or other action
          onCustomerSelect?.(row);
        }
      }}
    />
  );
}
```

### Key Points

1. **Always check `event?.shiftKey`** before adding to shift-click selection
2. **Provide meaningful labels** - Use customer name, ID, or other identifier
3. **Include relevant values** - Add key metrics, status, or summary data
4. **Set clear source** - Format: `'Dashboard Name - Table Name'`
5. **Use `event.nativeEvent`** when calling `shiftClickManager.addPoint()`
6. **Support regular clicks** - Non-shift clicks can trigger other actions (details panel, navigation, etc.)

### Example Implementations

**Churn Prediction Table:**
```typescript
onRowClick={(row, event) => {
  if (event?.shiftKey) {
    shiftClickManager.addPoint({
      label: `Customer: ${row.name}`,
      value: `Risk: ${row.riskLevel} (${row.riskPercentage}%)`,
      source: 'Churn Dashboard - Customer Table'
    }, event.nativeEvent);
  } else {
    onCustomerSelect(row);
  }
}}
```

**Anomaly Detection Table:**
```typescript
onRowClick={(row, event) => {
  if (event?.shiftKey) {
    shiftClickManager.addPoint({
      label: `Customer: ${row.customer_name}`,
      value: `Severity: ${row.severity_level} (Score: ${row.anomaly_score.toFixed(3)})`,
      source: 'Anomaly Dashboard - Anomalies Table'
    }, event.nativeEvent);
  } else {
    setSelectedCustomer(row);
  }
}}
```

### Testing Checklist

- [ ] Shift-click on table row adds point to selection manager
- [ ] Non-shift click triggers default action (if any)
- [ ] Multiple shift-clicks accumulate in selection
- [ ] Selection visible in BI panel
- [ ] Clear selection button works
- [ ] Selected points show correct label and value
- [ ] Source attribution is accurate

### Migration Note

**All existing tables** already have this pattern implemented. New tables MUST follow this standard from day one.

---

## Time Estimates

- **Phase 1 (Backend ADK Tool)**: 2-3 hours
- **Phase 2 (Frontend Components)**: 4-6 hours
- **Phase 3 (Enterprise-IQ Integration)**: 1-2 hours
- **Phase 4 (Context & State)**: 1-2 hours
- **Phase 5 (Testing & Validation)**: 2-3 hours

**Total**: 10-16 hours for complete implementation

---

## Notes

- Always use 2017-2021 as default date range for consistency
- Always include loading and empty states in components
- Always use dark theme colors (`text-muted-foreground`, `bg-muted`, etc.)
- Always add fallbacks in prop mappers (`|| []`, `|| {}`)
- Always test data consistency between dashboard and chat
- Always use `React.useMemo` in context to prevent re-renders
- Always use `dynamic()` imports in component registry for code splitting

---

**For questions or issues**: Reference existing implementations in Sales Performance, Customer Segmentation, Customer LTV, and Product Performance dashboards.
