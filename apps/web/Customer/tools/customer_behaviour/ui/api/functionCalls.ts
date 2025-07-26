import { FunctionDeclaration } from 'ui-common/utils/api/types';

export const customerBehaviourFunctions: FunctionDeclaration[] = [
  {
    name: 'highlightCustomer',
    description: 'Highlight a specific customer on all behaviour visualizations',
    parameters: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'Customer identifier' },
        explanation: { type: 'string', description: 'Reason for highlighting' }
      },
      required: ['customer_id']
    }
  },
  {
    name: 'filterByCategory',
    description: 'Filter behaviour visualizations by product category',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Product category' }
      },
      required: ['category']
    }
  },
  {
    name: 'filterByChannel',
    description: 'Filter behaviour visualizations by sales channel',
    parameters: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Sales channel' }
      },
      required: ['channel']
    }
  },
  {
    name: 'compareChurnRisk',
    description: 'Compare behaviour metrics across churn risk levels',
    parameters: {
      type: 'object',
      properties: {
        churnRisks: { type: 'array', items: { type: 'string' }, description: 'List of churn risk levels' },
        label: { type: 'string', description: 'Label for the comparison' }
      },
      required: ['churnRisks']
    }
  },
  {
    name: 'explainPattern',
    description: 'Generate an explanation for a behaviour pattern or metric',
    parameters: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'Metric or pattern to explain' },
        customer_id: { type: 'string', description: 'Specific customer to explain', nullable: true }
      },
      required: ['metric']
    }
  },
  {
    name: 'resetBehaviourView',
    description: 'Reset all filters and highlights on the behaviour dashboard',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
]; 