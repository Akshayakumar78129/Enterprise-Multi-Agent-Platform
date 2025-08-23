export function emitInsight(payload) {
  // Consumers (FloatingAIChat) listen to this event and send to the right @agent
  window.dispatchEvent(new CustomEvent('ai:insight-request', { detail: payload }));
}

// helper builders for common intents
export const insightBuilders = {
  timepoint({ kpi, date, actual, predicted, deviation, functionGroup }) {
    return {
      tool: 'performance_deviation',
      intent: 'explain_timepoint',
      kpi, date, actual, predicted, deviation, functionGroup
    };
  },
  factor({ kpi, feature, importance }) {
    return {
      tool: 'performance_deviation',
      intent: 'explain_factor',
      kpi, feature, importance
    };
  },
  variance({ kpi, explanationPower, explained, unexplained }) {
    return {
      tool: 'performance_deviation',
      intent: 'explain_variance',
      kpi, explanationPower, explained, unexplained
    };
  },
  pattern({ date, magnitude, kind }) {
    return {
      tool: 'performance_deviation',
      intent: 'explain_pattern',
      date, magnitude, kind
    };
  }
};
