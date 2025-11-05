/**
 * Habit Tracking and Optimization System
 * Tracks user development habits and provides optimization suggestions
 */

import { createHash, randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { productivityAnalytics, type ProductivityMetrics } from './productivityAnalytics';
import { personalLearning, type PersonalLearningProfile } from './personalLearning';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'learning' | 'health' | 'quality' | 'collaboration' | 'workflow';
  type: 'positive' | 'negative' | 'neutral';
  frequency: 'daily' | 'weekly' | 'monthly' | 'project_based';
  targetValue?: number;
  currentValue: number;
  unit: string;
  importance: number; // 1-10
  isActive: boolean;
  created: number;
  updated: number;
  lastTracked: number;
  streak: number;
  bestStreak: number;
  completionHistory: HabitCompletion[];
  triggers: string[];
  blockers: string[];
  rewards?: string[];
  metadata: {
    timeOfDay?: string[];
    dayOfWeek?: number[];
    projectContext?: string[];
    emotionalState?: string[];
    environmentFactors?: string[];
  };
}

export interface HabitCompletion {
  timestamp: number;
  value: number;
  completed: boolean;
  notes?: string;
  context: {
    timeOfDay: string;
    dayOfWeek: number;
    project?: string;
    mood?: string;
    environment?: string;
  };
}

export interface HabitSuggestion {
  id: string;
  habitId?: string;
  type: 'create' | 'modify' | 'break' | 'strengthen' | 'optimize';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  title: string;
  description: string;
  reasoning: string;
  expectedBenefit: string;
  implementationPlan: string[];
  estimatedTimeToForm: number; // days
  difficulty: 'easy' | 'moderate' | 'challenging';
  prerequisites?: string[];
  potentialBlockers?: string[];
  successMetrics: string[];
}

export interface HabitAnalytics {
  overallScore: number;
  categoryScores: Record<string, number>;
  trends: HabitTrend[];
  insights: HabitInsight[];
  recommendations: HabitSuggestion[];
  streakAnalysis: StreakAnalysis;
  optimalTiming: Record<string, string>;
}

export interface HabitTrend {
  habitId: string;
  habitName: string;
  direction: 'improving' | 'declining' | 'stable';
  changeRate: number;
  timeFrame: 'week' | 'month' | 'quarter';
  factors: string[];
}

export interface HabitInsight {
  type: 'pattern' | 'correlation' | 'achievement' | 'improvement';
  title: string;
  description: string;
  data: any;
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
}

export interface StreakAnalysis {
  currentLongestStreak: number;
  longestEverStreak: number;
  averageStreakLength: number;
  streakPatterns: {
    dayOfWeek: Record<string, number>;
    timeOfDay: Record<string, number>;
    projectContext: Record<string, number>;
  };
}

export class HabitTracking {
  private dbPath: string;
  private analyticsPath: string;
  private habits: Map<string, Habit> = new Map();
  private analyticsCache: HabitAnalytics | null = null;
  private lastAnalyticsUpdate = 0;

  constructor(dataPath: string = './data') {
    this.dbPath = path.join(dataPath, 'habits.json');
    this.analyticsPath = path.join(dataPath, 'habitAnalytics.json');
    this.loadHabits();
  }

  private async loadHabits(): Promise<void> {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const habits: Habit[] = JSON.parse(data);
      habits.forEach(habit => {
        this.habits.set(habit.id, habit);
      });

      // Load analytics cache
      try {
        const analyticsData = await fs.readFile(this.analyticsPath, 'utf-8');
        this.analyticsCache = JSON.parse(analyticsData);
        this.lastAnalyticsUpdate = Date.now();
      } catch (error) {
        console.log('No cached analytics found');
      }
    } catch (error) {
      console.log('No existing habits found, starting fresh');
      await this.initializeDefaultHabits();
    }
  }

  private async initializeDefaultHabits(): Promise<void> {
    const defaultHabits: Omit<Habit, 'id' | 'created' | 'updated' | 'lastTracked'>[] = [
      {
        name: 'Daily Code Review',
        description: 'Review and improve code quality daily',
        category: 'quality',
        type: 'positive',
        frequency: 'daily',
        targetValue: 1,
        currentValue: 0,
        unit: 'reviews',
        importance: 8,
        isActive: true,
        streak: 0,
        bestStreak: 0,
        completionHistory: [],
        triggers: ['end of coding session', 'before commit'],
        blockers: ['tight deadlines', 'complex features'],
        metadata: {
          timeOfDay: ['evening'],
          dayOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
          environmentFactors: ['quiet environment']
        }
      },
      {
        name: 'Learning Time',
        description: 'Dedicate time to learning new technologies or concepts',
        category: 'learning',
        type: 'positive',
        frequency: 'daily',
        targetValue: 30,
        currentValue: 0,
        unit: 'minutes',
        importance: 9,
        isActive: true,
        streak: 0,
        bestStreak: 0,
        completionHistory: [],
        triggers: ['morning routine', 'break time'],
        blockers: ['urgent tasks', 'meetings'],
        rewards: ['new skill acquisition', 'career growth'],
        metadata: {
          timeOfDay: ['morning'],
          emotionalState: ['curious', 'motivated']
        }
      },
      {
        name: 'Regular Breaks',
        description: 'Take regular breaks to maintain productivity and health',
        category: 'health',
        type: 'positive',
        frequency: 'daily',
        targetValue: 4,
        currentValue: 0,
        unit: 'breaks',
        importance: 7,
        isActive: true,
        streak: 0,
        bestStreak: 0,
        completionHistory: [],
        triggers: ['2 hours of continuous work', 'feeling tired'],
        blockers: ['deep focus state', 'urgent deadlines'],
        rewards: ['reduced fatigue', 'better focus'],
        metadata: {
          timeOfDay: ['morning', 'afternoon'],
          environmentFactors: ['work environment']
        }
      },
      {
        name: 'Commit Frequency',
        description: 'Make small, frequent commits to maintain clean history',
        category: 'workflow',
        type: 'positive',
        frequency: 'daily',
        targetValue: 3,
        currentValue: 0,
        unit: 'commits',
        importance: 6,
        isActive: true,
        streak: 0,
        bestStreak: 0,
        completionHistory: [],
        triggers: ['completed feature', 'fixed bug'],
        blockers: ['large feature development', 'experimental code'],
        metadata: {
          dayOfWeek: [1, 2, 3, 4, 5],
          projectContext: ['feature development', 'bug fixes']
        }
      },
      {
        name: 'Context Switching',
        description: 'Minimize context switching between tasks',
        category: 'productivity',
        type: 'negative',
        frequency: 'daily',
        targetValue: 2,
        currentValue: 0,
        unit: 'switches',
        importance: 5,
        isActive: true,
        streak: 0,
        bestStreak: 0,
        completionHistory: [],
        triggers: ['notifications', 'multiple projects'],
        blockers: ['deep work sessions', 'focused environment'],
        metadata: {
          emotionalState: ['distracted', 'overwhelmed']
        }
      }
    ];

    for (const habitData of defaultHabits) {
      await this.createHabit(habitData);
    }
  }

  async createHabit(habitData: Omit<Habit, 'id' | 'created' | 'updated' | 'lastTracked'>): Promise<string> {
    const habit: Habit = {
      ...habitData,
      id: randomUUID(),
      created: Date.now(),
      updated: Date.now(),
      lastTracked: Date.now()
    };

    this.habits.set(habit.id, habit);
    await this.saveHabits();
    this.invalidateAnalyticsCache();

    return habit.id;
  }

  async updateHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'created'>>): Promise<boolean> {
    const existing = this.habits.get(id);
    if (!existing) return false;

    const updated: Habit = {
      ...existing,
      ...updates,
      updated: Date.now()
    };

    this.habits.set(id, updated);
    await this.saveHabits();
    this.invalidateAnalyticsCache();

    return true;
  }

  async trackHabit(id: string, value: number, notes?: string, context?: Partial<HabitCompletion['context']>): Promise<boolean> {
    const habit = this.habits.get(id);
    if (!habit) return false;

    const now = Date.now();
    const completion: HabitCompletion = {
      timestamp: now,
      value,
      completed: habit.type === 'positive' ? value >= (habit.targetValue || 1) : value <= (habit.targetValue || 1),
      notes,
      context: {
        timeOfDay: this.getTimeOfDay(now),
        dayOfWeek: new Date(now).getDay(),
        project: context?.project,
        mood: context?.mood,
        environment: context?.environment
      }
    };

    habit.completionHistory.push(completion);
    habit.currentValue = value;
    habit.lastTracked = now;
    habit.updated = now;

    // Update streak
    this.updateStreak(habit);

    await this.saveHabits();
    this.invalidateAnalyticsCache();

    return true;
  }

  private updateStreak(habit: Habit): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    const todayCompletion = habit.completionHistory.find(c =>
      new Date(c.timestamp).toDateString() === today && c.completed
    );

    const yesterdayCompletion = habit.completionHistory.find(c =>
      new Date(c.timestamp).toDateString() === yesterday && c.completed
    );

    if (todayCompletion) {
      if (yesterdayCompletion || habit.streak === 0) {
        habit.streak += 1;
      } else {
        // Streak broken, restart
        habit.streak = 1;
      }

      if (habit.streak > habit.bestStreak) {
        habit.bestStreak = habit.streak;
      }
    } else if (!yesterdayCompletion && habit.streak > 0) {
      // Streak broken
      habit.streak = 0;
    }
  }

  async deleteHabit(id: string): Promise<boolean> {
    const habit = this.habits.get(id);
    if (!habit) return false;

    this.habits.delete(id);
    await this.saveHabits();
    this.invalidateAnalyticsCache();

    return true;
  }

  async getHabit(id: string): Promise<Habit | null> {
    return this.habits.get(id) || null;
  }

  async getAllHabits(activeOnly: boolean = true): Promise<Habit[]> {
    const habits = Array.from(this.habits.values());
    return activeOnly ? habits.filter(habit => habit.isActive) : habits;
  }

  async getHabitsByCategory(category: Habit['category']): Promise<Habit[]> {
    const habits = Array.from(this.habits.values());
    return habits.filter(habit => habit.category === category && habit.isActive);
  }

  async getHabitAnalytics(): Promise<HabitAnalytics> {
    // Check cache
    if (this.analyticsCache && (Date.now() - this.lastAnalyticsUpdate) < 5 * 60 * 1000) { // 5 minutes cache
      return this.analyticsCache;
    }

    const habits = Array.from(this.habits.values()).filter(habit => habit.isActive);
    const analytics = await this.generateAnalytics(habits);

    // Update cache
    this.analyticsCache = analytics;
    this.lastAnalyticsUpdate = Date.now();
    await this.saveAnalyticsCache();

    return analytics;
  }

  private async generateAnalytics(habits: Habit[]): Promise<HabitAnalytics> {
    // Overall score
    const overallScore = this.calculateOverallScore(habits);

    // Category scores
    const categoryScores = this.calculateCategoryScores(habits);

    // Trends
    const trends = this.analyzeTrends(habits);

    // Insights
    const insights = this.generateInsights(habits, trends);

    // Recommendations
    const recommendations = await this.generateRecommendations(habits, insights);

    // Streak analysis
    const streakAnalysis = this.analyzeStreaks(habits);

    // Optimal timing
    const optimalTiming = this.analyzeOptimalTiming(habits);

    return {
      overallScore,
      categoryScores,
      trends,
      insights,
      recommendations,
      streakAnalysis,
      optimalTiming
    };
  }

  private calculateOverallScore(habits: Habit[]): number {
    if (habits.length === 0) return 0;

    const totalScore = habits.reduce((sum, habit) => {
      let habitScore = 0;

      if (habit.completionHistory.length > 0) {
        const recentCompletions = habit.completionHistory.slice(-7); // Last 7 days
        const completionRate = recentCompletions.filter(c => c.completed).length / recentCompletions.length;

        // Weight by importance
        habitScore = completionRate * habit.importance;
      }

      return sum + habitScore;
    }, 0);

    const maxPossibleScore = habits.reduce((sum, habit) => sum + habit.importance, 0);
    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  }

  private calculateCategoryScores(habits: Habit[]): Record<string, number> {
    const categoryScores: Record<string, { total: number; max: number }> = {};

    habits.forEach(habit => {
      if (!categoryScores[habit.category]) {
        categoryScores[habit.category] = { total: 0, max: 0 };
      }

      let habitScore = 0;
      if (habit.completionHistory.length > 0) {
        const recentCompletions = habit.completionHistory.slice(-7);
        const completionRate = recentCompletions.filter(c => c.completed).length / recentCompletions.length;
        habitScore = completionRate * habit.importance;
      }

      categoryScores[habit.category].total += habitScore;
      categoryScores[habit.category].max += habit.importance;
    });

    // Convert to percentages
    const finalScores: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      finalScores[category] = scores.max > 0 ? (scores.total / scores.max) * 100 : 0;
    });

    return finalScores;
  }

  private analyzeTrends(habits: Habit[]): HabitTrend[] {
    const trends: HabitTrend[] = [];

    habits.forEach(habit => {
      if (habit.completionHistory.length < 7) return; // Need at least 7 days

      const recentHistory = habit.completionHistory.slice(-30); // Last 30 days
      const weeklyData = this.groupByWeek(recentHistory);

      if (weeklyData.length >= 2) {
        const trend = this.calculateTrend(habit, weeklyData);
        trends.push(trend);
      }
    });

    return trends;
  }

  private groupByWeek(completions: HabitCompletion[]): Array<{ week: number; completionRate: number }> {
    const weeks: Map<number, { completed: number; total: number }> = new Map();

    completions.forEach(completion => {
      const weekNumber = Math.floor(completion.timestamp / (7 * 24 * 60 * 60 * 1000));

      if (!weeks.has(weekNumber)) {
        weeks.set(weekNumber, { completed: 0, total: 0 });
      }

      const weekData = weeks.get(weekNumber)!;
      weekData.total += 1;
      if (completion.completed) {
        weekData.completed += 1;
      }
    });

    return Array.from(weeks.entries())
      .map(([week, data]) => ({
        week,
        completionRate: data.total > 0 ? data.completed / data.total : 0
      }))
      .sort((a, b) => a.week - b.week);
  }

  private calculateTrend(habit: Habit, weeklyData: Array<{ week: number; completionRate: number }>): HabitTrend {
    const recentWeeks = weeklyData.slice(-4); // Last 4 weeks
    const earlierWeeks = weeklyData.slice(-8, -4); // Previous 4 weeks

    const recentAverage = recentWeeks.reduce((sum, w) => sum + w.completionRate, 0) / recentWeeks.length;
    const earlierAverage = earlierWeeks.length > 0
      ? earlierWeeks.reduce((sum, w) => sum + w.completionRate, 0) / earlierWeeks.length
      : recentAverage;

    const changeRate = recentAverage - earlierAverage;
    let direction: 'improving' | 'declining' | 'stable';

    if (changeRate > 0.1) {
      direction = 'improving';
    } else if (changeRate < -0.1) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }

    return {
      habitId: habit.id,
      habitName: habit.name,
      direction,
      changeRate,
      timeFrame: 'month',
      factors: this.identifyTrendFactors(habit, changeRate)
    };
  }

  private identifyTrendFactors(habit: Habit, changeRate: number): string[] {
    const factors: string[] = [];

    // Analyze completion contexts for patterns
    const recentCompletions = habit.completionHistory.slice(-14);
    const successfulCompletions = recentCompletions.filter(c => c.completed);
    const failedCompletions = recentCompletions.filter(c => !c.completed);

    if (changeRate > 0.1) {
      // Improving - what's working?
      const commonTimes = this.getMostCommonTimes(successfulCompletions);
      if (commonTimes.length > 0) {
        factors.push(`Strong performance during ${commonTimes.join(', ')}`);
      }

      const commonMoods = this.getMostCommonMoods(successfulCompletions);
      if (commonMoods.length > 0) {
        factors.push(`Better results when feeling ${commonMoods.join(', ')}`);
      }
    } else if (changeRate < -0.1) {
      // Declining - what's not working?
      const commonBlockers = this.getCommonBlockers(failedCompletions);
      if (commonBlockers.length > 0) {
        factors.push(`Struggling with ${commonBlockers.join(', ')}`);
      }
    }

    return factors;
  }

  private getMostCommonTimes(completions: HabitCompletion[]): string[] {
    const timeCounts: Record<string, number> = {};

    completions.forEach(completion => {
      const timeOfDay = completion.context.timeOfDay;
      timeCounts[timeOfDay] = (timeCounts[timeOfDay] || 0) + 1;
    });

    return Object.entries(timeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([time]) => time);
  }

  private getMostCommonMoods(completions: HabitCompletion[]): string[] {
    const moodCounts: Record<string, number> = {};

    completions.forEach(completion => {
      const mood = completion.context.mood;
      if (mood) {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
    });

    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([mood]) => mood);
  }

  private getCommonBlockers(failedCompletions: HabitCompletion[]): string[] {
    // This would need to be enhanced with actual blocker tracking
    // For now, return some common patterns
    return ['tight deadlines', 'interruptions', 'lack of motivation'];
  }

  private generateInsights(habits: Habit[], trends: HabitTrend[]): HabitInsight[] {
    const insights: HabitInsight[] = [];

    // Achievement insights
    habits.forEach(habit => {
      if (habit.bestStreak >= 7) {
        insights.push({
          type: 'achievement',
          title: `${habit.name} Champion`,
          description: `You've maintained a ${habit.bestStreak}-day streak for ${habit.name}!`,
          data: { streak: habit.bestStreak, habitName: habit.name },
          actionable: false,
          impact: 'high'
        });
      }
    });

    // Pattern insights
    const timePatterns = this.analyzeTimePatterns(habits);
    if (timePatterns.bestTimeOfDay) {
      insights.push({
        type: 'pattern',
        title: 'Optimal Performance Time',
        description: `You're most successful with habits during ${timePatterns.bestTimeOfDay}`,
        data: { timeOfDay: timePatterns.bestTimeOfDay, successRate: timePatterns.bestSuccessRate },
        actionable: true,
        impact: 'medium'
      });
    }

    // Correlation insights
    const correlations = this.findHabitCorrelations(habits);
    correlations.forEach(correlation => {
      insights.push({
        type: 'correlation',
        title: `Habit Connection: ${correlation.habit1} & ${correlation.habit2}`,
        description: `Success with ${correlation.habit1} correlates with success in ${correlation.habit2}`,
        data: correlation,
        actionable: true,
        impact: correlation.strength > 0.7 ? 'high' : 'medium'
      });
    });

    // Improvement insights
    trends.filter(trend => trend.direction === 'declining').forEach(trend => {
      insights.push({
        type: 'improvement',
        title: `Declining Trend: ${trend.habitName}`,
        description: `${trend.habitName} has been declining recently. Consider refocusing on this habit.`,
        data: trend,
        actionable: true,
        impact: trend.changeRate < -0.3 ? 'high' : 'medium'
      });
    });

    return insights;
  }

  private analyzeTimePatterns(habits: Habit[]): { bestTimeOfDay?: string; bestSuccessRate: number } {
    const timePerformance: Record<string, { successful: number; total: number }> = {};

    habits.forEach(habit => {
      habit.completionHistory.forEach(completion => {
        const timeOfDay = completion.context.timeOfDay;
        if (!timePerformance[timeOfDay]) {
          timePerformance[timeOfDay] = { successful: 0, total: 0 };
        }
        timePerformance[timeOfDay].total += 1;
        if (completion.completed) {
          timePerformance[timeOfDay].successful += 1;
        }
      });
    });

    let bestTimeOfDay: string | undefined;
    let bestSuccessRate = 0;

    Object.entries(timePerformance).forEach(([timeOfDay, performance]) => {
      const successRate = performance.total > 0 ? performance.successful / performance.total : 0;
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate;
        bestTimeOfDay = timeOfDay;
      }
    });

    return { bestTimeOfDay, bestSuccessRate };
  }

  private findHabitCorrelations(habits: Habit[]): Array<{
    habit1: string;
    habit2: string;
    strength: number;
    pattern: string;
  }> {
    const correlations = [];
    const habitNames = habits.map(h => h.name);

    // Simple correlation analysis based on completion patterns
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habit1 = habits[i];
        const habit2 = habits[j];

        const correlation = this.calculateHabitCorrelation(habit1, habit2);
        if (correlation.strength > 0.5) {
          correlations.push({
            habit1: habit1.name,
            habit2: habit2.name,
            strength: correlation.strength,
            pattern: correlation.pattern
          });
        }
      }
    }

    return correlations;
  }

  private calculateHabitCorrelation(habit1: Habit, habit2: Habit): { strength: number; pattern: string } {
    // Get daily completion data for both habits
    const dailyData = this.getDailyCompletionData(habit1, habit2);

    if (dailyData.length < 7) return { strength: 0, pattern: 'insufficient_data' };

    // Calculate correlation coefficient
    let bothCompleted = 0;
    let habit1Completed = 0;
    let habit2Completed = 0;
    let totalDays = dailyData.length;

    dailyData.forEach(day => {
      if (day.habit1Completed && day.habit2Completed) {
        bothCompleted++;
      }
      if (day.habit1Completed) habit1Completed++;
      if (day.habit2Completed) habit2Completed++;
    });

    // Simple correlation calculation
    const expectedBoth = (habit1Completed / totalDays) * (habit2Completed / totalDays) * totalDays;
    const correlationStrength = bothCompleted / Math.max(expectedBoth, 1);

    const pattern = bothCompleted > expectedBoth ? 'positive' : 'negative';

    return {
      strength: Math.min(correlationStrength, 1),
      pattern
    };
  }

  private getDailyCompletionData(habit1: Habit, habit2: Habit): Array<{
    date: string;
    habit1Completed: boolean;
    habit2Completed: boolean;
  }> {
    const dailyData = new Map<string, { habit1Completed: boolean; habit2Completed: boolean }>();

    // Process habit1 completions
    habit1.completionHistory.forEach(completion => {
      const date = new Date(completion.timestamp).toDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, { habit1Completed: false, habit2Completed: false });
      }
      dailyData.get(date)!.habit1Completed = completion.completed;
    });

    // Process habit2 completions
    habit2.completionHistory.forEach(completion => {
      const date = new Date(completion.timestamp).toDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, { habit1Completed: false, habit2Completed: false });
      }
      dailyData.get(date)!.habit2Completed = completion.completed;
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
  }

  private async generateRecommendations(habits: Habit[], insights: HabitInsight[]): Promise<HabitSuggestion[]> {
    const suggestions: HabitSuggestion[] = [];

    // Analyze struggling habits
    const strugglingHabits = habits.filter(habit => {
      const recentCompletions = habit.completionHistory.slice(-7);
      const completionRate = recentCompletions.filter(c => c.completed).length / recentCompletions.length;
      return completionRate < 0.5 && habit.importance >= 7;
    });

    strugglingHabits.forEach(habit => {
      suggestions.push({
        id: randomUUID(),
        habitId: habit.id,
        type: 'strengthen',
        priority: 'high',
        confidence: 0.8,
        title: `Strengthen ${habit.name}`,
        description: `${habit.name} is important but you're struggling with consistency. Consider adjusting your approach.`,
        reasoning: `Low completion rate (${Math.round((habit.completionHistory.slice(-7).filter(c => c.completed).length / 7) * 100)}%) for high-importance habit`,
        expectedBenefit: 'Improve consistency and achieve habit goals',
        implementationPlan: [
          'Review current triggers and blockers',
          'Adjust target value if needed',
          'Set up reminders and accountability',
          'Track progress daily'
        ],
        estimatedTimeToForm: 21,
        difficulty: 'moderate',
        successMetrics: [
          'Complete habit 5+ days per week',
          'Maintain streak for 2+ weeks',
          'Feel more confident with the habit'
        ]
      });
    });

    // Suggest new habits based on insights
    insights.filter(insight => insight.actionable && insight.type === 'pattern').forEach(insight => {
      if (insight.data.bestTimeOfDay) {
        suggestions.push({
          id: randomUUID(),
          type: 'create',
          priority: 'medium',
          confidence: 0.7,
          title: `Add ${insight.data.bestTimeOfDay} Routine`,
          description: `Create a new habit during your optimal performance time: ${insight.data.bestTimeOfDay}`,
          reasoning: `You perform best during ${insight.data.bestTimeOfDay}`,
          expectedBenefit: 'Higher success rate for new habits',
          implementationPlan: [
            'Choose a habit that fits your schedule',
            'Start with a small, achievable target',
            'Set up automatic reminders',
            'Track progress for at least 2 weeks'
          ],
          estimatedTimeToForm: 30,
          difficulty: 'easy',
          successMetrics: [
            'Complete new habit 4+ days per week',
            'Maintain consistency for 3+ weeks',
            'Feel natural doing the habit'
          ]
        });
      }
    });

    // Break bad habits
    const negativeHabits = habits.filter(habit => habit.type === 'negative' && habit.currentValue > (habit.targetValue || 1));
    negativeHabits.forEach(habit => {
      suggestions.push({
        id: randomUUID(),
        habitId: habit.id,
        type: 'break',
        priority: 'high',
        confidence: 0.9,
        title: `Reduce ${habit.name}`,
        description: `Work on reducing ${habit.name} to improve your productivity and focus`,
        reasoning: `Current value (${habit.currentValue}) exceeds target (${habit.targetValue || 1})`,
        expectedBenefit: 'Better focus, reduced stress, improved productivity',
        implementationPlan: [
          'Identify main triggers for the habit',
          'Create alternative behaviors',
          'Set up environmental barriers',
          'Track instances and progress'
        ],
        estimatedTimeToForm: 14,
        difficulty: 'challenging',
        potentialBlockers: ['stress', 'boredom', 'environmental cues'],
        successMetrics: [
          'Reduce occurrences by 50% in 2 weeks',
          'Identify and manage main triggers',
          'Develop alternative coping strategies'
        ]
      });
    });

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }

  private analyzeStreaks(habits: Habit[]): StreakAnalysis {
    const currentStreaks = habits.map(habit => habit.streak);
    const allStreaks = habits.flatMap(habit => {
      // Calculate all historical streaks (simplified version)
      return [habit.bestStreak, habit.streak];
    });

    const currentLongestStreak = Math.max(...currentStreaks, 0);
    const longestEverStreak = Math.max(...allStreaks, 0);
    const averageStreakLength = allStreaks.length > 0
      ? allStreaks.reduce((sum, streak) => sum + streak, 0) / allStreaks.length
      : 0;

    // Analyze streak patterns
    const streakPatterns = {
      dayOfWeek: this.getStreakPatternsByDayOfWeek(habits),
      timeOfDay: this.getStreakPatternsByTimeOfDay(habits),
      projectContext: this.getStreakPatternsByProject(habits)
    };

    return {
      currentLongestStreak,
      longestEverStreak,
      averageStreakLength,
      streakPatterns
    };
  }

  private getStreakPatternsByDayOfWeek(habits: Habit[]): Record<string, number> {
    const dayPatterns: Record<number, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    habits.forEach(habit => {
      habit.completionHistory.forEach(completion => {
        if (completion.completed) {
          const dayOfWeek = new Date(completion.timestamp).getDay();
          dayPatterns[dayOfWeek] = (dayPatterns[dayOfWeek] || 0) + 1;
        }
      });
    });

    const result: Record<string, number> = {};
    Object.entries(dayPatterns).forEach(([day, count]) => {
      result[dayNames[parseInt(day)]] = count;
    });

    return result;
  }

  private getStreakPatternsByTimeOfDay(habits: Habit[]): Record<string, number> {
    const timePatterns: Record<string, number> = {};

    habits.forEach(habit => {
      habit.completionHistory.forEach(completion => {
        if (completion.completed) {
          const timeOfDay = completion.context.timeOfDay;
          timePatterns[timeOfDay] = (timePatterns[timeOfDay] || 0) + 1;
        }
      });
    });

    return timePatterns;
  }

  private getStreakPatternsByProject(habits: Habit[]): Record<string, number> {
    const projectPatterns: Record<string, number> = {};

    habits.forEach(habit => {
      habit.completionHistory.forEach(completion => {
        if (completion.completed && completion.context.project) {
          const project = completion.context.project;
          projectPatterns[project] = (projectPatterns[project] || 0) + 1;
        }
      });
    });

    return projectPatterns;
  }

  private analyzeOptimalTiming(habits: Habit[]): Record<string, string> {
    const optimalTiming: Record<string, string> = {};

    habits.forEach(habit => {
      const timePerformance = this.getHabitTimePerformance(habit);
      if (timePerformance.bestTime) {
        optimalTiming[habit.name] = timePerformance.bestTime;
      }
    });

    return optimalTiming;
  }

  private getHabitTimePerformance(habit: Habit): { bestTime?: string; successRate: number } {
    const timePerformance: Record<string, { successful: number; total: number }> = {};

    habit.completionHistory.forEach(completion => {
      const timeOfDay = completion.context.timeOfDay;
      if (!timePerformance[timeOfDay]) {
        timePerformance[timeOfDay] = { successful: 0, total: 0 };
      }
      timePerformance[timeOfDay].total += 1;
      if (completion.completed) {
        timePerformance[timeOfDay].successful += 1;
      }
    });

    let bestTime: string | undefined;
    let bestSuccessRate = 0;

    Object.entries(timePerformance).forEach(([timeOfDay, performance]) => {
      const successRate = performance.total > 0 ? performance.successful / performance.total : 0;
      if (successRate > bestSuccessRate && performance.total >= 3) { // Need at least 3 data points
        bestSuccessRate = successRate;
        bestTime = timeOfDay;
      }
    });

    return { bestTime, bestSuccessRate };
  }

  private getTimeOfDay(timestamp: number): string {
    const hour = new Date(timestamp).getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private invalidateAnalyticsCache(): void {
    this.analyticsCache = null;
    this.lastAnalyticsUpdate = 0;
  }

  private async saveHabits(): Promise<void> {
    try {
      const habits = Array.from(this.habits.values());
      await fs.writeFile(this.dbPath, JSON.stringify(habits, null, 2));
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
  }

  private async saveAnalyticsCache(): Promise<void> {
    try {
      if (this.analyticsCache) {
        await fs.writeFile(this.analyticsPath, JSON.stringify(this.analyticsCache, null, 2));
      }
    } catch (error) {
      console.error('Failed to save analytics cache:', error);
    }
  }
}

// Singleton instance
export const habitTracking = new HabitTracking();