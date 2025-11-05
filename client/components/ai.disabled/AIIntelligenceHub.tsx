/**
 * AI Intelligence Hub
 * Central integration point for all AI-powered features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Brain,
  BookOpen,
  Target,
  Lightbulb,
  TrendingUp,
  Settings,
  Activity,
  Zap,
  Award,
  BarChart3,
  Clock,
  Star,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

import { PredictiveSuggestions } from './PredictiveSuggestions';
import { PersonalKnowledgeBase } from './PersonalKnowledgeBase';
import { HabitTracking } from './HabitTracking';

interface IntelligenceMetrics {
  overallScore: number;
  learningProgress: number;
  habitSuccess: number;
  knowledgeBaseEntries: number;
  suggestionsAccuracy: number;
  weeklyProgress: {
    productivity: number;
    learning: number;
    habits: number;
    knowledge: number;
  };
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
  category: 'learning' | 'productivity' | 'habits' | 'knowledge';
}

interface AIIntelligenceHubProps {
  sessionData?: any;
  projectContext?: any;
  onExecuteAction?: (action: any) => void;
}

export function AIIntelligenceHub({
  sessionData,
  projectContext,
  onExecuteAction
}: AIIntelligenceHubProps) {
  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [sessionData, projectContext]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would aggregate data from all AI systems
      const mockMetrics: IntelligenceMetrics = {
        overallScore: 78,
        learningProgress: 65,
        habitSuccess: 72,
        knowledgeBaseEntries: 47,
        suggestionsAccuracy: 84,
        weeklyProgress: {
          productivity: 82,
          learning: 70,
          habits: 75,
          knowledge: 85
        },
        achievements: [
          {
            id: '1',
            title: 'Learning Streak Master',
            description: 'Maintained a 7-day learning streak',
            icon: '🔥',
            unlockedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            category: 'learning'
          },
          {
            id: '2',
            title: 'Knowledge Builder',
            description: 'Added 50 entries to your knowledge base',
            icon: '📚',
            unlockedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            category: 'knowledge'
          },
          {
            id: '3',
            title: 'Habit Champion',
            description: 'Completed 80% of habits for a week',
            icon: '🏆',
            unlockedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
            category: 'habits'
          }
        ]
      };

      setMetrics(mockMetrics);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to load intelligence metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSuggestion = (suggestionId: string, action: any) => {
    onExecuteAction?.({
      type: 'execute_suggestion',
      suggestionId,
      action
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    // Track dismissal for learning
    console.log('Dismissed suggestion:', suggestionId);
  };

  const handleProvideFeedback = (suggestionId: string, accepted: boolean, feedback?: string) => {
    // Track feedback for improving suggestions
    console.log('Suggestion feedback:', { suggestionId, accepted, feedback });
  };

  const handleCreateEntry = (entryData: any) => {
    // Create knowledge base entry
    console.log('Creating knowledge entry:', entryData);
  };

  const handleUpdateEntry = (id: string, updates: any) => {
    // Update knowledge base entry
    console.log('Updating knowledge entry:', { id, updates });
  };

  const handleDeleteEntry = (id: string) => {
    // Delete knowledge base entry
    console.log('Deleting knowledge entry:', id);
  };

  const handleTrackHabit = (habitId: string, value: number, notes?: string) => {
    // Track habit completion
    console.log('Tracking habit:', { habitId, value, notes });
    onExecuteAction?.({
      type: 'track_habit',
      habitId,
      value,
      notes,
      timestamp: Date.now()
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Intelligence Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <Brain className="h-6 w-6 mr-2" />
              AI Intelligence Hub
              <Badge variant="secondary" className="ml-2">
                {metrics?.overallScore}% Overall
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                Updated {formatTime(lastUpdated)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMetrics}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {metrics && (
          <CardContent>
            {/* Main metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(metrics.learningProgress)}`}>
                  {metrics.learningProgress}%
                </div>
                <div className="text-sm text-muted-foreground">Learning</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(metrics.habitSuccess)}`}>
                  {metrics.habitSuccess}%
                </div>
                <div className="text-sm text-muted-foreground">Habits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.knowledgeBaseEntries}
                </div>
                <div className="text-sm text-muted-foreground">Knowledge</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(metrics.suggestionsAccuracy)}`}>
                  {metrics.suggestionsAccuracy}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            {/* Weekly progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Weekly Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Productivity</span>
                      <span>{metrics.weeklyProgress.productivity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics.weeklyProgress.productivity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Learning</span>
                      <span>{metrics.weeklyProgress.learning}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics.weeklyProgress.learning}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Habits</span>
                      <span>{metrics.weeklyProgress.habits}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${metrics.weeklyProgress.habits}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Knowledge</span>
                      <span>{metrics.weeklyProgress.knowledge}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${metrics.weeklyProgress.knowledge}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent achievements */}
            {metrics.achievements.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recent Achievements</h4>
                <div className="flex space-x-2">
                  {metrics.achievements.slice(0, 3).map((achievement) => (
                    <Badge
                      key={achievement.id}
                      variant="outline"
                      className={`${getScoreBgColor(85)} flex items-center space-x-1`}
                    >
                      <span>{achievement.icon}</span>
                      <span className="text-xs">{achievement.title}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Knowledge</span>
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Habits</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-4">
          <PredictiveSuggestions
            onExecuteSuggestion={handleExecuteSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onProvideFeedback={handleProvideFeedback}
          />
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4">
          <PersonalKnowledgeBase
            onCreateEntry={handleCreateEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </TabsContent>

        <TabsContent value="habits" className="mt-4">
          <HabitTracking
            onTrackHabit={handleTrackHabit}
            onUpdateHabit={(id, updates) => console.log('Update habit:', { id, updates })}
            onCreateHabit={(habit) => console.log('Create habit:', habit)}
            onDeleteHabit={(id) => console.log('Delete habit:', id)}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                AI Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* AI System Performance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">System Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          Learning Engine
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Pattern Recognition</span>
                            <span className="text-green-600">92%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Personalization Accuracy</span>
                            <span className="text-blue-600">87%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Skill Progress Tracking</span>
                            <span className="text-purple-600">78%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Prediction System
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Suggestion Accuracy</span>
                            <span className="text-green-600">{metrics?.suggestionsAccuracy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>User Satisfaction</span>
                            <span className="text-blue-600">89%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Response Time</span>
                            <span className="text-green-600">1.2s</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Knowledge Base
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Entries</span>
                            <span>{metrics?.knowledgeBaseEntries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Search Success Rate</span>
                            <span className="text-green-600">94%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>User Engagement</span>
                            <span className="text-blue-600">76%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          Habit Tracking
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Completion Rate</span>
                            <span className="text-green-600">{metrics?.habitSuccess}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Streak Success</span>
                            <span className="text-blue-600">82%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Goal Achievement</span>
                            <span className="text-purple-600">71%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent AI Activity</h3>
                  <div className="space-y-2">
                    {[
                      {
                        icon: Lightbulb,
                        title: 'Smart Commit Suggestion',
                        description: 'Suggested automated git commit workflow based on recent changes',
                        time: '2 hours ago',
                        type: 'suggestion'
                      },
                      {
                        icon: BookOpen,
                        title: 'Knowledge Entry Created',
                        description: 'Added "React Hooks Best Practices" to knowledge base',
                        time: '4 hours ago',
                        type: 'knowledge'
                      },
                      {
                        icon: Target,
                        title: 'Habit Completed',
                        description: 'Daily Code Review habit completed with 100% success',
                        time: '6 hours ago',
                        type: 'habit'
                      },
                      {
                        icon: Brain,
                        title: 'Learning Pattern Detected',
                        description: 'Identified evening as optimal learning time',
                        time: '1 day ago',
                        type: 'learning'
                      }
                    ].map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{activity.title}</div>
                            <div className="text-xs text-muted-foreground">{activity.description}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}