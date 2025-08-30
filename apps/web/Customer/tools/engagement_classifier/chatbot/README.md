# Intelligent Customer Engagement Chatbot

A complete Node.js chatbot system that uses **Retrieval-Augmented Generation (RAG)** and **database queries** to intelligently answer questions about customer engagement dashboards and data.

## 🚀 Features

- **Dual Intelligence**: Handles both UI/dashboard questions (RAG) and data queries (SQL + AI)
- **Intent Detection**: Automatically determines whether to query the database or search documentation
- **RAG System**: Uses Gemini embeddings and cosine similarity for semantic search
- **Database Integration**: Queries SQLite customer database with natural language
- **Interactive CLI**: Command-line interface for testing and interaction
- **Conversation History**: Maintains context across interactions
- **Comprehensive Documentation**: Includes detailed dashboard explanations

## 📁 Project Structure

```
chatbot/
├── package.json                 # Dependencies and scripts
├── .env                        # Environment variables (API keys)
├── README.md                   # This file
├── index.js                    # Main entry point with CLI
├── chatbot.js                  # Main orchestrator (intent detection, response generation)
├── embedder.js                 # Generate and store embeddings from text
├── retriever.js                # Search embeddings using cosine similarity
├── db.js                       # Handle SQL queries to customer database
├── dashboard_explanations.txt  # Knowledge base for RAG system
├── test-embeddings.js          # Test script for embeddings
└── embeddings_index.json       # Generated embeddings (created automatically)
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd chatbot
npm install
```

### 2. Configure Environment

Edit the `.env` file and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
DATABASE_PATH=../database/customers.db
```

**Get your Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it into the `.env` file

### 3. Verify Database

Make sure the customer database exists at:
```
../database/customers.db
```

The system expects a `customers` table with columns like:
- `customer_id`
- `customer_name` 
- `engagement_score`
- `engagement_level`
- `last_activity_date`
- `total_transactions`
- `total_spent`

### 4. Run the System

```bash
# Start the interactive chatbot
npm start

# Or run with Node directly
node index.js

# Test embeddings system
npm test

# Development mode (auto-restart)
npm run dev
```

## 🤖 How It Works

### Intent Detection
The system automatically detects whether your question requires:

**📊 Data Query** (queries database):
- "How many customers do we have?"
- "How many high engagement customers are there?"
- "What's the average engagement score?"
- "Show me the top 10 customers"
- "Which customers are at risk?"

**🎨 UI Explanation** (searches documentation):
- "What are KPI tiles?"
- "How is engagement score calculated?"
- "What is the engagement pyramid?"
- "How do I use dashboard filters?"
- "Explain the customer table"

### RAG System Flow
1. **Text Chunking**: Dashboard documentation is split into semantic chunks
2. **Embedding Generation**: Each chunk is converted to vectors using Gemini
3. **Query Processing**: User questions are embedded and compared using cosine similarity
4. **Context Retrieval**: Most relevant chunks are retrieved as context
5. **AI Response**: Gemini generates responses using retrieved context

### Database Query Flow
1. **Intent Detection**: System identifies data-related questions
2. **SQL Generation**: Natural language is converted to SQL queries
3. **Query Execution**: Safe SQL queries are executed on the database
4. **Result Formatting**: Raw data is formatted for AI consumption
5. **AI Explanation**: Gemini provides business insights and explanations

## 💡 Usage Examples

### Starting the Chatbot
```bash
npm start
```

### Sample Interactions

**Data Queries:**
```
💬 Ask me anything: How many customers do we have?
🤖 Based on your customer database, you currently have 1,247 customers total...

💬 Ask me anything: Show me the top 5 customers by engagement
🤖 Here are your top 5 customers by engagement score:
1. John Smith - Score: 9.8 (High Engagement)
2. Sarah Johnson - Score: 9.6 (High Engagement)...
```

**UI Questions:**
```
💬 Ask me anything: What are KPI tiles?
🤖 KPI tiles are the key performance indicator cards displayed at the top of your dashboard...

💬 Ask me anything: How is engagement score calculated?
🤖 Engagement scores are calculated using RFM analysis (Recency, Frequency, Monetary)...
```

### Available Commands
- `help` - Show help message
- `stats` - Display system statistics
- `test` - Run automated tests
- `history` - Show conversation history
- `clear` - Clear conversation history
- `quit` or `exit` - End session

## 🧪 Testing

### Test Embeddings System
```bash
npm test
# or
node test-embeddings.js
```

### Test Full Chatbot
```bash
npm start
# Then type: test
```

## 🔧 Configuration

### Environment Variables
```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (with defaults)
DATABASE_PATH=../database/customers.db
EMBEDDING_MODEL=models/embedding-001
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

### Customization Options

**Modify Knowledge Base:**
Edit `dashboard_explanations.txt` to update the documentation that the RAG system uses.

**Adjust Chunking:**
Modify `CHUNK_SIZE` and `CHUNK_OVERLAP` in `.env` or directly in `embedder.js`.

**Add SQL Patterns:**
Extend the `generateSQLQuery()` method in `chatbot.js` to handle more query types.

**Tune Similarity Threshold:**
Adjust `minSimilarity` parameter in retriever methods for more/less strict matching.

## 📊 System Architecture

```
User Question
     ↓
Intent Detection
     ↓
┌─────────────────┬─────────────────┐
│   Data Query    │  UI Question    │
│                 │                 │
│ SQL Generation  │ RAG Retrieval   │
│       ↓         │       ↓         │
│ Database Query  │ Similarity      │
│       ↓         │ Search          │
│ Result Format   │       ↓         │
│       ↓         │ Context Format  │
└─────────────────┴─────────────────┘
           ↓
    Gemini AI Processing
           ↓
    Intelligent Response
```

## 🚨 Troubleshooting

### Common Issues

**"GEMINI_API_KEY not found"**
- Make sure you've added your API key to the `.env` file
- Verify the key is correct and active

**"Database not found"**
- Check that the database path is correct in `.env`
- Ensure the database file exists and is readable

**"No embeddings found"**
- The system will automatically create embeddings on first run
- If it fails, check your internet connection and API key

**"Low similarity results"**
- Try rephrasing your question
- The system will automatically try expanded queries
- Add more relevant content to `dashboard_explanations.txt`

### Performance Tips

- Embeddings are cached in `embeddings_index.json` for fast retrieval
- Database connections are reused within sessions
- Conversation history is kept in memory (clears on restart)

## 🔒 Security

- Only SELECT queries are allowed on the database
- SQL injection protection through parameterized queries
- API keys are stored in environment variables
- No sensitive data is logged

## 🚀 Deployment

For production deployment:

1. Use a process manager like PM2
2. Set up proper logging
3. Configure database connection pooling
4. Implement rate limiting for API calls
5. Set up monitoring and health checks

## 📈 Future Enhancements

- Web interface integration
- Multi-language support
- Advanced analytics and reporting
- Integration with more data sources
- Voice interface support
- Custom training on company-specific data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Enterprise IQ platform. See the main project license for details.

---

**Need Help?** 
- Check the troubleshooting section above
- Run `npm start` and type `help` for interactive assistance
- Review the test outputs with `npm test`