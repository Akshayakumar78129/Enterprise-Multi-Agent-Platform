import React, { useEffect, useMemo, useState } from 'react';

interface InteractiveAIDashboardAssistantProps {
  dashboardState?: any; // optional: used for deriving insights and badge content
  suppressTrigger?: boolean; // when true, hide the floating trigger button (e.g., when main chat is open)
}

type ChatMessage = {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
};

type Question = {
  id: string;
  prompt: string;
  options: { id: string; label: string; value: string }[];
};

// Derive a succinct headline insight from the dashboard's KPIs
function deriveHeadline(state?: any): string {
  const k = state?.data?.kpis || {};
  const rev = Number(k.total_revenue ?? 0);
  const units = Number(k.total_units ?? 0);
  const aov = Number(k.avg_order_value ?? 0);

  if (!rev && !units && !aov) return 'Ready to help analyze your dashboard.';
  const parts: string[] = [];
  if (rev) parts.push(`Revenue: $${Math.round(rev).toLocaleString()}`);
  if (units) parts.push(`Units: ${Math.round(units).toLocaleString()}`);
  if (aov) parts.push(`AOV: $${Math.round(aov).toLocaleString()}`);
  return `Snapshot — ${parts.join(' · ')}`;
}

// Compute a dynamic badge message
function computeBadge(state?: any): { text: string; tone: 'neutral' | 'alert' | 'positive' } {
  const k = state?.data?.kpis || {};
  const rev = Number(k.total_revenue ?? 0);
  const units = Number(k.total_units ?? 0);
  const aov = Number(k.avg_order_value ?? 0);

  if (rev > 0 && aov > 0) return { text: `AOV $${Math.round(aov).toLocaleString()}`, tone: 'positive' };
  if (units > 0) return { text: `${Math.round(units).toLocaleString()} units`, tone: 'neutral' };
  if (rev > 0) return { text: `$${Math.round(rev).toLocaleString()}`, tone: 'neutral' };
  return { text: 'Ready', tone: 'neutral' };
}

const QUESTIONS: Question[] = [
  {
    id: 'goal',
    prompt: 'What is your primary goal right now?',
    options: [
      { id: 'g1', label: 'Increase revenue', value: 'revenue' },
      { id: 'g2', label: 'Boost conversion rate', value: 'conversion' },
      { id: 'g3', label: 'Grow new leads/customers', value: 'leads' },
      { id: 'g4', label: 'Improve retention/LTV', value: 'retention' },
    ],
  },
  {
    id: 'budget',
    prompt: 'What budget range can you allocate?',
    options: [
      { id: 'b1', label: 'Minimal ($0 - $1k)', value: 'low' },
      { id: 'b2', label: 'Moderate ($1k - $10k)', value: 'mid' },
      { id: 'b3', label: 'Aggressive ($10k+)', value: 'high' },
    ],
  },
  {
    id: 'timeline',
    prompt: 'What is your timeline to see results?',
    options: [
      { id: 't1', label: 'Quick (2-4 weeks)', value: 'short' },
      { id: 't2', label: 'Quarter (1-3 months)', value: 'medium' },
      { id: 't3', label: 'Longer term (3-12 months)', value: 'long' },
    ],
  },
  {
    id: 'strategy',
    prompt: 'Preferred strategy approach?',
    options: [
      { id: 's1', label: 'Paid acquisition', value: 'paid' },
      { id: 's2', label: 'Organic/content/SEO', value: 'organic' },
      { id: 's3', label: 'Lifecycle/retention/CRM', value: 'crm' },
      { id: 's4', label: 'Sales enablement', value: 'sales' },
    ],
  },
  {
    id: 'constraints',
    prompt: 'Any key constraints?',
    options: [
      { id: 'c1', label: 'Limited team bandwidth', value: 'team' },
      { id: 'c2', label: 'Seasonality/volatility', value: 'seasonality' },
      { id: 'c3', label: 'Compliance/risk', value: 'compliance' },
      { id: 'c4', label: 'No major constraints', value: 'none' },
    ],
  },
];

const InteractiveAIDashboardAssistant: React.FC<InteractiveAIDashboardAssistantProps> = ({ dashboardState, suppressTrigger }) => {
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState<{ text: string; tone: 'neutral' | 'alert' | 'positive' }>({ text: 'Ready', tone: 'neutral' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finalized, setFinalized] = useState(false);

  const headline = useMemo(() => deriveHeadline(dashboardState), [dashboardState]);

  useEffect(() => {
    setBadge(computeBadge(dashboardState));
  }, [dashboardState]);

  const startChat = () => {
    setOpen(true);
    setMessages([
      { id: 'm0', role: 'assistant', content: `Insight: ${headline}` },
      { id: 'm1', role: 'assistant', content: 'I’ll tailor an action plan. First, a few quick questions.' },
    ]);
    setStepIndex(0);
    setAnswers({});
    setFinalized(false);
  };

  const currentQuestion = QUESTIONS[stepIndex];

  const handleAnswer = (q: Question, opt: Question['options'][number]) => {
    setAnswers(prev => ({ ...prev, [q.id]: opt.value }));

    // Brief AI analysis after each answer
    const analysis = (() => {
      if (q.id === 'goal') {
        if (opt.value === 'revenue') return 'We’ll combine conversion uplift with AOV expansion and targeted campaigns.';
        if (opt.value === 'conversion') return 'Let’s prioritize funnel diagnostics and friction removal for quick wins.';
        if (opt.value === 'leads') return 'We’ll scale scalable top-of-funnel with clear MQL definitions and routing.';
        if (opt.value === 'retention') return 'Lifecycle flows and value moments will be central to lift LTV.';
      }
      if (q.id === 'budget') {
        if (opt.value === 'low') return 'We’ll focus on organic and CRM tactics with high ROI and low spend.';
        if (opt.value === 'mid') return 'Balanced approach: test paid while strengthening organic foundations.';
        if (opt.value === 'high') return 'We can execute multi-channel paid plus robust lifecycle programs.';
      }
      if (q.id === 'timeline') {
        if (opt.value === 'short') return 'We’ll target fast impact: CRO, remarketing, and high-intent segments.';
        if (opt.value === 'medium') return 'We’ll mix short-term optimizations with sustainable growth plays.';
        if (opt.value === 'long') return 'We’ll invest in durable engines: content, SEO, and retention flywheels.';
      }
      if (q.id === 'strategy') {
        if (opt.value === 'paid') return 'We’ll define clear CAC/LTV guardrails and creative/testing cadence.';
        if (opt.value === 'organic') return 'Compounding value via content pillars, SEO hubs, and distribution.';
        if (opt.value === 'crm') return 'Lifecycle orchestration across onboarding, activation, and reactivation.';
        if (opt.value === 'sales') return 'Enablement assets, lead scoring, and pipeline velocity improvements.';
      }
      if (q.id === 'constraints') {
        if (opt.value === 'team') return 'We’ll use playbooks and automation to reduce operational overhead.';
        if (opt.value === 'seasonality') return 'We’ll pre-plan peak campaigns and stabilize trough periods.';
        if (opt.value === 'compliance') return 'We’ll embed reviews and guardrails into the plan to de-risk.';
        if (opt.value === 'none') return 'Great, we’ll optimize for maximum ROI without blockers.';
      }
      return 'Noted — adjusting the plan accordingly.';
    })();

    setMessages(prev => [
      ...prev,
      { id: `u-${q.id}`, role: 'user', content: opt.label },
      { id: `a-${q.id}`, role: 'assistant', content: analysis },
    ]);

    const next = stepIndex + 1;
    if (next < QUESTIONS.length) {
      setStepIndex(next);
    } else {
      // Finalize: produce a tailored plan
      setTimeout(() => finalizePlan(), 250);
    }
  };

  const finalizePlan = () => {
    setFinalized(true);
    const goal = answers.goal || 'revenue';
    const budget = answers.budget || 'mid';
    const timeline = answers.timeline || 'medium';
    const strategy = answers.strategy || 'organic';
    const constraints = answers.constraints || 'none';

    const k = dashboardState?.data?.kpis || {};
    const rev = Number(k.total_revenue ?? 0);

    const plan: string[] = [];
    plan.push('Action Plan — Personalized Strategy');
    plan.push('');
    plan.push(`Objective: ${goal} · Budget: ${budget} · Timeline: ${timeline}`);
    plan.push(`Approach: ${strategy} · Constraints: ${constraints}`);
    plan.push('');
    plan.push('Recommended Strategy:');

    if (goal === 'revenue') {
      plan.push('- Accelerate conversion via CRO on key paths, add remarketing for quick lift.');
      plan.push('- Increase AOV with bundles/upsells; test price/packaging for elasticity.');
    } else if (goal === 'conversion') {
      plan.push('- Funnel diagnostics: identify top 3 friction points and fix in sprint.');
      plan.push('- Speed and clarity improvements on landing pages; experiment with social proof.');
    } else if (goal === 'leads') {
      plan.push('- Define ICP and lead scoring; launch 2–3 high-intent offers and routing.');
      plan.push('- Balance paid search with content offers to stabilize CAC.');
    } else if (goal === 'retention') {
      plan.push('- Lifecycle flows: onboarding, activation nudges, churn save, and win-back.');
      plan.push('- Product education content and loyalty/referral scaffolding.');
    }

    if (strategy === 'paid') plan.push('- Paid mix: search + paid social; weekly creative tests; CAC/LTV guardrails.');
    if (strategy === 'organic') plan.push('- Content/SEO: topic clusters, distribution calendar, and repurposing loops.');
    if (strategy === 'crm') plan.push('- CRM: triggered journeys, segment scoring, and offer personalization.');
    if (strategy === 'sales') plan.push('- Sales enablement: battlecards, case studies, and velocity reviews.');

    plan.push('');
    plan.push('Expected Outcomes:');
    if (timeline === 'short') plan.push('- 2–4 weeks: +5–12% lift from CRO/remarketing on priority paths.');
    if (timeline === 'medium') plan.push('- 1–3 months: +8–20% revenue impact combining acquisition + retention.');
    if (timeline === 'long') plan.push('- 3–12 months: Compounding growth via durable engines (SEO/CRM).');

    plan.push('');
    plan.push('Next Steps:');
    plan.push('- Align on KPIs and guardrails (CAC/LTV, payback, MAU/DAU, AOV).');
    plan.push('- Run a 2-week discovery and CRO sprint, then iterate.');
    plan.push('- Stand up reporting cadence and weekly experiment reviews.');

    if (rev) plan.push(`- Ground truth: current revenue baseline $${Math.round(rev).toLocaleString()}.`);

    setMessages(prev => ([...prev, { id: 'final', role: 'assistant', content: plan.join('\n') }]));
  };

  return (
    <>
      {/* Floating Trigger Button (responsive, offset left of main AI) */}
      {!suppressTrigger && (
        <div
          style={{
            position: 'fixed',
            bottom: 30,
            right: 110, // keep 110px from right edge (~60px main AI button + 30px gap + margin)
            zIndex: 1200,
          }}
        >
        <button
          aria-label="Open AI Dashboard Assistant"
          onClick={open ? () => setOpen(false) : startChat}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 24,
            background: open
              ? 'linear-gradient(135deg, #1e293b, #334155)'
              : 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            boxShadow: '0 12px 28px rgba(6, 182, 212, 0.35)',
            position: 'relative',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 36px rgba(6, 182, 212, 0.45)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 28px rgba(6, 182, 212, 0.35)';
          }}
        >
          {open ? '✕' : '🧭'}
          {/* Badge */}
          <span
            style={{
              position: 'absolute',
              top: -6,
              left: -6, // place badge on the outer-left to avoid overlapping the main chat button on the right
              minWidth: 10,
              height: 22,
              padding: '0 8px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b1220',
              background: badge.tone === 'alert' ? '#fde68a' : badge.tone === 'positive' ? '#a7f3d0' : '#e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {badge.text}
          </span>
        </button>
      </div>
      )}

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 110,
            right: 'calc(30px + 70px)',
            width: 420,
            maxHeight: '70vh',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#f8fafc',
            borderRadius: 16,
            boxShadow: '0 24px 60px rgba(2, 6, 23, 0.6)',
            overflow: 'hidden',
            zIndex: 1200,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #1f2937, #0f172a)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Interactive AI Dashboard Assistant</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Guided analysis and action planning</div>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  borderRadius: 8,
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '45vh', overflowY: 'auto' }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'rgba(255,255,255,0.06)',
                color: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 12,
                maxWidth: '85%'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            ))}
          </div>

          {/* Question or Final */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
            {!finalized && currentQuestion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{currentQuestion.prompt}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {currentQuestion.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(currentQuestion, opt)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, opacity: 0.55 }}>3–5 quick questions. You’re on step {stepIndex + 1} of {QUESTIONS.length}.</div>
              </div>
            )}
            {finalized && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => startChat()}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#0b1220',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  New Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InteractiveAIDashboardAssistant;