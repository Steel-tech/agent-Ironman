/**
 * Agent Ironman - Personal Productivity Analytics
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
 * Personal Productivity Analytics - Track and analyze development patterns
 */

export interface CodingActivity {
  sessionId: string;
  timestamp: number;
  duration: number;
  linesWritten: number;
  linesDeleted: number;
  filesModified: string[];
  languages: string[];
  frameworks: string[];
  agentTypes: string[];
  success: boolean;
  error?: string;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  messageCount: number;
  agentUsage: Record<string, number>;
  codeChanges: {
    filesModified: number;
    linesAdded: number;
    linesDeleted: number;
  };
  languages: Record<string, number>;
  frameworks: Record<string, number>;
  tasks: Array<{
    type: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
  }>;
}

export interface DailyMetrics {
  date: string;
  totalSessions: number;
  totalDuration: number;
  totalMessages: number;
  codeChanges: {
    filesModified: number;
    linesAdded: number;
    linesDeleted: number;
  };
  languages: Record<string, number>;
  frameworks: Record<string, number>;
  agentUsage: Record<string, number>;
  productivity: {
    efficiency: number; // 0-100
    focusTime: number; // minutes
    taskCompletion: number; // 0-100
  };
}

export interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  dailyMetrics: DailyMetrics[];
  trends: {
    sessionsPerDay: number;
    averageSessionDuration: number;
    productivityGrowth: number;
    mostUsedLanguages: string[];
    mostUsedAgents: string[];
    peakProductivityHour: number;
  };
}

export interface ProductivityInsights {
  summary: string;
  trends: Array<{
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    data: any;
    recommendation?: string;
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
    suggestion?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }>;
}

export interface HabitMetrics {
  id: string;
  name: string;
  category: 'timing' | 'tools' | 'workflow' | 'learning' | 'collaboration';
  frequency: number; // times per week
  lastOccurrence: number;
  streak: number;
  targetFrequency: number;
  consistency: number; // 0-100
  impact: {
    productivity: number; // 0-100
    quality: number; // 0-100
    learning: number; // 0-100
  };
}

/**
 * Personal Productivity Analytics Engine
 */
export class ProductivityAnalytics {
  private sessionId: string;
  private sessions: SessionMetrics[] = [];
  private codingActivities: CodingActivity[] = [];
  private habits: HabitMetrics[] = [];
  private insights: ProductivityInsights[] = [];
  private storagePath: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.storagePath = `/tmp/agent-ironman-${sessionId}/analytics`;
    this.loadData();
    this.initializeDefaultHabits();
  }

  private async loadData(): Promise<void> {
    // Load analytics data from storage
    // For now, initialize empty arrays
  }

  private initializeDefaultHabits(): void {
    if (this.habits.length === 0) {
      this.habits = [
        {
          id: 'morning-coding',
          name: 'Morning Coding Session',
          category: 'timing',
          frequency: 0,
          lastOccurrence: 0,
          streak: 0,
          targetFrequency: 5, // 5 times per week
          consistency: 0,
          impact: {
            productivity: 80,
            quality: 70,
            learning: 60,
          },
        },
        {
          id: 'code-review',
          name: 'Code Review Practice',
          category: 'workflow',
          frequency: 0,
          lastOccurrence: 0,
          streak: 0,
          targetFrequency: 3, // 3 times per week
          consistency: 0,
          impact: {
            productivity: 90,
            quality: 95,
            learning: 85,
          },
        },
        {
          id: 'learning-new-tech',
          name: 'Learning New Technology',
          category: 'learning',
          frequency: 0,
          lastOccurrence: 0,
          streak: 0,
          targetFrequency: 2, // 2 times per week
          consistency: 0,
          impact: {
            productivity: 70,
            quality: 80,
            learning: 100,
          },
        },
        {
          id: 'refactoring',
          name: 'Code Refactoring',
          category: 'tools',
          frequency: 0,
          lastOccurrence: 0,
          streak: 0,
          targetFrequency: 2, // 2 times per week
          consistency: 0,
          impact: {
            productivity: 85,
            quality: 90,
            learning: 75,
          },
        },
      ];
    }
  }

  // Session Tracking
  async startSession(): void {
    const session: SessionMetrics = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      messageCount: 0,
      agentUsage: {},
      codeChanges: {
        filesModified: 0,
        linesAdded: 0,
        linesDeleted: 0,
      },
      languages: {},
      frameworks: {},
      tasks: [],
    };

    this.sessions.push(session);
  }

  async endSession(sessionId: string): Promise<SessionMetrics | null> {
    const sessionIndex = this.sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return null;

    const session = this.sessions[sessionIndex];
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Calculate productivity metrics
    const successRate = session.tasks.filter(t => t.success).length / Math.max(session.tasks.length, 1);
    const focusTime = session.duration / 1000 / 60; // minutes

    session.productivity = {
      efficiency: this.calculateEfficiency(session),
      focusTime,
      taskCompletion: successRate * 100,
    };

    this.sessions[sessionIndex] = session;
    await this.saveData();

    return session;
  }

  async trackMessage(sessionId: string, agentType?: string): void {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    session.messageCount++;
    if (agentType) {
      session.agentUsage[agentType] = (session.agentUsage[agentType] || 0) + 1;
    }
  }

  async trackCodeChanges(
    sessionId: string,
    changes: {
      files: string[];
      linesAdded: number;
      linesDeleted: number;
      languages: string[];
      frameworks: string[];
    }
  ): void {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    session.codeChanges.filesModified += changes.files.length;
    session.codeChanges.linesAdded += changes.linesAdded;
    session.codeChanges.linesDeleted += changes.linesDeleted;

    changes.languages.forEach(lang => {
      session.languages[lang] = (session.languages[lang] || 0) + changes.linesAdded;
    });

    changes.frameworks.forEach(framework => {
      session.frameworks[framework] = (session.frameworks[framework] || 0) + changes.linesAdded;
    });
  }

  async trackTask(
    sessionId: string,
    task: {
      type: string;
      startTime: number;
      endTime?: number;
      duration?: number;
      success: boolean;
    }
  ): void {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (!session) return;

    const endTime = task.endTime || Date.now();
    const duration = task.duration || endTime - task.startTime;

    session.tasks.push({
      ...task,
      endTime,
      duration,
    });
  }

  // Analytics Generation
  getDailyMetrics(date: Date): DailyMetrics {
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(dateStr).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const daySessions = this.sessions.filter(s =>
      s.startTime >= dayStart && s.startTime < dayEnd
    );

    const totalDuration = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMessages = daySessions.reduce((sum, s) => sum + s.messageCount, 0);

    const languages: Record<string, number> = {};
    const frameworks: Record<string, number> = {};
    const agentUsage: Record<string, number> = {};

    daySessions.forEach(session => {
      Object.entries(session.languages).forEach(([lang, lines]) => {
        languages[lang] = (languages[lang] || 0) + lines;
      });

      Object.entries(session.frameworks).forEach(([framework, lines]) => {
        frameworks[framework] = (frameworks[framework] || 0) + lines;
      });

      Object.entries(session.agentUsage).forEach(([agent, count]) => {
        agentUsage[agent] = (agentUsage[agent] || 0) + count;
      });
    });

    const codeChanges = daySessions.reduce(
      (acc, s) => ({
        filesModified: acc.filesModified + s.codeChanges.filesModified,
        linesAdded: acc.linesAdded + s.codeChanges.linesAdded,
        linesDeleted: acc.linesDeleted + s.codeChanges.linesDeleted,
      }),
      { filesModified: 0, linesAdded: 0, linesDeleted: 0 }
    );

    return {
      date: dateStr,
      totalSessions: daySessions.length,
      totalDuration,
      totalMessages,
      codeChanges,
      languages,
      frameworks,
      agentUsage,
      productivity: {
        efficiency: this.calculateDayEfficiency(daySessions),
        focusTime: totalDuration / 1000 / 60,
        taskCompletion: this.calculateDayTaskCompletion(daySessions),
      },
    };
  }

  getWeeklyMetrics(startDate: Date): WeeklyMetrics {
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dailyMetrics: DailyMetrics[] = [];

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      dailyMetrics.push(this.getDailyMetrics(d));
    }

    const totalSessions = dailyMetrics.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalDuration = dailyMetrics.reduce((sum, d) => sum + d.totalDuration, 0);

    return {
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      dailyMetrics,
      trends: {
        sessionsPerDay: totalSessions / 7,
        averageSessionDuration: totalDuration / Math.max(totalSessions, 1),
        productivityGrowth: this.calculateProductivityGrowth(dailyMetrics),
        mostUsedLanguages: this.getTopItems(dailyMetrics, 'languages', 5),
        mostUsedAgents: this.getTopItems(dailyMetrics, 'agentUsage', 5),
        peakProductivityHour: this.getPeakProductivityHour(dailyMetrics),
      },
    };
  }

  getPersonalInsights(): ProductivityInsights {
    const recentSessions = this.sessions.slice(-20); // Last 20 sessions
    const dailyMetrics = this.getDailyMetrics(new Date());

    const trends = this.analyzeTrends(recentSessions, dailyMetrics);
    const patterns = this.identifyPatterns(recentSessions);
    const recommendations = this.generateRecommendations(trends, patterns);

    return {
      summary: this.generateSummary(trends, patterns, dailyMetrics),
      trends,
      patterns,
      recommendations,
    };
  }

  // Habit Tracking
  async trackHabit(habitId: string): Promise<void> {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    const now = Date.now();
    const lastWeek = now - 7 * 24 * 60 * 60 * 1000;

    // Update streak
    if (habit.lastOccurrence && habit.lastOccurrence > lastWeek) {
      // Occurred within last week, increment streak
      habit.streak++;
    } else {
      // Reset streak
      habit.streak = 1;
    }

    habit.frequency = this.calculateHabitFrequency(habit.id);
    habit.lastOccurrence = now;
    habit.consistency = Math.min(100, (habit.frequency / habit.targetFrequency) * 100);

    await this.saveData();
  }

  getHabitAnalytics(): {
    overallConsistency: number;
    habitPerformance: Array<{
      habit: HabitMetrics;
      performance: 'excellent' | 'good' | 'needs_improvement';
      trend: 'improving' | 'stable' | 'declining';
    }>;
    suggestions: Array<{
      habit: string;
      suggestion: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  } {
    const totalConsistency = this.habits.reduce((sum, h) => sum + h.consistency, 0) / Math.max(this.habits.length, 1);

    const habitPerformance = this.habits.map(habit => ({
      habit,
      performance: this.getHabitPerformanceLevel(habit),
      trend: this.getHabitTrend(habit),
    }));

    const suggestions = this.generateHabitSuggestions(this.habits);

    return {
      overallConsistency: totalConsistency,
      habitPerformance,
      suggestions,
    };
  }

  // Helper Methods
  private calculateEfficiency(session: SessionMetrics): number {
    const totalTasks = session.tasks.length;
    if (totalTasks === 0) return 50; // Default efficiency

    const successfulTasks = session.tasks.filter(t => t.success).length;
    const taskSuccessRate = successfulTasks / totalTasks;

    const focusScore = Math.min(100, session.messageCount / 10 * 20); // More messages = more focused

    return Math.round((taskSuccessRate * 0.7 + focusScore * 0.3) * 100);
  }

  private calculateDayEfficiency(sessions: SessionMetrics[]): number {
    if (sessions.length === 0) return 0;
    return Math.round(sessions.reduce((sum, s) => sum + s.productivity.efficiency, 0) / sessions.length);
  }

  private calculateDayTaskCompletion(sessions: SessionMetrics[]): number {
    if (sessions.length === 0) return 0;
    return Math.round(sessions.reduce((sum, s) => sum + s.productivity.taskCompletion, 0) / sessions.length);
  }

  private calculateProductivityGrowth(dailyMetrics: DailyMetrics[]): number {
    if (dailyMetrics.length < 7) return 0;

    const firstWeek = dailyMetrics.slice(0, 7);
    const lastWeek = dailyMetrics.slice(-7);

    const firstWeekAvg = firstWeek.reduce((sum, d) => sum + d.productivity.efficiency, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.productivity.efficiency, 0) / lastWeek.length;

    return Math.round(((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100);
  }

  private getTopItems(dailyMetrics: DailyMetrics[], category: string, limit: number): string[] {
    const items: Record<string, number> = {};

    dailyMetrics.forEach(day => {
      Object.entries(day[category as keyof DailyMetrics]).forEach(([key, value]) => {
        if (typeof value === 'number') {
          items[key] = (items[key] || 0) + value;
        }
      });
    });

    return Object.entries(items)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  private getPeakProductivityHour(dailyMetrics: DailyMetrics[]): number {
    // This would require session timestamp analysis
    // For now, return 10 AM as default
    return 10;
  }

  private calculateHabitFrequency(habitId: string): number {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const now = Date.now();
    const fourWeeksAgo = now - 4 * 7 * 24 * 60 * 60 * 1000;

    // Count occurrences in the last 4 weeks
    return this.codingActivities.filter(activity =>
      activity.timestamp >= fourWeeksAgo &&
      this.activityMatchesHabit(activity, habit)
    ).length;
  }

  private activityMatchesHabit(activity: CodingActivity, habit: HabitMetrics): boolean {
    // This would analyze the activity to see if it matches the habit
    // For now, return a basic match based on timing
    const hour = new Date(activity.timestamp).getHours();

    switch (habit.id) {
      case 'morning-coding':
        return hour >= 6 && hour <= 10;
      case 'code-review':
        return activity.agentTypes.includes('code-reviewer');
      case 'learning-new-tech':
        return activity.frameworks.length === 0; // Learning without frameworks
      case 'refactoring':
        return activity.linesDeleted > 0 && activity.linesAdded > 0;
      default:
        return false;
    }
  }

  private getHabitPerformanceLevel(habit: HabitMetrics): 'excellent' | 'good' | 'needs_improvement' {
    if (habit.consistency >= 90) return 'excellent';
    if (habit.consistency >= 70) return 'good';
    return 'needs_improvement';
  }

  private getHabitTrend(habit: HabitMetrics): 'improving' | 'stable' | 'declining' {
    // This would analyze historical data
    // For now, assume stable
    return 'stable';
  }

  private generateHabitSuggestions(habits: HabitMetrics[]): Array<{
    habit: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    return habits
      .filter(h => h.consistency < 70)
      .map(habit => ({
        habit: habit.name,
        suggestion: `Your ${habit.name} consistency is ${Math.round(habit.consistency)}%. Try to ${habit.id === 'morning-coding' ? 'schedule dedicated morning coding sessions' : 'make this a regular part of your routine'}`,
        impact: habit.impact.productivity > 80 ? 'high' : habit.impact.productivity > 60 ? 'medium' : 'low',
      }));
  }

  private analyzeTrends(sessions: SessionMetrics[], dailyMetrics: DailyMetrics[]): Array<{
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    data: any;
    recommendation?: string;
  }> {
    const trends = [];

    // Analyze session duration trend
    if (sessions.length > 10) {
      const recentSessions = sessions.slice(-5);
      const olderSessions = sessions.slice(-10, -5);

      const recentAvgDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;
      const olderAvgDuration = olderSessions.reduce((sum, s) => sum + s.duration, 0) / olderSessions.length;

      if (recentAvgDuration > olderAvgDuration * 1.2) {
        trends.push({
          type: 'positive',
          description: 'Your coding sessions are getting longer',
          data: { recent: recentAvgDuration, older: olderAvgDuration },
          recommendation: 'Keep this momentum! Longer sessions often indicate deeper focus.',
        });
      } else if (recentAvgDuration < olderAvgDuration * 0.8) {
        trends.push({
          type: 'negative',
          description: 'Your coding sessions are getting shorter',
          data: { recent: recentAvgDuration, older: olderAvgDuration },
          recommendation: 'Consider scheduling dedicated coding time to maintain focus.',
        });
      }
    }

    return trends;
  }

  private identifyPatterns(sessions: SessionMetrics[]): Array<{
    pattern: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
    suggestion?: string;
  }> {
    const patterns = [];

    // Identify most used agents
    const agentUsage: Record<string, number> = {};
    sessions.forEach(session => {
      Object.entries(session.agentUsage).forEach(([agent, count]) => {
        agentUsage[agent] = (agentUsage[agent] || 0) + count;
      });
    });

    Object.entries(agentUsage).forEach(([agent, count]) => {
      const frequency = count / sessions.length;
      if (frequency > 0.3) {
        patterns.push({
          pattern: `Frequent use of ${agent}`,
          frequency: Math.round(frequency * 100),
          impact: count > 20 ? 'high' : 'medium',
          suggestion: `You're making good use of ${agent}. Consider exploring other agents to expand your capabilities.`,
        });
      }
    });

    return patterns;
  }

  private generateRecommendations(trends: any[], patterns: any[], dailyMetrics: DailyMetrics): Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }> {
    const recommendations = [];

    // Based on productivity trends
    if (dailyMetrics.productivity.efficiency < 60) {
      recommendations.push({
        title: 'Improve Productivity Efficiency',
        description: 'Your current efficiency is below optimal',
        priority: 'high',
        actionItems: [
          'Take regular breaks to maintain focus',
          'Use workflows for repetitive tasks',
          'Minimize distractions during coding sessions',
        ],
      });
    }

    // Based on patterns
    const limitedAgentUsage = patterns.filter(p => p.pattern.includes('Frequent use') && p.impact === 'low');
    if (limitedAgentUsage.length > 0) {
      recommendations.push({
        title: 'Expand Agent Usage',
        description: 'You could benefit from using more specialized agents',
        priority: 'medium',
        actionItems: [
          'Explore code-reviewer for code quality',
          'Try python-data-scientist for data analysis',
          'Use architect for project planning',
        ],
      });
    }

    return recommendations;
  }

  private generateSummary(trends: any[], patterns: any[], dailyMetrics: DailyMetrics): string {
    const insights = [];

    if (dailyMetrics.totalSessions === 0) {
      return 'No coding activity recorded today. Start a session to begin tracking your productivity!';
    }

    insights.push(`You had ${dailyMetrics.totalSessions} coding session${dailyMetrics.totalSessions > 1 ? 's' : ''} today`);

    if (dailyMetrics.codeChanges.linesAdded > 0) {
      insights.push(`You wrote ${dailyMetrics.codeChanges.linesAdded} lines of code`);
    }

    if (trends.length > 0) {
      const positiveTrends = trends.filter(t => t.type === 'positive').length;
      if (positiveTrends > 0) {
        insights.push(`Great progress! You have ${positiveTrends} positive trend${positiveTrends > 1 ? 's' : ''}`);
      }
    }

    return insights.join('. ');
  }

  private async saveData(): Promise<void> {
    // Save analytics data to storage
    console.log(`Saving analytics data for session ${this.sessionId}`);
  }
}

// Export singleton instance for convenience (session-agnostic operations)
// For session-specific operations, create new instances
export const productivityAnalytics = new ProductivityAnalytics('default');