# Integration Instructions for Engagement Classifier Chatbot

## 🚀 Zero-Touch Auto-Start Setup (Perfect for Dashboard Merging!)

The chatbot will **automatically start** when you run `npm run dev` in the main multiagent-agency folder. **Zero files outside engagement_classifier folder needed!**

### One-Time Setup (Run Once):

```bash
cd Customer/tools/engagement_classifier
node setup-auto-start.js
```

That's it! This modifies your main package.json to auto-start the chatbot.

### Alternative: Manual Setup

If the auto-setup doesn't work, manually add this to your main package.json:

```json
{
  "scripts": {
    "dev": "node Customer/tools/engagement_classifier/auto-init.js && next dev"
  }
}
```

## ✅ What Happens Automatically

When you run `npm run dev` in the main multiagent-agency folder:

1. **Auto-Init**: Chatbot initializes first
2. **Server Start**: Standalone server starts on port 3001
3. **Next.js Start**: Your main Next.js app starts on port 3000
4. **Frontend Ready**: Dashboard automatically connects to chatbot

## 🎯 Result

- ✅ **Single Command**: Just `npm run dev` 
- ✅ **Zero External Files**: Everything stays in `engagement_classifier` folder
- ✅ **Perfect for Merging**: No conflicts with other dashboards
- ✅ **Auto-Connect**: Frontend automatically finds the chatbot server

## 🧪 Test It

```bash
# In main multiagent-agency folder
npm run dev
```

You'll see:
```
🚀 [Auto-Init] Starting Engagement Classifier Chatbot initialization...
🚀 [Auto-Init] Starting standalone chatbot server...
🌐 Embedded Chatbot Server running on http://localhost:3001
✅ [Auto-Init] Chatbot server started on port 3001
🎯 [Auto-Init] Frontend will connect automatically
```

Then your Next.js app starts normally and the chatbot is ready! 🎉

## ✅ Success Indicators

When working correctly, you should see:
- ✅ Database connection successful
- ✅ Embeddings loaded (59 embeddings)
- ✅ Server running on port 3001
- ✅ Next.js starts on port 3000
- ✅ No "startChatbotServer is not a function" errors

## Option 2: Express Server Integration

If you prefer to keep the separate server approach, you can use:

```bash
cd Customer/tools/engagement_classifier
node start-chatbot.js
```

## How It Works

1. **Frontend**: The engagement dashboard calls `/api/engagement-chatbot`
2. **API Route**: Next.js routes the request to the handler in the engagement classifier folder
3. **Handler**: Processes the request using the chatbot logic
4. **Fallback**: If the chatbot fails to load, it provides intelligent fallback responses

## Features

✅ **No separate server needed**
✅ **Intelligent fallback responses**
✅ **Supports @sales and @inventory agents**
✅ **Health check endpoint (GET request)**
✅ **Error handling and logging**

## Testing

### Health Check
```bash
GET http://localhost:3000/api/engagement-chatbot
```

### Chat Request
```bash
POST http://localhost:3000/api/engagement-chatbot
Content-Type: application/json

{
  "message": "@sales who are our top 5 customers?",
  "mode": "detailed"
}
```

## Supported Queries

### Sales Agent (@sales)
- `@sales who are our top 5 customers?`
- `@sales show me top 10 customers`
- `@sales how many customers do we have?`
- `@sales give me sales overview`

### Inventory Agent (@inventory)
- `@inventory what are our stockouts?`
- `@inventory show me top SKUs`
- `@inventory give me inventory overview`

## Environment Variables Required

Make sure these are set in your `.env.local`:

```
GEMINI_API_KEY=your_api_key_here
DATABASE_PATH=path_to_customers_db
```

## Deployment Ready

This solution is deployment-ready because:
- No separate processes to manage
- Integrated with your Next.js app
- Automatic fallbacks if services fail
- Proper error handling
- CORS headers configured