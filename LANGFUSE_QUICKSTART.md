# Langfuse Integration - Quick Start

## ✅ What's Been Implemented

The Langfuse observability integration is **fully implemented** and ready to use! Here's what was added:

### 📦 Dependencies
- ✅ TypeScript: `langfuse` npm package installed
- ✅ Python: `langfuse>=2.0.0` added to requirements.txt

### 🔧 Core Implementation
- ✅ **TypeScript Observability Module** (`server/observability/langfuse.ts`)
  - Lazy initialization (works without credentials)
  - Helper functions: `createTrace()`, `createGeneration()`, `logEvent()`
  - Graceful shutdown handling

- ✅ **Main Chat Handler Instrumentation** (`server/websocket/messageHandlers.ts`)
  - Automatic trace creation for every chat session
  - Captures input, output, and token usage
  - No performance impact (async operations)

- ✅ **Python Worker Support** (`python-worker/`)
  - Langfuse client initialization in `worker.py`
  - Helper utilities in `observability.py`
  - Ready for manual instrumentation in tasks

### 📚 Documentation
- ✅ Comprehensive guide: [`docs/LANGFUSE_INTEGRATION.md`](docs/LANGFUSE_INTEGRATION.md)
- ✅ README updated with setup instructions
- ✅ Environment template in `.env`

---

## 🚀 Next Steps (Your Action Required)

To start seeing traces in Langfuse:

### 1. Sign Up for Langfuse Cloud (2 minutes)

**Option A: EU Region (Recommended for Europe/Africa/Middle East)**
- Visit: [https://cloud.langfuse.com](https://cloud.langfuse.com)

**Option B: US Region (Recommended for Americas/Asia)**
- Visit: [https://us.cloud.langfuse.com](https://us.cloud.langfuse.com)

1. Create a free account
2. Create a new project (e.g., "Agent Ironman")
3. Go to **Settings** → **API Keys**
4. Copy your credentials

### 2. Configure Environment Variables (1 minute)

Open `.env` and uncomment/update lines 60-65:

```bash
# =============================================================================
# Langfuse Configuration (LLM Observability & Cost Tracking)
# =============================================================================
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # or https://us.cloud.langfuse.com
```

**Replace with your actual credentials!**

### 3. Restart Agent Ironman (30 seconds)

```bash
# Stop the current server (Ctrl+C)

# Restart
bun run dev
```

**Look for this message in the console:**
```
✅ Langfuse observability initialized
```

### 4. Send a Test Message (10 seconds)

1. Open Agent Ironman in your browser
2. Send any message to Claude
3. Wait for the response

### 5. View Your First Trace! (1 minute)

1. Go to Langfuse dashboard: [https://cloud.langfuse.com](https://cloud.langfuse.com)
2. Click **Traces** in the sidebar
3. You should see your chat session!

Click on the trace to view:
- 📝 **Input**: Your message + system prompt
- 💬 **Output**: Claude's response
- 🔢 **Token Usage**: Input and output tokens
- 💰 **Estimated Cost**: Based on model pricing
- ⏱️ **Latency**: Response time

---

## 🎯 What You'll Get

### Cost Tracking
- See exactly how much each conversation costs
- Monitor monthly spending
- Set budget alerts

### Performance Monitoring
- Track average latency per model
- Identify slow requests
- Optimize system prompts

### Debugging
- Inspect full input/output for every LLM call
- See token usage breakdown
- Filter by session, model, or date

### Analytics Dashboard
- View aggregate metrics
- Cost over time graphs
- Token usage trends
- Request volume statistics

---

## 🐛 Troubleshooting

### Not seeing traces?

1. **Check credentials in `.env`:**
   ```bash
   cat .env | grep LANGFUSE
   ```
   Make sure they're uncommented and correct!

2. **Verify initialization:**
   Look for this in the console when starting:
   ```
   ✅ Langfuse observability initialized
   ```

3. **Check region:**
   Make sure `LANGFUSE_BASE_URL` matches where you signed up:
   - EU: `https://cloud.langfuse.com`
   - US: `https://us.cloud.langfuse.com`

4. **Restart the app:**
   Environment changes require a restart

### Still not working?

See the full troubleshooting guide in [`docs/LANGFUSE_INTEGRATION.md`](docs/LANGFUSE_INTEGRATION.md)

---

## 📖 Learn More

**Full Documentation:**
- [`docs/LANGFUSE_INTEGRATION.md`](docs/LANGFUSE_INTEGRATION.md) - Complete integration guide
- [Langfuse Official Docs](https://langfuse.com/docs) - Platform documentation

**Advanced Usage:**
- Python worker instrumentation
- Custom metadata
- Self-hosted deployment
- Cost optimization strategies

---

## 💡 Quick Tips

1. **Privacy**: Langfuse only sees what you send to Claude - credentials, API keys, and secrets are never logged
2. **Performance**: Langfuse uses async operations, so there's zero impact on response latency
3. **Cost**: The Langfuse free tier includes 50k trace events/month - plenty for personal use!
4. **Optional**: The integration gracefully disables if credentials aren't configured

---

**Ready to see your LLM costs and performance?**

Sign up now: [cloud.langfuse.com](https://cloud.langfuse.com) ⚡
