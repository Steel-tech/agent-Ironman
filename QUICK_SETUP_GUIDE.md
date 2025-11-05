# Quick Setup Guide - AI Intelligence Hub Integration

Vic, all the AI code is already in your codebase! Here's exactly what needs to be done to activate it.

## ✅ What's Already Done

All AI systems are fully implemented and ready to use:

✅ server/ai/personalLearning.ts        (Personal Learning Engine)
✅ server/ai/predictiveSuggestions.ts   (Predictive Suggestions)
✅ server/ai/personalKnowledgeBase.ts   (Knowledge Base)
✅ server/ai/habitTracking.ts           (Habit Tracking)

✅ client/components/ai/PredictiveSuggestions.tsx
✅ client/components/ai/PersonalKnowledgeBase.tsx
✅ client/components/ai/HabitTracking.tsx
✅ client/components/ai/AIIntelligenceHub.tsx

✅ docs/AI_INTEGRATION_GUIDE.md         (Complete documentation)

## 🔧 5-Step Integration

### Step 1: Update server/server.ts (10 min)

Add AI imports after line 57:

```typescript
import {
  personalLearning,
  predictiveSuggestions,
  personalKnowledgeBase,
  habitTracking
} from './ai';
```

Add AI session storage after line 87:

```typescript
// Store AI services per session
const sessionAIServices = new Map<string, {
  learning: typeof personalLearning;
  suggestions: typeof predictiveSuggestions;
  knowledge: typeof personalKnowledgeBase;
  habits: typeof habitTracking;
}>();
```

Add getter function after line 125:

```typescript
/**
 * Get or create AI services for a session
 */
export function getAIServices(sessionId: string) {
  let services = sessionAIServices.get(sessionId);
  if (!services) {
    services = {
      learning: personalLearning,
      suggestions: predictiveSuggestions,
      knowledge: personalKnowledgeBase,
      habits: habitTracking
    };
    sessionAIServices.set(sessionId, services);
  }
  return services;
}
```

Update cleanupSession function (around line 130):

```typescript
export function cleanupSession(sessionId: string): void {
  sessionMemoryServices.delete(sessionId);
  sessionPythonManagers.delete(sessionId);
  sessionWorkflowEngines.delete(sessionId);
  sessionAIServices.delete(sessionId);  // Add this line
}
```

### Step 2: Create API Routes (15 min)

Create new file: `server/routes/ai.ts`

```typescript
import { getAIServices } from '../server';

export async function handleAIRoutes(req: Request, url: URL) {
  // Extract session ID from URL
  const sessionId = url.searchParams.get('sessionId') || 'default';

  try {
    const aiServices = getAIServices(sessionId);

    // GET /api/ai/suggestions
    if (req.method === 'POST' && url.pathname === '/api/ai/suggestions') {
      const context = await req.json();
      const suggestions = await aiServices.suggestions.generateSuggestions(context);
      return new Response(JSON.stringify(suggestions), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/ai/knowledge-base/search
    if (req.method === 'POST' && url.pathname === '/api/ai/knowledge-base/search') {
      const query = await req.json();
      const results = await aiServices.knowledge.searchKnowledge(query);
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/ai/habits/track
    if (req.method === 'POST' && url.pathname === '/api/ai/habits/track') {
      const { habitId, value, notes, context } = await req.json();
      const tracked = await aiServices.habits.trackHabit(habitId, value, notes, context);
      return new Response(JSON.stringify({ success: tracked }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/ai/analytics
    if (req.method === 'GET' && url.pathname === '/api/ai/analytics') {
      const analytics = await aiServices.habits.getHabitAnalytics();
      return new Response(JSON.stringify(analytics), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('AI route error:', error);
    return new Response(JSON.stringify({ error: 'AI operation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null;
}
```

Then add to server/server.ts in the fetch handler (around line 213, after commands):

```typescript
// Try AI routes
const aiResponse = await handleAIRoutes(req, url);
if (aiResponse) {
  return aiResponse;
}
```

Also add import at top:

```typescript
import { handleAIRoutes } from './routes/ai';
```

### Step 3: Integrate UI Component (10 min)

Update `client/components/chat/ChatContainer.tsx`:

Add import near the top:

```typescript
import { AIIntelligenceHub } from '../ai/AIIntelligenceHub';
```

Add state (around line 100):

```typescript
const [showAIHub, setShowAIHub] = useState(false);
```

Add button to header (in render, around line 300):

```typescript
<Button
  onClick={() => setShowAIHub(!showAIHub)}
  variant={showAIHub ? 'default' : 'outline'}
  size="sm"
  title="AI Intelligence Hub"
>
  <Brain className="h-4 w-4" />
</Button>
```

Add AI Hub panel (in render, around line 400):

```typescript
{showAIHub && (
  <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l shadow-lg overflow-y-auto">
    <AIIntelligenceHub
      sessionData={{ sessionId: currentSessionId, mode: currentSessionMode }}
      projectContext={{}}
      onExecuteAction={(action) => {
        console.log('Execute action:', action);
        // Handle AI action execution here
      }}
    />
  </div>
)}
```

Import Brain icon at top:

```typescript
import { Brain } from 'lucide-react';
```

### Step 4: Add WebSocket Handlers (Optional but Recommended - 10 min)

The components will work with HTTP requests, but for real-time updates, update `server/websocket/messageHandlers.ts`:

```typescript
// Add AI message handler
if (message.type === 'ai_suggestion_request') {
  const aiServices = getAIServices(sessionId);
  const suggestions = await aiServices.suggestions.generateSuggestions(message.context);
  ws.send(JSON.stringify({
    type: 'ai_suggestions',
    suggestions
  }));
}
```

### Step 5: Test Everything (15 min)

1. Start your server: `npm run dev` or `bun run dev`
2. Open http://localhost:3003
3. Click the AI button in the header
4. Try the different tabs:
   - Suggestions
   - Knowledge Base
   - Habits
   - Analytics

---

## 🎯 Minimal Integration (5 Minutes)

If you just want to get it running quickly:

1. Skip Step 1 (server.ts update) and Step 2 (API routes)
2. Just do Step 3 (Add UI to ChatContainer)
3. The components will use mock data and still show all the features

This lets you see the full UI immediately without backend integration.

---

## 🚀 Full Integration (1 Hour)

For complete backend integration:

1. Do Step 1 (server.ts) - 10 min
2. Do Step 2 (API routes) - 15 min
3. Do Step 3 (UI integration) - 10 min
4. Do Step 4 (WebSocket) - 10 min
5. Do Step 5 (Testing) - 15 min

---

## 📂 File Locations

Everything is already in your codebase at these paths:

**Backend:**
```
/Users/vics/Documents/agent-ironman/server/ai/
├── personalLearning.ts
├── predictiveSuggestions.ts
├── personalKnowledgeBase.ts
├── habitTracking.ts
└── index.ts
```

**Frontend:**
```
/Users/vics/Documents/agent-ironman/client/components/ai/
├── PredictiveSuggestions.tsx
├── PersonalKnowledgeBase.tsx
├── HabitTracking.tsx
├── AIIntelligenceHub.tsx
└── index.ts
```

**Documentation:**
```
/Users/vics/Documents/agent-ironman/
├── docs/AI_INTEGRATION_GUIDE.md
├── IMPLEMENTATION_STATUS.md
└── QUICK_SETUP_GUIDE.md (this file)
```

---

## ✨ What You'll Get

After integration:

1. **AI Suggestions Panel** - Smart recommendations based on your patterns
2. **Personal Knowledge Base** - Auto-learns from your conversations
3. **Habit Tracking Dashboard** - Track development habits with analytics
4. **AI Analytics** - Performance metrics for all AI systems

---

## 🔗 Import Examples

```typescript
// Backend
import {
  personalLearning,
  predictiveSuggestions,
  personalKnowledgeBase,
  habitTracking
} from '@/server/ai';

// Frontend
import {
  PredictiveSuggestions,
  PersonalKnowledgeBase,
  HabitTracking,
  AIIntelligenceHub
} from '@/client/components/ai';
```

---

## 💬 Questions?

Check these files for detailed information:

- `docs/AI_INTEGRATION_GUIDE.md` - Complete integration guide
- `IMPLEMENTATION_STATUS.md` - Detailed status and architecture
- Individual system files have comprehensive comments

---

## ⏱️ Time Estimates

| Task | Time | Difficulty |
|------|------|-----------|
| Step 1: server.ts | 10 min | Easy |
| Step 2: API routes | 15 min | Easy |
| Step 3: UI integration | 10 min | Very Easy |
| Step 4: WebSocket | 10 min | Medium |
| Step 5: Testing | 15 min | Easy |
| **Total** | **~60 min** | **Easy** |

---

## 🎉 Summary

✅ **All AI code is in your codebase**
✅ **Ready to integrate**
✅ **Clear step-by-step guide**
✅ **Mock data available for testing**
✅ **Full documentation included**

Just follow the 5 steps above and Agent Ironman will have a complete AI Intelligence Hub! 🚀