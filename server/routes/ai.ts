/**
 * AI Services API Routes
 * Handles all AI-related REST endpoints (suggestions, knowledge, habits, learning)
 */

import {
  getLearningEngine,
  getPredictiveSuggestions,
  getKnowledgeBase,
  getHabitTracking
} from "../server";

/**
 * Handle AI-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleAIRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {

  // ============================================================================
  // PREDICTIVE SUGGESTIONS
  // ============================================================================

  // POST /api/ai/suggestions/:sessionId - Generate suggestions
  if (url.pathname.match(/^\/api\/ai\/suggestions\/[^/]+$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const context = await req.json();

      const suggestions = getPredictiveSuggestions(sessionId);
      const result = await suggestions.generateSuggestions(context);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/ai/suggestions/:sessionId - Get all suggestions
  if (url.pathname.match(/^\/api\/ai\/suggestions\/[^/]+$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const suggestions = getPredictiveSuggestions(sessionId);
      const result = await suggestions.getAllSuggestions();

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get suggestions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/ai/suggestions/:sessionId/feedback - Submit suggestion feedback
  if (url.pathname.match(/^\/api\/ai\/suggestions\/[^/]+\/feedback$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const { suggestionId, helpful } = await req.json();

      const suggestions = getPredictiveSuggestions(sessionId);
      await suggestions.recordFeedback(suggestionId, helpful);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to record feedback'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================

  // POST /api/ai/knowledge/:sessionId/search - Search knowledge base
  if (url.pathname.match(/^\/api\/ai\/knowledge\/[^/]+\/search$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const query = await req.json();

      const kb = getKnowledgeBase(sessionId);
      const results = await kb.searchKnowledge(query);

      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to search knowledge'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/ai/knowledge/:sessionId/entry - Add knowledge entry
  if (url.pathname.match(/^\/api\/ai\/knowledge\/[^/]+\/entry$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const entry = await req.json();

      const kb = getKnowledgeBase(sessionId);
      const result = await kb.addEntry(entry);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to add entry'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/ai/knowledge/:sessionId/stats - Get knowledge stats
  if (url.pathname.match(/^\/api\/ai\/knowledge\/[^/]+\/stats$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const kb = getKnowledgeBase(sessionId);
      const stats = await kb.getStatistics();

      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get stats'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/ai/knowledge/:sessionId/entry/:entryId - Delete entry
  if (url.pathname.match(/^\/api\/ai\/knowledge\/[^/]+\/entry\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[4];
      const entryId = parts[6];

      const kb = getKnowledgeBase(sessionId);
      await kb.deleteEntry(entryId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete entry'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // HABIT TRACKING
  // ============================================================================

  // GET /api/ai/habits/:sessionId - Get all habits
  if (url.pathname.match(/^\/api\/ai\/habits\/[^/]+$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const habits = getHabitTracking(sessionId);
      const result = await habits.getAllHabits();

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get habits'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/ai/habits/:sessionId - Create new habit
  if (url.pathname.match(/^\/api\/ai\/habits\/[^/]+$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const habitData = await req.json();

      const habits = getHabitTracking(sessionId);
      const result = await habits.createHabit(habitData);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create habit'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/ai/habits/:sessionId/track - Track habit
  if (url.pathname.match(/^\/api\/ai\/habits\/[^/]+\/track$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const { habitId, value, notes } = await req.json();

      const habits = getHabitTracking(sessionId);
      await habits.trackHabit(habitId, value, notes);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to track habit'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/ai/habits/:sessionId/analytics - Get habit analytics
  if (url.pathname.match(/^\/api\/ai\/habits\/[^/]+\/analytics$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const habitId = url.searchParams.get('habitId');

      if (!habitId) {
        return new Response(JSON.stringify({ error: 'habitId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const habits = getHabitTracking(sessionId);
      const analytics = await habits.getAnalytics(habitId);

      return new Response(JSON.stringify(analytics), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/ai/habits/:sessionId/suggestions - Get habit suggestions
  if (url.pathname.match(/^\/api\/ai\/habits\/[^/]+\/suggestions$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const habits = getHabitTracking(sessionId);
      const suggestions = await habits.getSuggestions();

      return new Response(JSON.stringify(suggestions), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get suggestions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // LEARNING ENGINE
  // ============================================================================

  // GET /api/ai/learning/:sessionId/profile - Get learning profile
  if (url.pathname.match(/^\/api\/ai\/learning\/[^/]+\/profile$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const learning = getLearningEngine(sessionId);
      const profile = await learning.getProfile();

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get profile'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/ai/learning/:sessionId/update - Update learning from interaction
  if (url.pathname.match(/^\/api\/ai\/learning\/[^/]+\/update$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[4];
      const interaction = await req.json();

      const learning = getLearningEngine(sessionId);
      await learning.updateFromInteraction(interaction);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to update learning'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // No AI route matched
  return undefined;
}
