# Web Application - Enterprise IQ Data Analytics Platform

## Overview

This is the main web application for the Enterprise IQ Data Analytics Platform, featuring an AI-driven canvas interface where users interact with an AI assistant that dynamically spawns and controls visualization components. Built with Next.js, React, Redux, and TypeScript, the platform provides sophisticated business intelligence across four major domains.

## Key Features

### 🎨 AI-Driven Canvas Interface
- Dynamic component spawning based on AI responses
- Interactive visualization positioning system
- 60+ pre-built visualization components
- Real-time component management (resize, minimize, remove)

### 🤖 AI Integration
- RobotCharacter visual assistant
- LaserPointer for guided attention
- Natural language query processing
- Server-Sent Events (SSE) for real-time AI responses

### 📊 Business Domains
1. **Customer Analytics** (12 tools)
2. **Sales Performance** (5 tools + utilities)
3. **Inventory Management** (5 tools)
4. **Financial Analysis** (1 tool)

## Directory Structure

```
web/
├── Customer/                 # Customer domain tools
│   ├── database/            # SQLite database and utilities
│   └── tools/               # 12 analytical tools
├── Sales/                   # Sales domain tools
│   ├── database/            # Sales database
│   └── tools/               # 5 analytical tools
├── Inventory/               # Inventory domain tools
│   └── tools/               # 5 management tools
├── Finance/                 # Financial domain tools
│   └── tools/               # Financial analysis tool
├── api-gateway/             # Enterprise integration layer
├── ui-common/               # Shared UI components
│   ├── ai-interaction/      # AI UI components
│   ├── design-system/       # Design system components
│   └── utils/               # Shared utilities
├── pages/                   # Next.js pages and API routes
│   ├── index.js            # Main canvas application
│   ├── api/                # API endpoints
│   ├── customers/          # Customer tool pages
│   ├── sales/              # Sales tool pages
│   └── inventory/          # Inventory tool pages
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

## Tool Structure Pattern

Each tool follows a consistent structure:
```
tools/{tool_name}/
├── {tool_name}.py              # Python backend logic
├── Spec_UI_{tool_name}.md      # UI/UX specification
├── tests/                      # Python tests
│   └── test_{tool_name}.py
├── ui/                         # Frontend implementation
│   ├── api/                    # API integration
│   ├── components/             # React components
│   │   ├── kpi/               # KPI tiles
│   │   └── visualizations/    # Charts
│   ├── types/                  # TypeScript types
│   └── views/                  # Main dashboard views
├── api/                        # Additional API files
└── database/                   # Database queries
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or pnpm

### Installation

1. Install Node dependencies:
```bash
npm install
# or
pnpm install
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_AI_URL=http://127.0.0.1:5000
```

4. Initialize databases:
```bash
python setup_db.py
```

### Running the Application

Development mode:
```bash
npm run dev
# Application runs on http://localhost:3000
```

Production build:
```bash
npm run build
npm start
```

## Component Registry

The main canvas (`pages/index.js`) maintains a component registry for dynamic spawning:

```javascript
const componentRegistry = {
  'tool-name': {
    componentName: dynamic(() => import('path/to/component')),
    // ... more components
  }
}
```

## API Routes

### Tool Data Endpoints
- `/api/{tool-name}/data` - POST endpoint for each tool
- Request: `{ filters: { startDate, endDate, ... } }`
- Response: Tool-specific data and visualizations

### Example API Implementation
```javascript
// pages/api/{tool-name}/data.js
export default async function handler(req, res) {
  const { filters } = req.body;
  // Call Python tool
  // Return processed data
  res.json(result);
}
```

## AI Canvas Workflow

1. **User Query** → QueryInput component
2. **Backend Processing** → SSE response from AI
3. **Response Parsing** → Extract component specifications
4. **Component Spawning** → Dynamic component creation
5. **Data Fetching** → Tool-specific API calls
6. **Visualization** → Rendered on canvas

## State Management

Redux Toolkit slices for complex tools:
- `purchaseFrequencySlice`
- `customerSegmentationSlice`
- `customerBehaviourSlice`
- `churnPredictionSlice`

## Design System

### Color Tokens
- Electric Cyan: `#00e0ff`
- Signal Magenta: `#e930ff`
- Midnight Navy: `#0a1224`
- Cloud White: `#f7f9fb`

### Component Standards
- KPI Tiles: 280x120px
- Consistent filter patterns
- Plotly-based interactive charts

## Development Guidelines

### Adding New Components
1. Create component in appropriate tool's `ui/components/` directory
2. Register in `componentRegistry` in `pages/index.js`
3. Add data fetching logic in `spawnComponent` function
4. Create API endpoint if needed

### Code Style
- TypeScript for type safety
- React functional components with hooks
- CSS modules or styled-components
- Follow existing patterns in codebase

## Testing

Run tests:
```bash
# JavaScript/TypeScript tests
npm test

# Python tool tests
pytest
```

## Build and Deployment

```bash
# Build for production
npm run build

# Analyze bundle size
npm run analyze

# Type checking
npm run type-check
```

## Migration Notes

- Ongoing migration from JavaScript to TypeScript
- See `ENTERPRISE_DATA_CONNECTOR_MIGRATION_PLAN.md` for details
- Some tools use `.js`, others `.tsx` - standardization in progress

## Performance Optimization

- Dynamic imports for code splitting
- Component lazy loading
- Memoization for expensive computations
- Virtual scrolling for large datasets

## Related Documentation

- [Main AI Documentation](../../AI_DOCS.md)
- [Tool Implementation Process](./TOOL_IMPLEMENTATION_PROCESS.md)
- [API Gateway Documentation](./api-gateway/README.md)
- [UI Common Components](./ui-common/README.md)
- [ADK Integration](../adk/README.md)