/**
 * AI Intelligence Hub - API Routes
 * Handles all AI-related API endpoints
 */

import { getAIServices } from '../server';

export async function handleAIRoutes(req: Request, url: URL) {
  // Extract session ID from URL
  const sessionId = url.searchParams.get('sessionId') || 'default';

  try {
    const aiServices = getAIServices(sessionId);

    // POST /api/ai/suggestions
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

    // POST /api/ai/knowledge-base/add
    if (req.method === 'POST' && url.pathname === '/api/ai/knowledge-base/add') {
      const entryData = await req.json();
      const id = await aiServices.knowledge.addKnowledgeEntry(entryData);
      return new Response(JSON.stringify({ id, success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/ai/knowledge-base/stats
    if (req.method === 'GET' && url.pathname === '/api/ai/knowledge-base/stats') {
      const stats = await aiServices.knowledge.getKnowledgeStats();
      return new Response(JSON.stringify(stats), {
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

    // GET /api/ai/habits/analytics
    if (req.method === 'GET' && url.pathname === '/api/ai/habits/analytics') {
      const analytics = await aiServices.habits.getHabitAnalytics();
      return new Response(JSON.stringify(analytics), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/ai/habits/all
    if (req.method === 'GET' && url.pathname === '/api/ai/habits/all') {
      const habits = await aiServices.habits.getAllHabits();
      return new Response(JSON.stringify(habits), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/ai/habits/create
    if (req.method === 'POST' && url.pathname === '/api/ai/habits/create') {
      const habitData = await req.json();
      const id = await aiServices.habits.createHabit(habitData);
      return new Response(JSON.stringify({ id, success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/ai/profile
    if (req.method === 'GET' && url.pathname === '/api/ai/profile') {
      const profile = await aiServices.learning.getProfile();
      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('AI route error:', error);
    return new Response(JSON.stringify({ error: 'AI operation failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null;
}