/**
 * Predictive Suggestions Component
 * AI-powered suggestions based on user patterns and context
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Lightbulb,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  SkipForward,
  Settings,
  Brain,
  Target,
  Activity
} from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'workflow' | 'action' | 'learning' | 'optimization' | 'warning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
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
    frequency?: number;
    successRate?: number;
  };
  action?: {
    type: 'workflow' | 'command' | 'link' | 'custom';
    payload: any;
    autoExecute?: boolean;
  };
}

interface PredictiveSuggestionsProps {
  onExecuteSuggestion?: (suggestionId: string, action: any) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  onProvideFeedback?: (suggestionId: string, accepted: boolean, feedback?: string) => void;
}

const PRIORITY_COLORS = {
  critical: 'bg-red-500 dark:bg-red-600 text-white',
  high: 'bg-orange-500 dark:bg-orange-600 text-white',
  medium: 'bg-blue-500 dark:bg-blue-600 text-white',
  low: 'bg-gray-500 dark:bg-gray-600 text-white'
};

const TYPE_ICONS = {
  workflow: Settings,
  action: Play,
  learning: Brain,
  optimization: TrendingUp,
  warning: AlertTriangle
};

const TYPE_COLORS = {
  workflow: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  action: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  learning: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
  optimization: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
  warning: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
};

const SOURCE_ICONS = {
  pattern: Activity,
  analytics: TrendingUp,
  learning: Brain,
  external: Settings
};

export function PredictiveSuggestions({
  onExecuteSuggestion,
  onDismissSuggestion,
  onProvideFeedback
}: PredictiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: 'all',
    priority: 'all',
    category: 'all'
  });

  useEffect(() => {
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API
      const mockSuggestions: Suggestion[] = [
        {
          id: '1',
          type: 'workflow',
          priority: 'high',
          confidence: 0.85,
          title: 'Run Code Review Workflow',
          description: 'You\'ve made several code changes recently, consider running a comprehensive review',
          reasoning: 'Pattern of multiple code changes detected in the last hour',
          expectedBenefit: 'Improve code quality and catch issues early',
          estimatedTime: 15,
          metadata: {
            category: 'quality',
            source: 'pattern',
            frequency: 0.8,
            successRate: 0.9
          },
          action: {
            type: 'workflow',
            payload: { workflowId: 'code-review-analysis' }
          }
        },
        {
          id: '2',
          type: 'optimization',
          priority: 'medium',
          confidence: 0.75,
          title: 'Optimize Development Environment',
          description: 'Your productivity score suggests there are opportunities to optimize your workflow',
          reasoning: 'Based on recent productivity patterns and current metrics',
          expectedBenefit: 'Increase daily productivity by 20-30%',
          estimatedTime: 10,
          metadata: {
            category: 'productivity',
            source: 'analytics'
          }
        },
        {
          id: '3',
          type: 'learning',
          priority: 'low',
          confidence: 0.65,
          title: 'Learn React Best Practices',
          description: 'Focus on improving your React component skills',
          reasoning: 'Current skill level in React is intermediate',
          expectedBenefit: 'Enhance capability in React tasks',
          estimatedTime: 30,
          metadata: {
            category: 'learning',
            source: 'learning'
          },
          action: {
            type: 'workflow',
            payload: {
              workflowId: 'skill-improvement',
              parameters: { skill: 'react' }
            }
          }
        },
        {
          id: '4',
          type: 'warning',
          priority: 'critical',
          confidence: 0.9,
          title: 'Take a Break - Risk of Burnout',
          description: 'You\'ve been working continuously for several hours',
          reasoning: 'Recent activity duration: 4.5 hours',
          expectedBenefit: 'Maintain long-term productivity and well-being',
          estimatedTime: 15,
          metadata: {
            category: 'wellbeing',
            source: 'analytics'
          }
        }
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSuggestion = (suggestion: Suggestion) => {
    if (suggestion.action) {
      onExecuteSuggestion?.(suggestion.id, suggestion.action);
    }
    onProvideFeedback?.(suggestion.id, true);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    onDismissSuggestion?.(suggestionId);
    onProvideFeedback?.(suggestionId, false);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter.type !== 'all' && suggestion.type !== filter.type) return false;
    if (filter.priority !== 'all' && suggestion.priority !== filter.priority) return false;
    if (filter.category !== 'all' && suggestion.metadata.category !== filter.category) return false;
    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI Suggestions
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
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              AI Suggestions
              <Badge variant="secondary" className="ml-2">
                {filteredSuggestions.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                className="px-2 py-1 text-sm border rounded"
              >
                <option value="all">All Types</option>
                <option value="workflow">Workflows</option>
                <option value="action">Actions</option>
                <option value="learning">Learning</option>
                <option value="optimization">Optimization</option>
                <option value="warning">Warnings</option>
              </select>
              <select
                value={filter.priority}
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                className="px-2 py-1 text-sm border rounded"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Suggestions list */}
      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">No suggestions available</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => {
              const TypeIcon = TYPE_ICONS[suggestion.type];
              const SourceIcon = SOURCE_ICONS[suggestion.metadata.source];
              const isExpanded = selectedSuggestion === suggestion.id;

              return (
                <Card
                  key={suggestion.id}
                  className={`transition-all hover:shadow-md ${
                    suggestion.priority === 'critical' ? 'border-red-200' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <Badge className={PRIORITY_COLORS[suggestion.priority]}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className={TYPE_COLORS[suggestion.type]}>
                              {suggestion.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(suggestion.estimatedTime)}</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${getConfidenceColor(suggestion.confidence)}`}>
                              <Zap className="h-3 w-3" />
                              <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <SourceIcon className="h-3 w-3" />
                              <span>{suggestion.metadata.source}</span>
                            </div>
                            {suggestion.metadata.successRate && (
                              <div className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{Math.round(suggestion.metadata.successRate * 100)}% success</span>
                              </div>
                            )}
                          </div>

                          {/* Reasoning */}
                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2">
                            <div className="flex items-center space-x-1 mb-1">
                              <Brain className="h-3 w-3" />
                              <span className="font-medium">Reasoning:</span>
                            </div>
                            {suggestion.reasoning}
                          </div>

                          {/* Expected benefit */}
                          <div className="flex items-center space-x-1 text-xs text-green-700">
                            <TrendingUp className="h-3 w-3" />
                            <span>{suggestion.expectedBenefit}</span>
                          </div>

                          {/* Tags and patterns */}
                          {(suggestion.relatedPatterns && suggestion.relatedPatterns.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {suggestion.relatedPatterns.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSuggestion(isExpanded ? null : suggestion.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissSuggestion(suggestion.id)}
                          className="h-8 w-8 p-0"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteSuggestion(suggestion)}
                          className="h-8"
                          disabled={!suggestion.action}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded details */}
                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      <div className="space-y-3">
                        {/* Prerequisites */}
                        {suggestion.prerequisites && suggestion.prerequisites.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-1">Prerequisites:</h5>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {suggestion.prerequisites.map((prereq, index) => (
                                <li key={index}>{prereq}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action details */}
                        {suggestion.action && (
                          <div>
                            <h5 className="text-sm font-medium mb-1">Action Details:</h5>
                            <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                              <div>Type: {suggestion.action.type}</div>
                              <div>Payload: {JSON.stringify(suggestion.action.payload, null, 2)}</div>
                              {suggestion.action.autoExecute && (
                                <div className="text-blue-600">Auto-execute: enabled</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional metadata */}
                        <div>
                          <h5 className="text-sm font-medium mb-1">Metadata:</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Category: {suggestion.metadata.category}</div>
                            <div>Source: {suggestion.metadata.source}</div>
                            {suggestion.metadata.frequency && (
                              <div>Frequency: {Math.round(suggestion.metadata.frequency * 100)}%</div>
                            )}
                            {suggestion.metadata.successRate && (
                              <div>Success Rate: {Math.round(suggestion.metadata.successRate * 100)}%</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-3 w-3" />
              <span>Suggestions based on your patterns and current context</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadSuggestions}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}