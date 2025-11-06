/**
 * Habit Tracking Component
 * Track development habits and receive optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  Target,
  TrendingUp,
  Calendar,
  Award,
  Flame,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Settings,
  BarChart3,
  Brain,
  Heart,
  Zap,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'learning' | 'health' | 'quality' | 'collaboration' | 'workflow';
  type: 'positive' | 'negative' | 'neutral';
  frequency: 'daily' | 'weekly' | 'monthly' | 'project_based';
  targetValue?: number;
  currentValue: number;
  unit: string;
  importance: number;
  isActive: boolean;
  streak: number;
  bestStreak: number;
  completionHistory: Array<{
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
  }>;
  triggers: string[];
  blockers: string[];
  rewards?: string[];
}

interface HabitAnalytics {
  overallScore: number;
  categoryScores: Record<string, number>;
  trends: Array<{
    habitId: string;
    habitName: string;
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    timeFrame: 'week' | 'month' | 'quarter';
    factors: string[];
  }>;
  insights: Array<{
    type: 'pattern' | 'correlation' | 'achievement' | 'improvement';
    title: string;
    description: string;
    data: any;
    actionable: boolean;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
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
    estimatedTimeToForm: number;
    difficulty: 'easy' | 'moderate' | 'challenging';
    successMetrics: string[];
  }>;
  streakAnalysis: {
    currentLongestStreak: number;
    longestEverStreak: number;
    averageStreakLength: number;
    streakPatterns: {
      dayOfWeek: Record<string, number>;
      timeOfDay: Record<string, number>;
      projectContext: Record<string, number>;
    };
  };
  optimalTiming: Record<string, string>;
}

interface HabitTrackingProps {
  onTrackHabit?: (habitId: string, value: number, notes?: string) => void;
  onUpdateHabit?: (habitId: string, updates: Partial<Habit>) => void;
  onCreateHabit?: (habit: Partial<Habit>) => void;
  onDeleteHabit?: (habitId: string) => void;
}

const CATEGORY_ICONS = {
  productivity: Zap,
  learning: Brain,
  health: Heart,
  quality: Target,
  collaboration: Settings,
  workflow: BarChart3
};

const CATEGORY_COLORS = {
  productivity: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  learning: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
  health: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  quality: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
  collaboration: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100',
  workflow: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
};

export function HabitTracking({
  onTrackHabit,
  onUpdateHabit,
  onCreateHabit,
  onDeleteHabit
}: HabitTrackingProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [activeTab, setActiveTab] = useState<'habits' | 'analytics' | 'insights'>('habits');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [trackingValues, setTrackingValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadHabits();
    loadAnalytics();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API
      const mockHabits: Habit[] = [
        {
          id: '1',
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
          streak: 3,
          bestStreak: 7,
          completionHistory: [
            {
              timestamp: Date.now() - 24 * 60 * 60 * 1000,
              value: 1,
              completed: true,
              notes: 'Reviewed React components',
              context: {
                timeOfDay: 'evening',
                dayOfWeek: 2,
                project: 'my-app',
                mood: 'focused',
                environment: 'home office'
              }
            },
            {
              timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
              value: 1,
              completed: true,
              notes: 'Fixed bugs in API',
              context: {
                timeOfDay: 'afternoon',
                dayOfWeek: 1,
                project: 'my-app',
                mood: 'productive',
                environment: 'home office'
              }
            }
          ],
          triggers: ['end of coding session', 'before commit'],
          blockers: ['tight deadlines', 'complex features'],
          rewards: ['Clean code', 'Fewer bugs']
        },
        {
          id: '2',
          name: 'Learning Time',
          description: 'Dedicate time to learning new technologies',
          category: 'learning',
          type: 'positive',
          frequency: 'daily',
          targetValue: 30,
          currentValue: 15,
          unit: 'minutes',
          importance: 9,
          isActive: true,
          streak: 1,
          bestStreak: 14,
          completionHistory: [
            {
              timestamp: Date.now() - 24 * 60 * 60 * 1000,
              value: 25,
              completed: false,
              notes: 'Started React hooks tutorial',
              context: {
                timeOfDay: 'morning',
                dayOfWeek: 2,
                mood: 'curious',
                environment: 'home office'
              }
            }
          ],
          triggers: ['morning routine', 'break time'],
          blockers: ['urgent tasks', 'meetings'],
          rewards: ['New skills', 'Career growth']
        },
        {
          id: '3',
          name: 'Regular Breaks',
          description: 'Take regular breaks to maintain productivity',
          category: 'health',
          type: 'positive',
          frequency: 'daily',
          targetValue: 4,
          currentValue: 2,
          unit: 'breaks',
          importance: 7,
          isActive: true,
          streak: 0,
          bestStreak: 5,
          completionHistory: [
            {
              timestamp: Date.now() - 24 * 60 * 60 * 1000,
              value: 3,
              completed: false,
              context: {
                timeOfDay: 'afternoon',
                dayOfWeek: 2,
                mood: 'tired',
                environment: 'home office'
              }
            }
          ],
          triggers: ['2 hours of continuous work', 'feeling tired'],
          blockers: ['deep focus state', 'urgent deadlines'],
          rewards: ['Reduced fatigue', 'Better focus']
        },
        {
          id: '4',
          name: 'Context Switching',
          description: 'Minimize context switching between tasks',
          category: 'productivity',
          type: 'negative',
          frequency: 'daily',
          targetValue: 2,
          currentValue: 5,
          unit: 'switches',
          importance: 5,
          isActive: true,
          streak: 0,
          bestStreak: 3,
          completionHistory: [
            {
              timestamp: Date.now() - 24 * 60 * 60 * 1000,
              value: 6,
              completed: false,
              notes: 'Too many notifications',
              context: {
                timeOfDay: 'morning',
                dayOfWeek: 2,
                mood: 'distracted',
                environment: 'home office'
              }
            }
          ],
          triggers: ['notifications', 'multiple projects'],
          blockers: ['deep work sessions', 'focused environment']
        }
      ];

      setHabits(mockHabits);

      // Initialize tracking values
      const initialValues: Record<string, string> = {};
      mockHabits.forEach(habit => {
        initialValues[habit.id] = habit.targetValue ? habit.targetValue.toString() : '1';
      });
      setTrackingValues(initialValues);

    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // In a real implementation, this would call the API
      const mockAnalytics: HabitAnalytics = {
        overallScore: 72,
        categoryScores: {
          quality: 85,
          learning: 60,
          health: 40,
          productivity: 30,
          collaboration: 100,
          workflow: 80
        },
        trends: [
          {
            habitId: '1',
            habitName: 'Daily Code Review',
            direction: 'improving',
            changeRate: 0.3,
            timeFrame: 'week',
            factors: ['Better evening routine', 'Fewer interruptions']
          },
          {
            habitId: '2',
            habitName: 'Learning Time',
            direction: 'declining',
            changeRate: -0.2,
            timeFrame: 'week',
            factors: ['More meetings', 'Morning distractions']
          }
        ],
        insights: [
          {
            type: 'achievement',
            title: 'Weekly Learning Champion',
            description: 'You maintained a 7-day streak for Daily Code Review!',
            data: { streak: 7, habitName: 'Daily Code Review' },
            actionable: false,
            impact: 'high'
          },
          {
            type: 'pattern',
            title: 'Optimal Performance Time',
            description: 'You\'re most successful with habits during evening',
            data: { timeOfDay: 'evening', successRate: 0.85 },
            actionable: true,
            impact: 'medium'
          },
          {
            type: 'improvement',
            title: 'Struggling with Regular Breaks',
            description: 'Regular Breaks has been declining recently. Consider adjusting your approach.',
            data: { completionRate: 0.4, targetRate: 0.8 },
            actionable: true,
            impact: 'medium'
          }
        ],
        recommendations: [
          {
            id: '1',
            habitId: '2',
            type: 'strengthen',
            priority: 'high',
            confidence: 0.8,
            title: 'Strengthen Learning Time',
            description: 'Learning Time is important but you\'re struggling with consistency.',
            reasoning: 'Low completion rate (50%) for high-importance habit',
            expectedBenefit: 'Improve consistency and achieve learning goals',
            implementationPlan: [
              'Review current triggers and blockers',
              'Adjust target to 15 minutes',
              'Set up morning reminders',
              'Track progress daily'
            ],
            estimatedTimeToForm: 21,
            difficulty: 'moderate',
            successMetrics: [
              'Complete habit 5+ days per week',
              'Maintain streak for 2+ weeks',
              'Feel more confident with learning routine'
            ]
          },
          {
            id: '2',
            type: 'create',
            priority: 'medium',
            confidence: 0.7,
            title: 'Add Evening Planning Routine',
            description: 'Create a new habit during your optimal performance time: evening',
            reasoning: 'You perform best during evening',
            expectedBenefit: 'Higher success rate for new habits',
            implementationPlan: [
              'Choose a planning habit that fits your schedule',
              'Start with 5-minute target',
              'Set up automatic reminders',
              'Track progress for at least 2 weeks'
            ],
            estimatedTimeToForm: 14,
            difficulty: 'easy',
            successMetrics: [
              'Complete new habit 5+ days per week',
              'Maintain consistency for 2+ weeks',
              'Feel natural doing evening planning'
            ]
          }
        ],
        streakAnalysis: {
          currentLongestStreak: 3,
          longestEverStreak: 14,
          averageStreakLength: 4.2,
          streakPatterns: {
            dayOfWeek: {
              'Monday': 12,
              'Tuesday': 15,
              'Wednesday': 18,
              'Thursday': 14,
              'Friday': 8,
              'Saturday': 3,
              'Sunday': 2
            },
            timeOfDay: {
              'morning': 25,
              'afternoon': 30,
              'evening': 40,
              'night': 5
            },
            projectContext: {
              'my-app': 35,
              'learning-project': 20,
              'side-project': 15
            }
          }
        },
        optimalTiming: {
          'Daily Code Review': 'evening',
          'Learning Time': 'morning',
          'Regular Breaks': 'afternoon'
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleTrackHabit = (habitId: string) => {
    const value = parseFloat(trackingValues[habitId] || '1');
    onTrackHabit?.(habitId, value);

    // Update local state for immediate feedback
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const completed = habit.type === 'positive'
          ? value >= (habit.targetValue || 1)
          : value <= (habit.targetValue || 1);

        const newCompletion = {
          timestamp: Date.now(),
          value,
          completed,
          context: {
            timeOfDay: getTimeOfDay(),
            dayOfWeek: new Date().getDay(),
            mood: 'focused', // Would get from user
            environment: 'current' // Would get from user
          }
        };

        return {
          ...habit,
          currentValue: value,
          completionHistory: [...habit.completionHistory, newCompletion]
        };
      }
      return habit;
    }));

    // Reload analytics after tracking
    setTimeout(loadAnalytics, 1000);
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const getCompletionRate = (habit: Habit): number => {
    if (habit.completionHistory.length === 0) return 0;
    const recentCompletions = habit.completionHistory.slice(-7);
    const completed = recentCompletions.filter(c => c.completed).length;
    return (completed / recentCompletions.length) * 100;
  };

  const getTrendIcon = (direction: 'improving' | 'declining' | 'stable') => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable': return <TrendingUp className="h-4 w-4 text-gray-500 rotate-90" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="h-4 w-4 text-yellow-500" />;
      case 'pattern': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'improvement': return <Lightbulb className="h-4 w-4 text-purple-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100';
      case 'medium': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'low': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Habit Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Habit Tracking
              {analytics && (
                <Badge variant="secondary" className="ml-2">
                  {analytics.overallScore.toFixed(0)}% overall
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Habit
              </Button>
            </div>
          </div>
        </CardHeader>
        {analytics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.streakAnalysis.currentLongestStreak}
                </div>
                <div className="text-muted-foreground">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.streakAnalysis.longestEverStreak}
                </div>
                <div className="text-muted-foreground">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {habits.filter(h => h.streak > 0).length}
                </div>
                <div className="text-muted-foreground">Active Streaks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.overallScore.toFixed(0)}%
                </div>
                <div className="text-muted-foreground">Overall Score</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        <Button
          variant={activeTab === 'habits' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('habits')}
          className="rounded-b-none"
        >
          <Target className="h-4 w-4 mr-2" />
          Habits
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className="rounded-b-none"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant={activeTab === 'insights' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('insights')}
          className="rounded-b-none"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Insights
        </Button>
      </div>

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Habits</h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {habits.filter(h => h.isActive).map((habit) => {
                  const CategoryIcon = CATEGORY_ICONS[habit.category];
                  const completionRate = getCompletionRate(habit);
                  const isCompletedToday = habit.completionHistory.some(c =>
                    new Date(c.timestamp).toDateString() === new Date().toDateString() && c.completed
                  );

                  return (
                    <Card key={habit.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{habit.name}</h4>
                              <p className="text-sm text-muted-foreground">{habit.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {habit.streak > 0 && (
                              <Badge variant="outline" className="text-orange-600">
                                <Flame className="h-3 w-3 mr-1" />
                                {habit.streak}
                              </Badge>
                            )}
                            <Badge variant="outline" className={CATEGORY_COLORS[habit.category]}>
                              {habit.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{completionRate.toFixed(0)}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>

                          {/* Current value and tracking */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Current:</span>
                            <Input
                              type="number"
                              value={trackingValues[habit.id] || ''}
                              onChange={(e) => setTrackingValues(prev => ({
                                ...prev,
                                [habit.id]: e.target.value
                              }))}
                              className="w-20 h-8 text-sm"
                              placeholder={habit.targetValue?.toString()}
                            />
                            <span className="text-sm text-muted-foreground">{habit.unit}</span>
                            <span className="text-sm text-muted-foreground">
                              / {habit.targetValue} {habit.unit}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleTrackHabit(habit.id)}
                              disabled={isCompletedToday}
                              className="h-8 ml-auto"
                            >
                              {isCompletedToday ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Target className="h-3 w-3 mr-1" />
                              )}
                              {isCompletedToday ? 'Done' : 'Track'}
                            </Button>
                          </div>

                          {/* Quick stats */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <span>Best: {habit.bestStreak} 🔥</span>
                              <span>Importance: {habit.importance}/10</span>
                            </div>
                            {habit.type === 'negative' && (
                              <div className="flex items-center space-x-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Reduce to {habit.targetValue} {habit.unit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Today's Summary</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {habits.filter(h => h.isActive).map((habit) => {
                    const todayCompletion = habit.completionHistory.find(c =>
                      new Date(c.timestamp).toDateString() === new Date().toDateString()
                    );

                    return (
                      <div key={habit.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          {todayCompletion?.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-300" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{habit.name}</div>
                            {todayCompletion && (
                              <div className="text-xs text-muted-foreground">
                                {todayCompletion.value} {habit.unit}
                                {todayCompletion.notes && ` - ${todayCompletion.notes}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {getCompletionRate(habit).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {habit.streak} day streak
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {analytics && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {analytics.recommendations.slice(0, 3).map((rec) => (
                    <Card key={rec.id} className="p-3">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-sm">{rec.title}</h5>
                            <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                          <div className="text-xs text-blue-600">{rec.expectedBenefit}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-4">
          {/* Category Performance */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Category Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analytics.categoryScores).map(([category, score]) => {
                const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                return (
                  <Card key={category}>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="text-2xl font-bold">{score.toFixed(0)}%</div>
                          <div className="text-sm text-muted-foreground capitalize">{category}</div>
                        </div>
                      </div>
                      <Progress value={score} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Trends */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.trends.map((trend) => (
                <Card key={trend.habitId}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{trend.habitName}</h4>
                      {getTrendIcon(trend.direction)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {trend.direction === 'improving' ? 'Improving' : trend.direction === 'declining' ? 'Declining' : 'Stable'}{' '}
                      by {Math.abs(trend.changeRate * 100).toFixed(0)}% this {trend.timeFrame}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trend.factors.join(', ')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Streak Patterns */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Streak Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Best Day of Week</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.streakAnalysis.streakPatterns.dayOfWeek)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([day, count]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span>{day}</span>
                          <span>{count} successes</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Best Time of Day</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.streakAnalysis.streakPatterns.timeOfDay)
                      .sort(([, a], [, b]) => b - a)
                      .map(([time, count]) => (
                        <div key={time} className="flex justify-between text-sm">
                          <span className="capitalize">{time}</span>
                          <span>{count} successes</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Optimal Timing</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.optimalTiming).map(([habit, time]) => (
                      <div key={habit} className="text-sm">
                        <div className="font-medium">{habit}</div>
                        <div className="text-muted-foreground capitalize">{time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && analytics && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personalized Insights</h3>
          <div className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline" className={
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {insight.impact} impact
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Actionable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All recommendations */}
          <h3 className="text-lg font-semibold mb-3">All Recommendations</h3>
          <div className="space-y-3">
            {analytics.recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Lightbulb className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">
                            {rec.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(rec.confidence * 100)}% confidence
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.estimatedTimeToForm} days to form
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h5 className="text-sm font-medium mb-1">Expected Benefit:</h5>
                    <p className="text-sm text-green-600">{rec.expectedBenefit}</p>
                  </div>

                  <div className="mb-3">
                    <h5 className="text-sm font-medium mb-1">Implementation Plan:</h5>
                    <ul className="text-sm list-disc list-inside text-muted-foreground">
                      {rec.implementationPlan.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-1">Success Metrics:</h5>
                    <ul className="text-sm list-disc list-inside text-muted-foreground">
                      {rec.successMetrics.map((metric, index) => (
                        <li key={index}>{metric}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}