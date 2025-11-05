/**
 * Predictive Suggestions Engine
 * AI-powered suggestions based on user patterns, analytics, and learning data
 */

import { createHash, randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { productivityAnalytics, type ProductivityMetrics, type SessionAnalytics } from './productivityAnalytics';
import { personalLearning, type LearningPattern, type SkillLevel } from './personalLearning';
import { projectMemory, type ProjectContext } from '../memory/projectMemoryService';

export interface SuggestionContext {
  currentSession?: string;
  activeProject?: string;
  currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recentActivity: ActivityData[];
  systemState: SystemState;
}

export interface ActivityData {
  type: 'code' | 'command' | 'workflow' | 'integration' | 'learning';
  description: string;
  timestamp: number;
  outcome?: 'success' | 'failure' | 'partial';
  duration?: number;
  tokensUsed?: number;
}

export interface SystemState {
  activeWorkflows: string[];
  openFiles: string[];
  environmentHealth: 'healthy' | 'warning' | 'critical';
  recentErrors: string[];
  availableIntegrations: string[];
}

export interface PredictiveSuggestion {
  id: string;
  type: 'workflow' | 'action' | 'learning' | 'optimization' | 'warning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  title: string;
  description: string;
  reasoning: string;
  expectedBenefit: string;
  estimatedTime: number;
  prerequisites?: string[];
  relatedPatterns?: string[];
  metadata: {
    category: string;
    source: 'pattern' | 'analytics' | 'learning' | 'external';
    lastSeen?: number;
    frequency?: number;
    successRate?: number;
  };
  action?: {
    type: 'workflow' | 'command' | 'link' | 'custom';
    payload: any;
    autoExecute?: boolean;
  };
}

export interface SuggestionFilter {
  types?: string[];
  priorities?: string[];
  categories?: string[];
  confidence?: number;
  timeLimit?: number;
  maxSuggestions?: number;
}

export class PredictiveSuggestions {
  private dbPath: string;
  private suggestionHistory: Map<string, SuggestionHistoryItem> = new Map();
  private patternWeights: Map<string, number> = new Map();
  private lastAnalyzed = 0;

  constructor(dataPath: string = './data') {
    this.dbPath = path.join(dataPath, 'suggestions.db');
    this.initializePatternWeights();
    this.loadSuggestionHistory();
  }

  private async initializePatternWeights(): Promise<void> {
    // Initialize weights for different pattern types
    this.patternWeights.set('time_efficiency', 0.25);
    this.patternWeights.set('code_quality', 0.20);
    this.patternWeights.set('learning_progress', 0.15);
    this.patternWeights.set('workflow_optimization', 0.20);
    this.patternWeights.set('error_prevention', 0.20);
  }

  private async loadSuggestionHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const history = JSON.parse(data);
      history.forEach((item: SuggestionHistoryItem) => {
        this.suggestionHistory.set(item.id, item);
      });
    } catch (error) {
      // File doesn't exist yet, start fresh
      console.log('No suggestion history found, starting fresh');
    }
  }

  private async saveSuggestionHistory(): Promise<void> {
    try {
      const history = Array.from(this.suggestionHistory.values());
      await fs.writeFile(this.dbPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to save suggestion history:', error);
    }
  }

  async generateSuggestions(context: SuggestionContext, filter?: SuggestionFilter): Promise<PredictiveSuggestion[]> {
    const suggestions: PredictiveSuggestion[] = [];

    // Get comprehensive data from all systems
    const [analytics, learningProfile, projectContext] = await Promise.all([
      productivityAnalytics.getOverallAnalytics(),
      personalLearning.getProfile(),
      context.activeProject ? projectMemory.retrieveRelevantContext(context.activeProject, '', 5) : Promise.resolve([])
    ]);

    // Generate different types of suggestions
    const workflowSuggestions = await this.generateWorkflowSuggestions(context, analytics, learningProfile, projectContext);
    const optimizationSuggestions = await this.generateOptimizationSuggestions(context, analytics, learningProfile);
    const learningSuggestions = await this.generateLearningSuggestions(context, analytics, learningProfile);
    const warningSuggestions = await this.generateWarningSuggestions(context, analytics);

    suggestions.push(...workflowSuggestions, ...optimizationSuggestions, ...learningSuggestions, ...warningSuggestions);

    // Sort by priority and confidence
    suggestions.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityScore = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityScore !== 0) return priorityScore;
      return b.confidence - a.confidence;
    });

    // Apply filters
    let filteredSuggestions = suggestions;
    if (filter) {
      filteredSuggestions = this.applyFilters(suggestions, filter);
    }

    // Update suggestion history and frequency
    this.updateSuggestionFrequency(filteredSuggestions);

    // Save updated history
    await this.saveSuggestionHistory();

    return filteredSuggestions.slice(0, filter?.maxSuggestions || 10);
  }

  private async generateWorkflowSuggestions(
    context: SuggestionContext,
    analytics: any,
    learningProfile: any,
    projectContext: ProjectContext[]
  ): Promise<PredictiveSuggestion[]> {
    const suggestions: PredictiveSuggestion[] = [];

    // Time-based workflow suggestions
    const timeBasedSuggestion = this.getTimeBasedWorkflowSuggestion(context, analytics);
    if (timeBasedSuggestion) suggestions.push(timeBasedSuggestion);

    // Pattern-based workflow suggestions
    const patternSuggestions = this.getPatternBasedWorkflowSuggestions(context, learningProfile, projectContext);
    suggestions.push(...patternSuggestions);

    // Project-specific workflow suggestions
    if (context.activeProject && projectContext.length > 0) {
      const projectSuggestions = this.getProjectBasedWorkflowSuggestions(context, projectContext);
      suggestions.push(...projectSuggestions);
    }

    // Error recovery suggestions
    if (context.systemState.recentErrors.length > 0) {
      const errorSuggestion = this.getErrorRecoverySuggestion(context);
      if (errorSuggestion) suggestions.push(errorSuggestion);
    }

    return suggestions;
  }

  private async generateOptimizationSuggestions(
    context: SuggestionContext,
    analytics: any,
    learningProfile: any
  ): Promise<PredictiveSuggestion[]> {
    const suggestions: PredictiveSuggestion[] = [];

    // Productivity optimization
    if (analytics.productivityScore < 0.7) {
      suggestions.push({
        id: randomUUID(),
        type: 'optimization',
        priority: 'high',
        confidence: 0.8,
        title: 'Optimize Your Development Environment',
        description: 'Your productivity score suggests there are opportunities to optimize your workflow',
        reasoning: `Based on your productivity patterns and current score of ${analytics.productivityScore.toFixed(2)}`,
        expectedBenefit: 'Increase daily productivity by 20-30%',
        estimatedTime: 15,
        metadata: {
          category: 'productivity',
          source: 'analytics',
          successRate: 0.75
        },
        action: {
          type: 'workflow',
          payload: { workflowId: 'productivity-optimization' },
          autoExecute: false
        }
      });
    }

    // Environment health optimization
    if (context.systemState.environmentHealth !== 'healthy') {
      suggestions.push({
        id: randomUUID(),
        type: 'warning',
        priority: 'high',
        confidence: 0.9,
        title: 'Fix Environment Issues',
        description: 'Your development environment has health issues that need attention',
        reasoning: `Environment health is ${context.systemState.environmentHealth}`,
        expectedBenefit: 'Prevent future errors and improve stability',
        estimatedTime: 10,
        metadata: {
          category: 'environment',
          source: 'pattern'
        },
        action: {
          type: 'command',
          payload: 'agent-ironman doctor',
          autoExecute: false
        }
      });
    }

    // Token usage optimization
    const recentTokenUsage = context.recentActivity.reduce((sum, activity) => sum + (activity.tokensUsed || 0), 0);
    if (recentTokenUsage > 50000) { // High token usage
      suggestions.push({
        id: randomUUID(),
        type: 'optimization',
        priority: 'medium',
        confidence: 0.7,
        title: 'Optimize Token Usage',
        description: 'Your recent token usage is high, consider optimizing prompts',
        reasoning: `Recent usage: ${recentTokenUsage.toLocaleString()} tokens`,
        expectedBenefit: 'Reduce costs while maintaining quality',
        estimatedTime: 5,
        metadata: {
          category: 'cost',
          source: 'analytics'
        }
      });
    }

    return suggestions;
  }

  private async generateLearningSuggestions(
    context: SuggestionContext,
    analytics: any,
    learningProfile: any
  ): Promise<PredictiveSuggestion[]> {
    const suggestions: PredictiveSuggestion[] = [];

    // Skill improvement suggestions
    const weakSkills = learningProfile.skillLevels.filter((skill: SkillLevel) => skill === 'beginner');
    for (const skill of weakSkills.slice(0, 2)) {
      suggestions.push({
        id: randomUUID(),
        type: 'learning',
        priority: 'medium',
        confidence: 0.8,
        title: `Improve ${skill} Skills`,
        description: `Focus on improving your ${skill} abilities`,
        reasoning: `Your current skill level in ${skill} is beginner`,
        expectedBenefit: `Enhance capability in ${skill} tasks`,
        estimatedTime: 30,
        metadata: {
          category: 'learning',
          source: 'learning'
        },
        action: {
          type: 'workflow',
          payload: {
            workflowId: 'skill-improvement',
            parameters: { skill: skill }
          }
        }
      });
    }

    // Learning pattern suggestions
    const bestLearningTime = this.getBestLearningTime(learningProfile, context);
    if (bestLearningTime) {
      suggestions.push({
        id: randomUUID(),
        type: 'learning',
        priority: 'low',
        confidence: 0.6,
        title: 'Optimal Learning Time Detected',
        description: `${bestLearningTime} appears to be your best time for learning new concepts`,
        reasoning: 'Based on your historical learning patterns and success rates',
        expectedBenefit: 'Improve learning efficiency by 40%',
        estimatedTime: 0,
        metadata: {
          category: 'learning',
          source: 'learning'
        }
      });
    }

    return suggestions;
  }

  private async generateWarningSuggestions(
    context: SuggestionContext,
    analytics: any
  ): Promise<PredictiveSuggestion[]> {
    const suggestions: PredictiveSuggestion[] = [];

    // Burnout warning
    const recentActivityDuration = context.recentActivity.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    if (recentActivityDuration > 4 * 60 * 60 * 1000) { // More than 4 hours
      suggestions.push({
        id: randomUUID(),
        type: 'warning',
        priority: 'high',
        confidence: 0.8,
        title: 'Take a Break - Risk of Burnout',
        description: 'You\'ve been working continuously for several hours',
        reasoning: `Recent activity duration: ${Math.round(recentActivityDuration / (60 * 60 * 1000))} hours`,
        expectedBenefit: 'Maintain long-term productivity and well-being',
        estimatedTime: 15,
        metadata: {
          category: 'wellbeing',
          source: 'analytics'
        }
      });
    }

    // Error pattern warning
    const recentFailures = context.recentActivity.filter(activity => activity.outcome === 'failure');
    if (recentFailures.length >= 3) {
      suggestions.push({
        id: randomUUID(),
        type: 'warning',
        priority: 'critical',
        confidence: 0.9,
        title: 'Multiple Recent Failures Detected',
        description: 'You\'ve experienced several failures recently, consider reviewing your approach',
        reasoning: `${recentFailures.length} failures in recent activity`,
        expectedBenefit: 'Identify and address root cause of issues',
        estimatedTime: 20,
        metadata: {
          category: 'quality',
          source: 'pattern'
        },
        action: {
          type: 'workflow',
          payload: { workflowId: 'failure-analysis' }
        }
      });
    }

    return suggestions;
  }

  private getTimeBasedWorkflowSuggestion(context: SuggestionContext, analytics: any): PredictiveSuggestion | null {
    const { currentTimeOfDay, dayOfWeek } = context;

    // Morning routine
    if (currentTimeOfDay === 'morning' && dayOfWeek !== 'saturday' && dayOfWeek !== 'sunday') {
      return {
        id: randomUUID(),
        type: 'workflow',
        priority: 'medium',
        confidence: 0.7,
        title: 'Start Your Day Right',
        description: 'Run your morning development routine to set up for success',
        reasoning: 'Morning routine helps establish productive patterns',
        expectedBenefit: 'Consistent daily start and improved focus',
        estimatedTime: 10,
        metadata: {
          category: 'routine',
          source: 'pattern',
          frequency: 0.8
        },
        action: {
          type: 'workflow',
          payload: { workflowId: 'morning-routine' }
        }
      };
    }

    // End of day wrap-up
    if (currentTimeOfDay === 'evening') {
      return {
        id: randomUUID(),
        type: 'workflow',
        priority: 'low',
        confidence: 0.6,
        title: 'Daily Wrap-up',
        description: 'Review today\'s progress and prepare for tomorrow',
        reasoning: 'Evening review helps with planning and reflection',
        expectedBenefit: 'Better planning and sense of accomplishment',
        estimatedTime: 5,
        metadata: {
          category: 'routine',
          source: 'pattern'
        }
      };
    }

    return null;
  }

  private getPatternBasedWorkflowSuggestions(
    context: SuggestionContext,
    learningProfile: any,
    projectContext: ProjectContext[]
  ): PredictiveSuggestion[] {
    const suggestions: PredictiveSuggestion[] = [];

    // Check for repeated patterns
    const recentCodeActivity = context.recentActivity.filter(activity => activity.type === 'code');
    if (recentCodeActivity.length >= 5) {
      // Suggest code review workflow
      suggestions.push({
        id: randomUUID(),
        type: 'workflow',
        priority: 'medium',
        confidence: 0.75,
        title: 'Run Code Review Workflow',
        description: 'You\'ve made several code changes recently, consider running a comprehensive review',
        reasoning: 'Pattern of multiple code changes detected',
        expectedBenefit: 'Improve code quality and catch issues early',
        estimatedTime: 15,
        metadata: {
          category: 'quality',
          source: 'pattern'
        },
        action: {
          type: 'workflow',
          payload: { workflowId: 'code-review-analysis' }
        }
      });
    }

    // Check for integration opportunities
    if (context.systemState.availableIntegrations.length > 0 && !context.systemState.activeWorkflows.length) {
      suggestions.push({
        id: randomUUID(),
        type: 'workflow',
        priority: 'low',
        confidence: 0.5,
        title: 'Check Integration Status',
        description: 'Review your external integrations to ensure everything is synced',
        reasoning: 'Available integrations detected but no active workflows',
        expectedBenefit: 'Maintain sync with external services',
        estimatedTime: 5,
        metadata: {
          category: 'maintenance',
          source: 'pattern'
        }
      });
    }

    return suggestions;
  }

  private getProjectBasedWorkflowSuggestions(
    context: SuggestionContext,
    projectContext: ProjectContext[]
  ): PredictiveSuggestion[] {
    const suggestions: PredictiveSuggestion[] = [];

    // Analyze project context for suggestions
    const recentFiles = projectContext.map(ctx => ctx.path).slice(-5);
    if (recentFiles.length > 0) {
      // Suggest project-specific workflow
      suggestions.push({
        id: randomUUID(),
        type: 'workflow',
        priority: 'medium',
        confidence: 0.7,
        title: `Optimize ${path.basename(context.activeProject!)} Workflow`,
        description: `Run project-specific optimizations for ${path.basename(context.activeProject!)}`,
        reasoning: 'Project-specific workflow available',
        expectedBenefit: 'Tailored optimizations for current project',
        estimatedTime: 10,
        metadata: {
          category: 'project',
          source: 'pattern'
        },
        action: {
          type: 'workflow',
          payload: {
            workflowId: 'project-optimization',
            parameters: { projectId: context.activeProject }
          }
        }
      });
    }

    return suggestions;
  }

  private getErrorRecoverySuggestion(context: SuggestionContext): PredictiveSuggestion | null {
    const recentErrors = context.systemState.recentErrors.slice(-3);
    if (recentErrors.length === 0) return null;

    // Analyze error patterns
    const errorTypes = new Set(recentErrors.map(error => error.split(':')[0]));
    const hasRepeatedErrors = errorTypes.size < recentErrors.length;

    return {
      id: randomUUID(),
      type: 'workflow',
      priority: 'critical',
      confidence: hasRepeatedErrors ? 0.9 : 0.7,
      title: hasRepeatedErrors ? 'Fix Recurring Error Pattern' : 'Address Recent Errors',
      description: hasRepeatedErrors
        ? 'You\'re experiencing repeated errors, let\'s identify and fix the root cause'
        : 'You have recent errors that need attention',
      reasoning: `${recentErrors.length} recent errors detected${hasRepeatedErrors ? ' with repeated patterns' : ''}`,
      expectedBenefit: 'Resolve underlying issues and prevent future occurrences',
      estimatedTime: 20,
      metadata: {
        category: 'debugging',
        source: 'pattern',
        successRate: 0.8
      },
      action: {
        type: 'workflow',
        payload: {
          workflowId: 'error-analysis',
          parameters: { errors: recentErrors }
        }
      }
    };
  }

  private getBestLearningTime(learningProfile: any, context: SuggestionContext): string | null {
    // Analyze learning patterns to find best time
    const timePatterns = learningProfile.patterns.filter((pattern: LearningPattern) =>
      pattern.contexts?.includes('time') && pattern.confidence > 0.7
    );

    if (timePatterns.length > 0) {
      const bestPattern = timePatterns.reduce((best: LearningPattern, current: LearningPattern) =>
        current.confidence > best.confidence ? current : best
      );
      return bestPattern.contexts;
    }

    return null;
  }

  private applyFilters(suggestions: PredictiveSuggestion[], filter: SuggestionFilter): PredictiveSuggestion[] {
    return suggestions.filter(suggestion => {
      if (filter.types && !filter.types.includes(suggestion.type)) return false;
      if (filter.priorities && !filter.priorities.includes(suggestion.priority)) return false;
      if (filter.categories && !filter.categories.includes(suggestion.metadata.category)) return false;
      if (filter.confidence && suggestion.confidence < filter.confidence) return false;
      if (filter.timeLimit && suggestion.estimatedTime > filter.timeLimit) return false;
      return true;
    });
  }

  private updateSuggestionFrequency(suggestions: PredictiveSuggestion[]): void {
    suggestions.forEach(suggestion => {
      const history = this.suggestionHistory.get(suggestion.id);
      if (history) {
        history.frequency += 1;
        history.lastSuggested = Date.now();
      } else {
        this.suggestionHistory.set(suggestion.id, {
          id: suggestion.id,
          type: suggestion.type,
          frequency: 1,
          lastSuggested: Date.now(),
          acceptanceRate: 0,
          totalShown: 1
        });
      }
    });
  }

  async recordSuggestionFeedback(suggestionId: string, accepted: boolean, feedback?: string): Promise<void> {
    const history = this.suggestionHistory.get(suggestionId);
    if (history) {
      history.totalShown += 1;
      if (accepted) {
        history.acceptanceRate = (history.acceptanceRate * (history.totalShown - 1) + 1) / history.totalShown;
      } else {
        history.acceptanceRate = (history.acceptanceRate * (history.totalShown - 1)) / history.totalShown;
      }

      if (feedback) {
        history.feedback = feedback;
      }
    }

    await this.saveSuggestionHistory();
  }

  async getSuggestionInsights(): Promise<{
    topSuggestions: SuggestionHistoryItem[];
    acceptanceRates: Record<string, number>;
    categoryPerformance: Record<string, number>;
    trends: SuggestionTrend[];
  }> {
    const history = Array.from(this.suggestionHistory.values());

    // Top suggestions by frequency
    const topSuggestions = history
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Acceptance rates by type
    const acceptanceRates: Record<string, number> = {};
    history.forEach(item => {
      if (!acceptanceRates[item.type]) {
        acceptanceRates[item.type] = item.acceptanceRate;
      }
    });

    // Category performance
    const categoryPerformance: Record<string, number> = {};
    history.forEach(item => {
      const category = item.type;
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = item.acceptanceRate;
      }
    });

    // Trends (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(item => item.lastSuggested > thirtyDaysAgo);
    const trends: SuggestionTrend[] = [
      {
        period: 'last_30_days',
        totalSuggestions: recentHistory.length,
        averageAcceptance: recentHistory.reduce((sum, item) => sum + item.acceptanceRate, 0) / recentHistory.length,
        topCategory: Object.keys(categoryPerformance).reduce((a, b) =>
          categoryPerformance[a] > categoryPerformance[b] ? a : b
        )
      }
    ];

    return {
      topSuggestions,
      acceptanceRates,
      categoryPerformance,
      trends
    };
  }
}

interface SuggestionHistoryItem {
  id: string;
  type: string;
  frequency: number;
  lastSuggested: number;
  acceptanceRate: number;
  totalShown: number;
  feedback?: string;
}

interface SuggestionTrend {
  period: string;
  totalSuggestions: number;
  averageAcceptance: number;
  topCategory: string;
}

// Singleton instance
export const predictiveSuggestions = new PredictiveSuggestions();