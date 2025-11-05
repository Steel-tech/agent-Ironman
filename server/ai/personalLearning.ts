/**
 * Agent Ironman - Personal Learning System
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Personal Learning System - AI-powered analysis and adaptation
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { getSystemPrompt } from '../systemPrompt';
import { projectMemory } from '../memory/projectMemoryService';

export interface LearningPattern {
  id: string;
  type: 'naming' | 'architecture' | 'framework' | 'tool' | 'workflow' | 'communication';
  pattern: string;
  confidence: number; // 0-1
  frequency: number;
  contexts: string[];
  lastUsed: number;
  examples: Array<{
    input: string;
    output: string;
    timestamp: number;
    success: boolean;
  }>;
  impact: {
    productivity: number;
    quality: number;
    efficiency: number;
  };
}

export interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'trend';
  category: 'coding' | 'workflow' | 'communication' | 'learning';
  title: string;
  description: string;
  confidence: number;
  evidence: Array<{
    example: string;
    timestamp: number;
    weight: number;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
  }>;
}

export interface PersonalizationProfile {
  id: string;
  userId: string;
  preferences: {
    communicationStyle: 'concise' | 'detailed' | 'casual' | 'formal';
    codeStyle: 'strict' | 'flexible' | 'creative' | 'conservative';
    frameworkPreferences: string[];
    toolPreferences: string[];
    learningGoals: string[];
  };
  patterns: LearningPattern[];
  insights: LearningInsight[];
  skillLevel: {
    overall: number; // 0-100
    coding: number;
    architecture: number;
    debugging: number;
    testing: number;
    documentation: number;
  };
  adaptationHistory: Array<{
    timestamp: number;
    change: string;
    reason: string;
    effectiveness: number;
  }>;
}

export interface LearningSession {
  id: string;
  timestamp: number;
  context: {
    sessionId: string;
    agentType: string;
    taskType: string;
    projectContext?: string;
  };
  input: string;
  output: string;
  feedback?: {
    rating: number; // 1-5
    comment?: string;
    helpful: boolean;
  };
  patterns: string[];
  learnings: string[];
  adaptations: string[];
}

/**
 * Personal Learning Engine
 */
export class PersonalLearningEngine {
  private sessionId: string;
  private profile: PersonalizationProfile;
  private learningSessions: LearningSession[] = [];
  private storagePath: string;
  private learningRate = 0.1;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.storagePath = `/tmp/agent-ironman-${sessionId}/learning`;
    this.initializeProfile();
    this.loadLearningData();
  }

  private initializeProfile(): void {
    this.profile = {
      id: `profile_${this.sessionId}`,
      userId: this.sessionId,
      preferences: {
        communicationStyle: 'detailed',
        codeStyle: 'flexible',
        frameworkPreferences: [],
        toolPreferences: [],
        learningGoals: [],
      },
      patterns: [],
      insights: [],
      skillLevel: {
        overall: 50,
        coding: 50,
        architecture: 50,
        debugging: 50,
        testing: 50,
        documentation: 50,
      },
      adaptationHistory: [],
    };
  }

  private async loadLearningData(): Promise<void> {
    // Load learning data from storage
    console.log(`Loading learning data for session ${this.sessionId}`);
  }

  private async saveLearningData(): Promise<void> {
    // Save learning data to storage
    console.log(`Saving learning data for session ${this.sessionId}`);
  }

  // Learning Session Management
  async startLearningSession(context: {
    agentType: string;
    taskType: string;
    projectContext?: string;
  }): Promise<string> {
    const sessionId = `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: LearningSession = {
      id: sessionId,
      timestamp: Date.now(),
      context: {
        sessionId: this.sessionId,
        ...context,
      },
      input: '',
      output: '',
      patterns: [],
      learnings: [],
      adaptations: [],
    };

    this.learningSessions.push(session);
    return sessionId;
  }

  async completeLearningSession(
    sessionId: string,
    input: string,
    output: string,
    feedback?: {
      rating: number;
      comment?: string;
      helpful: boolean;
    }
  ): Promise<LearningSession | null> {
    const sessionIndex = this.learningSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;

    const session = this.learningSessions[sessionIndex];
    session.input = input;
    session.output = output;
    session.feedback = feedback;

    // Analyze session for patterns and learnings
    const analysis = await this.analyzeSession(session);
    session.patterns = analysis.patterns;
    session.learnings = analysis.learnings;
    session.adaptations = analysis.adaptations;

    // Update profile based on learnings
    await this.updateProfile(session);

    await this.saveLearningData();
    return session;
  }

  private async analyzeSession(session: LearningSession): Promise<{
    patterns: string[];
    learnings: string[];
    adaptations: string[];
  }> {
    const prompt = `
You are a personal learning AI assistant analyzing a user's interaction patterns.

Session Context:
- Agent Type: ${session.context.agentType}
- Task Type: ${session.context.taskType}
- Project Context: ${session.context.projectContext || 'General'}

User Input:
${session.input}

AI Response:
${session.output}

Please analyze this interaction and identify:
1. Patterns in the user's communication style
2. New information learned about user preferences
3. Areas where the AI could adapt its approach
4. Technical patterns or frameworks the user prefers

Respond with a JSON object containing:
{
  "patterns": ["pattern1", "pattern2"],
  "learnings": ["learning1", "learning2"],
  "adaptations": ["adaptation1", "adaptation2"]
}
`;

    try {
      const response = await query({
        messages: [
          { role: 'user', content: prompt },
        ],
        model: 'sonnet',
        max_tokens: 1000,
      });

      if (response.type === 'success' && response.content) {
        const text = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('');

        // Extract JSON from response
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
      }
    } catch (error) {
      console.error('Learning analysis failed:', error);
    }

    return {
      patterns: [],
      learnings: [],
      adaptations: [],
    };
  }

  private async updateProfile(session: LearningSession): Promise<void> {
    // Update patterns based on session learnings
    session.patterns.forEach(pattern => {
      this.updatePattern(pattern, session);
    });

    // Generate new insights
    const newInsights = await this.generateInsights(session);
    this.profile.insights.push(...newInsights);

    // Update skill levels based on feedback
    if (session.feedback) {
      this.updateSkillLevels(session);
    }

    // Keep insights and patterns limited to avoid memory issues
    this.profile.insights = this.profile.insights.slice(-50);
    this.profile.patterns = this.profile.patterns.slice(-100);
  }

  private updatePattern(pattern: string, session: LearningSession): void {
    // Find existing pattern or create new one
    let existingPattern = this.profile.patterns.find(p => p.pattern === pattern);

    if (!existingPattern) {
      existingPattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.inferPatternType(pattern, session),
        pattern,
        confidence: 0.5,
        frequency: 1,
        contexts: [session.context.taskType],
        lastUsed: Date.now(),
        examples: [],
        impact: {
          productivity: 50,
          quality: 50,
          efficiency: 50,
        },
      };

      this.profile.patterns.push(existingPattern);
    } else {
      // Update existing pattern
      existingPattern.frequency++;
      existingPattern.lastUsed = Date.now();
      existingPattern.confidence = Math.min(1, existingPattern.confidence + this.learningRate);

      // Add context if not present
      if (!existingPattern.contexts.includes(session.context.taskType)) {
        existingPattern.contexts.push(session.context.taskType);
      }

      // Update impact based on feedback
      if (session.feedback) {
        const impactAdjustment = (session.feedback.rating - 3) / 2; // -1 to +1
        existingPattern.impact.productivity = Math.max(0, Math.min(100, existingPattern.impact.productivity + impactAdjustment * 10));
        existingPattern.impact.quality = Math.max(0, Math.min(100, existingPattern.impact.quality + impactAdjustment * 10));
        existingPattern.impact.efficiency = Math.max(0, Math.min(100, existingPattern.impact.efficiency + impactAdjustment * 10));
      }
    }

    // Add example
    existingPattern.examples.push({
      input: session.input,
      output: session.output,
      timestamp: Date.now(),
      success: session.feedback ? session.feedback.rating >= 3 : true,
    });

    // Keep examples limited
    if (existingPattern.examples.length > 10) {
      existingPattern.examples = existingPattern.examples.slice(-10);
    }
  }

  private inferPatternType(pattern: string, session: LearningSession): LearningPattern['type'] {
    const patternLower = pattern.toLowerCase();

    if (patternLower.includes('variable') || patternLower.includes('function') || patternLower.includes('class')) {
      return 'naming';
    }

    if (patternLower.includes('architecture') || patternLower.includes('design') || patternLower.includes('structure')) {
      return 'architecture';
    }

    if (patternLower.includes('framework') || patternLower.includes('library') || patternLower.includes('package')) {
      return 'framework';
    }

    if (patternLower.includes('workflow') || patternLower.includes('process') || patternLower.includes('pipeline')) {
      return 'workflow';
    }

    if (patternLower.includes('tool') || patternLower.includes('utility') || patternLower.includes('helper')) {
      return 'tool';
    }

    return 'communication';
  }

  private async generateInsights(session: LearningSession): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze communication patterns
    if (session.input.length > 500 && session.output.length > 1000) {
      insights.push({
        id: `insight_${Date.now()}_detailed`,
        type: 'trend',
        category: 'communication',
        title: 'Detailed Communication Style',
        description: 'User prefers detailed explanations and thorough responses',
        confidence: 0.8,
        evidence: [{
          example: session.input.substring(0, 100),
          timestamp: session.timestamp,
          weight: 0.9,
        }],
        recommendations: [{
          action: 'Continue providing detailed context for better AI assistance',
          priority: 'medium',
          expectedImpact: 15,
        }],
      });
    }

    // Analyze task completion success
    if (session.feedback && session.feedback.rating >= 4) {
      insights.push({
        id: `insight_${Date.now()}_success`,
        type: 'strength',
        category: session.context.taskType,
        title: 'High Task Success Rate',
        description: `User rated the ${session.context.taskType} task highly successful (${session.feedback.rating}/5)`,
        confidence: 0.9,
        evidence: [{
          example: session.context.taskType,
          timestamp: session.timestamp,
          weight: 1.0,
        }],
        recommendations: [],
      });
    }

    return insights;
  }

  private updateSkillLevels(session: LearningSession): void {
    if (!session.feedback) return;

    const skillArea = this.mapAgentToSkill(session.context.agentType);
    const adjustment = (session.feedback.rating - 3) / 2; // -1 to +1

    this.profile.skillLevel[skillArea] = Math.max(0, Math.min(100, this.profile.skillLevel[skillArea] + adjustment * 10));
    this.profile.skillLevel.overall = Object.values(this.profile.skillLevel).reduce((sum, level) => sum + level, 0) / 6;
  }

  private mapAgentToSkill(agentType: string): keyof PersonalizationProfile['skillLevel'] {
    const skillMapping: Record<string, keyof PersonalizationProfile['skillLevel']> = {
      'code-reviewer': 'coding',
      'architect': 'architecture',
      'debugger': 'debugging',
      'test-writer': 'testing',
      'documenter': 'documentation',
      'python-data-scientist': 'coding',
      'python-backend-developer': 'coding',
      'python-ml-engineer': 'coding',
      'performance-optimizer': 'coding',
    };

    return skillMapping[agentType] || 'coding';
  }

  // Personalization Methods
  async personalizeResponse(
    basePrompt: string,
    context: {
      agentType: string;
      taskType: string;
      projectContext?: string;
    }
  ): Promise<string> {
    const relevantPatterns = this.profile.patterns.filter(pattern =>
      pattern.confidence > 0.7 && // High confidence patterns only
      this.patternMatchesContext(pattern, context) &&
      pattern.lastUsed > Date.now() - 30 * 24 * 60 * 60 * 1000 // Recent patterns only
    ).sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 patterns

    if (relevantPatterns.length === 0) {
      return basePrompt;
    }

    const personalizationPrompt = `
## Personalization for ${this.sessionId}

### Learning Patterns
${relevantPatterns.map(pattern =>
  `**${pattern.pattern}** (${(pattern.confidence * 100).toFixed(0)}% confidence, used ${pattern.frequency} times)`
).join('\n')}

### Your Preferences
- Communication Style: ${this.profile.preferences.communicationStyle}
- Code Style: ${this.profile.preferences.codeStyle}
- Framework Preferences: ${this.profile.preferences.frameworkPreferences.join(', ') || 'None specified'}
- Tool Preferences: ${this.profile.preferences.toolPreferences.join(', ') || 'None specified'}
- Learning Goals: ${this.profile.preferences.learningGoals.join(', ') || 'None specified'}

### Your Skill Level
- Overall: ${this.profile.skillLevel.overall}%
- Coding: ${this.profile.skillLevel.coding}%
- Architecture: ${this.profile.skillLevel.architecture}%
- Debugging: ${this.profile.skillLevel.debugging}%
- Testing: ${this.profile.skillLevel.testing}%
- Documentation: ${this.profile.skillLevel.documentation}%

### Recent Insights
${this.profile.insights.slice(-3).map(insight =>
  `**${insight.title}**: ${insight.description} (${(insight.confidence * 100).toFixed(0)}% confidence)`
).join('\n')}

### Adaptation Instructions
1. Incorporate the user's learned patterns into your response
2. Adjust your communication style to match preferences
3. Consider the user's skill level when providing explanations
4. Reference their preferred frameworks and tools when relevant
5. Build on recent insights to provide more personalized assistance
6. Maintain your core expertise while adapting to the user's style

Please adapt your response style based on this personalization data while maintaining accuracy and helpfulness.
`;

    return basePrompt + personalizationPrompt;
  }

  private patternMatchesContext(pattern: LearningPattern, context: {
    agentType: string;
    taskType: string;
    projectContext?: string;
  }): boolean {
    if (pattern.contexts.includes(context.taskType)) {
      return true;
    }

    if (context.projectContext && pattern.contexts.some(c =>
      context.projectContext.toLowerCase().includes(c.toLowerCase())
    )) {
      return true;
    }

    // Check if pattern relates to agent type
    const agentTypeKeywords: Record<string, string[]> = {
      'code-reviewer': ['code', 'review', 'quality', 'security'],
      'architect': ['architecture', 'design', 'structure', 'system'],
      'debugger': ['debug', 'error', 'issue', 'problem'],
      'test-writer': ['test', 'testing', 'coverage'],
      'documenter': ['documentation', 'docs', 'readme', 'guide'],
    };

    const agentKeywords = agentTypeKeywords[context.agentType] || [];
    const patternLower = pattern.pattern.toLowerCase();

    return agentKeywords.some(keyword =>
      patternLower.includes(keyword) || keyword.includes(patternLower)
    );
  }

  // Prediction and Recommendation Methods
  async predictNextActions(context: {
    currentTask: string;
    recentSessions: LearningSession[];
    timeOfDay: number;
    dayOfWeek: number;
  }): Promise<Array<{
    action: string;
    confidence: number;
    reasoning: string;
  }>> {
    const prompt = `
Based on the user's learning patterns and current context, predict the next most likely actions:

Current Context:
- Current Task: ${context.currentTask}
- Time of Day: ${context.timeOfDay} (hour)
- Day of Week: ${context.dayOfWeek}
- Recent Sessions: ${context.recentSessions.length} sessions

Recent Learning Patterns:
${this.profile.patterns.slice(0, 10).map(pattern =>
  `- ${pattern.pattern} (${(pattern.confidence * 100).toFixed(0)}% confidence, ${pattern.frequency} uses)`
).join('\n')}

User Preferences:
- Communication Style: ${this.profile.preferences.communicationStyle}
- Code Style: ${this.profile.preferences.codeStyle}
- Learning Goals: ${this.profile.preferences.learningGoals.join(', ')}

Please predict the 3-5 most likely next actions the user will take, including:
1. The action (be specific)
2. Confidence level (0-100%)
3. Reasoning based on patterns and context

Respond with JSON: {"predictions": [{"action": "...", "confidence": ..., "reasoning": "..."}]}
`;

    try {
      const response = await query({
        messages: [
          { role: 'user', content: prompt },
        ],
        model: 'sonnet',
        max_tokens: 1000,
      });

      if (response.type === 'success' && response.content) {
        const text = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('');

        const jsonMatch = text.match(/\{[^}]*"predictions":\s*\[([^]]*)\]\s*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]).predictions;
        }
      }
    } catch (error) {
      console.error('Prediction failed:', error);
    }

    return [];
  }

  async getPersonalizedRecommendations(): Promise<Array<{
    category: 'productivity' | 'learning' | 'workflow' | 'tooling';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
    actions: string[];
  }>> {
    const insights = this.profile.insights;
    const habits = this.getHabitInsights();
    const skillGaps = this.identifySkillGaps();

    const recommendations = [];

    // Generate recommendations based on insights
    insights.forEach(insight => {
      if (insight.recommendations) {
        insight.recommendations.forEach(rec => {
          recommendations.push({
            category: this.mapInsightToCategory(insight.category),
            title: insight.title,
            description: insight.description,
            priority: rec.priority,
            impact: rec.expectedImpact || 50,
            actions: [rec.action],
          });
        });
      }
    });

    // Add habit-based recommendations
    habits.forEach(habit => {
      if (habit.suggestion) {
        recommendations.push({
          category: 'productivity',
          title: habit.habit,
          description: habit.suggestion,
          priority: habit.impact === 'high' ? 'high' : 'medium',
          impact: habit.impact.productivity,
          actions: ['Establish this as a regular habit', 'Track progress and consistency'],
        });
      }
    });

    // Add skill gap recommendations
    skillGaps.forEach(gap => {
      recommendations.push({
        category: 'learning',
        title: `Improve ${gap.skill} Skills`,
        description: gap.description,
        priority: gap.impact > 70 ? 'high' : gap.impact > 40 ? 'medium' : 'low',
        impact: gap.impact,
        actions: gap.actions,
      });
    });

    // Sort by impact and limit
    return recommendations
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10);
  }

  private getHabitInsights(): Array<{
    habit: string;
    suggestion: string;
    impact: {
      productivity: number;
      quality: number;
      learning: number;
    };
  }> {
    // This would integrate with the habit tracking system
    // For now, return empty array
    return [];
  }

  private identifySkillGaps(): Array<{
    skill: string;
    description: string;
    impact: number;
    actions: string[];
  }> {
    const gaps = [];

    Object.entries(this.profile.skillLevel).forEach(([skill, level]) => {
      if (level < 70) {
        gaps.push({
          skill,
          description: `Your ${skill} skills could be improved (current level: ${level}%)`,
          impact: 100 - level,
          actions: [
            `Practice ${skill} in focused sessions`,
            `Use specialized ${skill} agents`,
            `Review ${skill} best practices`,
          ],
        });
      }
    });

    return gaps;
  }

  private mapInsightToCategory(category: string): 'productivity' | 'learning' | 'workflow' | 'tooling' {
    const mapping: Record<string, 'productivity' | 'learning' | 'workflow' | 'tooling'> = {
      'coding': 'productivity',
      'workflow': 'workflow',
      'communication': 'productivity',
      'learning': 'learning',
      'tooling': 'tooling',
    };

    return mapping[category] || 'productivity';
  }

  // Data Export and Analysis
  async exportLearningData(): Promise<{
    profile: PersonalizationProfile;
    sessions: LearningSession[];
    statistics: {
      totalSessions: number;
      totalPatterns: number;
      averageFeedbackRating: number;
      skillLevelProgress: Record<string, number>;
    };
  }> {
    const totalSessions = this.learningSessions.length;
    const totalPatterns = this.profile.patterns.length;
    const feedbackRatings = this.learningSessions
      .filter(s => s.feedback)
      .map(s => s.feedback.rating);
    const averageFeedbackRating = feedbackRatings.length > 0
      ? feedbackRatings.reduce((sum, rating) => sum + rating, 0) / feedbackRatings.length
      : 0;

    return {
      profile: this.profile,
      sessions: this.learningSessions,
      statistics: {
        totalSessions,
        totalPatterns,
        averageFeedbackRating,
        skillLevelProgress: this.profile.skillLevel,
      },
    };
  }

  async getLearningSummary(): Promise<{
    totalSessions: number;
    patternsLearned: number;
    currentSkillLevel: number;
    topInsights: LearningInsight[];
    recentActivity: string[];
  }> {
    const recentActivity = this.learningSessions
      .slice(-5)
      .map(s => `Session with ${s.context.agentType}: ${s.context.taskType}`)
      .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

    return {
      totalSessions: this.learningSessions.length,
      patternsLearned: this.profile.patterns.length,
      currentSkillLevel: this.profile.skillLevel.overall,
      topInsights: this.profile.insights.slice(-3),
      recentActivity,
    };
  }

  async getProfile(): Promise<PersonalLearningProfile> {
    return this.profile;
  }
}

// Export type for compatibility
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Singleton instance - requires session ID
let globalLearningEngine: PersonalLearningEngine | null = null;

export function getPersonalLearning(sessionId: string = 'default'): PersonalLearningEngine {
  if (!globalLearningEngine) {
    globalLearningEngine = new PersonalLearningEngine(sessionId);
  }
  return globalLearningEngine;
}

// Default export for convenience
export const personalLearning = getPersonalLearning();