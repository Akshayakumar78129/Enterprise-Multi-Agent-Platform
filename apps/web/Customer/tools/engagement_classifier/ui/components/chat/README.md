# Customer Engagement Chatbot

A comprehensive AI-powered chatbot for the Customer Engagement Classifier dashboard.

## Features

### 🤖 AI-Powered Responses
- Integrates with Google Gemini AI for intelligent responses
- Context-aware answers based on current dashboard data
- Fallback responses when AI is unavailable

### 💬 Interactive Chat Interface
- Yellow floating chat button (as requested)
- Minimizable chat window
- Real-time typing indicators
- Message timestamps
- Smooth animations and transitions

### 🏷️ Agent Mentions
- Type `@` to see available agents
- **Sales Agent** - Sales performance and forecasting
- **Inventory Agent** - Stock levels and optimization  
- **Financial Agent** - Financial analysis and reporting
- Auto-complete with agent descriptions
- Visual icons for each agent type

### 📊 Dashboard Integration
- Answers questions about KPIs and metrics
- Explains engagement levels and distributions
- Provides actionable insights and recommendations
- Helps with dashboard navigation and filters

## Usage

### Basic Questions
- "What are my current KPIs?"
- "Explain the engagement levels"
- "How can I improve customer engagement?"
- "What do the filters do?"

### Agent Mentions
- Type `@` to see agent options
- Select an agent to mention them in your message
- Example: "Can you connect me with @Sales Agent for campaign strategies?"

### Dashboard Context
The chatbot automatically receives:
- Current KPI values
- Engagement distribution data
- Applied filters
- Selected engagement levels

## Setup

### Environment Variables
Add to `.env.local`:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

### API Key Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment variables

## Components

- **ChatBot.tsx** - Main chatbot component
- **ChatButton.tsx** - Floating yellow chat button
- **ChatMessage.tsx** - Individual message display
- **AgentMentions.tsx** - Agent mention dropdown
- **ChatBot.css** - Styling for all components

## API Integration

The chatbot uses `/api/chat/gemini` endpoint for AI responses with fallback handling for when the API is unavailable.

## Styling

- Yellow theme for chat button (as requested)
- Dark theme matching dashboard design
- Responsive design for mobile devices
- Smooth animations and hover effects