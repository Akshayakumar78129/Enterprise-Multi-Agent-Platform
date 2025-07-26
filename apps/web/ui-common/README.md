# Enterprise IQ UI Common Components

This directory contains all shared UI components for the Enterprise IQ system across all tools and domains.

## Directory Structure

- `/design-system/` - Core design system for Enterprise IQ
  - `/components/` - Base reusable UI components
  - `theme.js` - Global theme configuration
  - `tokens.js` - Design tokens for colors, spacing, typography
  - `ComponentDemo.jsx` - Demo showcase of all components

- `/ai-interaction/` - AI agent interaction components
  - `/RobotCharacter/` - Draggable robot character component
  - `/LaserPointer/` - Laser pointer component
  - `/SpeechBubble/` - Speech bubble component

- `/utils/` - Shared utilities across all domains
  - `/charts/` - Plotly.js integration and chart utilities
  - `/api/` - Gemini API integration

## Core Components

The ui-common library includes these base components:

- **Card** - Container component for content blocks
- **Button** - Action buttons with multiple variants
- **KpiTile** - Key performance indicator display tiles
- **Input** - Text input fields
- **Select** - Dropdown selection component
- **Table** - Data table component
- **Tabs** - Tabbed navigation component
- **Toggle** - Toggle switch for boolean inputs
- **Checkbox** - Checkbox component for multiple selection
- **Grid** - Responsive layout grid system

## AI Interaction Components

Enterprise IQ features interactive AI agent components:

- **RobotCharacter** - Draggable robot character that represents the AI assistant
- **LaserPointer** - Visual pointer that connects the robot to UI elements
- **SpeechBubble** - Display text from the AI assistant
- **QueryInput** - Natural language query input for the user

## Theme System

The design system uses a consistent color palette:

- Primary Background: Midnight Navy (#0a1224)
- Interactive Focus & Agent Highlights: Electric Cyan (#00e0ff)
- Alert & Anomaly Accents: Signal Magenta (#e930ff)
- Card Bodies & Chart Canvas: Graphite (#232a36 / #3a4459)
- Text & High-Contrast Surfaces: Cloud White (#f7f9fb)

## Getting Started

To use these components in a tool implementation:

```jsx
import { Card, Button, KpiTile, useTheme } from '../../../ui-common';

const MyToolComponent = () => {
  const theme = useTheme();
  
  return (
    <Card title="My Tool">
      <KpiTile value={1254} label="Total Items" />
      <Button variant="primary">Action</Button>
    </Card>
  );
};
```

## Component Demo

To see all components in action:

```jsx
import ComponentDemo from '../../../ui-common';

const DemoPage = () => <ComponentDemo />;
```

---

For more detailed documentation on each component, please refer to the component's PropTypes and JSDoc comments. 