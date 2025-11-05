/**
 * Productivity Analytics Engine
 * Track and analyze user productivity patterns and metrics
 */

export interface ProductivityMetrics {
  productivityScore: number;
  tasksCompleted: number;
  averageTaskDuration: number;
  focusTime: number;
  interruptionCount: number;
  mostProductiveHours: number[];
  weeklyTrend: number;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  tasksCompleted: number;
  tokensUsed: number;
  qualityScore: number;
  focusScore: number;
}

export class ProductivityAnalytics {
  private sessions: Map<string, SessionAnalytics> = new Map();
  private metrics: ProductivityMetrics = {
    productivityScore: 0.75,
    tasksCompleted: 0,
    averageTaskDuration: 0,
    focusTime: 0,
    interruptionCount: 0,
    mostProductiveHours: [],
    weeklyTrend: 0
  };

  async getOverallAnalytics(): Promise<ProductivityMetrics> {
    return this.metrics;
  }

  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    return this.sessions.get(sessionId) || null;
  }

  async trackSession(session: SessionAnalytics): Promise<void> {
    this.sessions.set(session.sessionId, session);

    // Update overall metrics
    this.metrics.tasksCompleted += session.tasksCompleted;
    this.updateProductivityScore();
  }

  async updateMetrics(updates: Partial<ProductivityMetrics>): Promise<void> {
    this.metrics = { ...this.metrics, ...updates };
  }

  private updateProductivityScore(): void {
    // Simple productivity calculation
    const completionRate = Math.min(this.metrics.tasksCompleted / 10, 1);
    const focusRate = Math.min(this.metrics.focusTime / (8 * 60 * 60 * 1000), 1);
    this.metrics.productivityScore = (completionRate * 0.5 + focusRate * 0.5);
  }

  async getProductivityTrends(days: number = 7): Promise<{
    daily: Array<{ date: string; score: number }>;
    average: number;
    peak: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    return {
      daily: [],
      average: this.metrics.productivityScore,
      peak: this.metrics.productivityScore,
      trend: 'stable'
    };
  }

  async reset(): Promise<void> {
    this.sessions.clear();
    this.metrics = {
      productivityScore: 0.75,
      tasksCompleted: 0,
      averageTaskDuration: 0,
      focusTime: 0,
      interruptionCount: 0,
      mostProductiveHours: [],
      weeklyTrend: 0
    };
  }
}

// Singleton instance
export const productivityAnalytics = new ProductivityAnalytics();
