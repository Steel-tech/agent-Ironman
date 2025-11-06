/**
 * Workflow Suggestion Component
 * AI-powered workflow recommendations based on context and patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Zap,
  Clock,
  TrendingUp,
  GitBranch,
  FileText,
  Shield,
  Settings,
  Lightbulb,
  Play,
  X,
} from 'lucide-react';

interface WorkflowSuggestion {
  workflow: {
    id: string;
    name: string;
    description: string;
    category: string;
    estimatedDuration: number;
    successRate?: number;
    tags: string[];
  };
  score: number;
  reason: string;
  context?: {
    fileChanged?: string;
    gitEvent?: string;
    conversationContext?: string;
  };
}

interface WorkflowSuggestionProps {
  suggestions: WorkflowSuggestion[];
  onExecuteWorkflow?: (workflowId: string) => void;
  onDismiss?: (suggestionId: string) => void;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  development: Settings,
  deployment: TrendingUp,
  testing: Shield,
  maintenance: Clock,
  analysis: FileText,
  custom: Zap,
};

const CATEGORY_COLORS: Record<string, string> = {
  development: 'bg-blue-100 text-blue-800',
  deployment: 'bg-green-100 text-green-800',
  testing: 'bg-purple-100 text-purple-800',
  maintenance: 'bg-orange-100 text-orange-800',
  analysis: 'bg-cyan-100 text-cyan-800',
  custom: 'bg-gray-100 text-gray-800',
};

const REASON_ICONS: Record<string, any> = {
  'File changes detected': FileText,
  'Git event detected': GitBranch,
  'Highly relevant': TrendingUp,
  'Recent patterns': Lightbulb,
  'Scheduled maintenance': Clock,
};

export function WorkflowSuggestion({
  suggestions,
  onExecuteWorkflow,
  onDismiss,
  loading = false,
}: WorkflowSuggestionProps) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const filteredSuggestions = suggestions.filter(
    suggestion => !dismissedSuggestions.has(suggestion.workflow.id)
  );

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    onDismiss?.(suggestionId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Possible Match';
    return 'Low Relevance';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getReasonIcon = (reason: string) => {
    for (const [key, icon] of Object.entries(REASON_ICONS)) {
      if (reason.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return Lightbulb;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI Workflow Suggestions
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

  if (filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI Workflow Suggestions
          </CardTitle>
          <Badge variant="secondary">
            {filteredSuggestions.length} suggestions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => {
              const workflow = suggestion.workflow;
              const CategoryIcon = CATEGORY_ICONS[workflow.category] || Settings;
              const ReasonIcon = getReasonIcon(suggestion.reason);

              return (
                <div
                  key={workflow.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base mb-1">{workflow.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>

                        {/* Metadata */}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(workflow.estimatedDuration)}</span>
                          </div>
                          {workflow.successRate && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{workflow.successRate}% success</span>
                            </div>
                          )}
                          <div className={`flex items-center space-x-1 ${getScoreColor(suggestion.score)}`}>
                            <Zap className="h-3 w-3" />
                            <span>{getScoreLabel(suggestion.score)}</span>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="flex items-center space-x-2 mb-2">
                          <ReasonIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-700">{suggestion.reason}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={CATEGORY_COLORS[workflow.category]}>
                            {workflow.category}
                          </Badge>
                          {workflow.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {workflow.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workflow.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        size="sm"
                        onClick={() => onExecuteWorkflow?.(workflow.id)}
                        className="h-8"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(workflow.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Context Information */}
                  {suggestion.context && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {suggestion.context.fileChanged && (
                          <div>
                            <span className="font-medium">File:</span> {suggestion.context.fileChanged}
                          </div>
                        )}
                        {suggestion.context.gitEvent && (
                          <div>
                            <span className="font-medium">Git Event:</span> {suggestion.context.gitEvent}
                          </div>
                        )}
                        {suggestion.context.conversationContext && (
                          <div>
                            <span className="font-medium">Context:</span> {suggestion.context.conversationContext}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-3 w-3" />
            <span>Suggestions based on your patterns and current context</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissedSuggestions(new Set())}
            className="text-xs"
          >
            Show All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}