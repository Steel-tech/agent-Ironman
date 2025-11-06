/**
 * Workflow Monitor Component
 * Real-time monitoring of workflow execution with progress tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Bot,
  ChevronRight,
  ChevronDown,
  Activity,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  output?: any;
  error?: string;
  tokensUsed?: number;
  retryCount?: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: WorkflowStep[];
  progress: number;
  currentStep?: string;
  error?: string;
}

interface WorkflowMonitorProps {
  execution?: WorkflowExecution;
  onCancel?: (executionId: string) => void;
  onRetry?: (executionId: string) => void;
}

const STEP_STATUS_ICONS = {
  pending: Clock,
  running: Activity,
  completed: CheckCircle,
  failed: XCircle,
  skipped: Pause,
};

const STEP_STATUS_COLORS = {
  pending: 'text-gray-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  skipped: 'text-gray-400',
};

const AGENT_COLORS: Record<string, string> = {
  'code-reviewer': 'bg-blue-100 text-blue-800',
  'python-data-scientist': 'bg-green-100 text-green-800',
  'python-backend-developer': 'bg-green-100 text-green-800',
  'test-writer': 'bg-purple-100 text-purple-800',
  'security-auditor': 'bg-red-100 text-red-800',
  'performance-optimizer': 'bg-orange-100 text-orange-800',
  'documenter': 'bg-gray-100 text-gray-800',
  'git-specialist': 'bg-blue-100 text-blue-800',
  'debugger': 'bg-yellow-100 text-yellow-800',
};

export function WorkflowMonitor({ execution, onCancel, onRetry }: WorkflowMonitorProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to current step
  useEffect(() => {
    if (autoScroll && execution?.currentStep) {
      const element = document.getElementById(`step-${execution.currentStep}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [execution?.currentStep, autoScroll]);

  if (!execution) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No workflow execution to monitor</p>
        </CardContent>
      </Card>
    );
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      running: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-500',
      timeout: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getOverallProgress = () => {
    const completed = execution.steps.filter(step => step.status === 'completed').length;
    const total = execution.steps.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getCurrentStepIndex = () => {
    if (!execution.currentStep) return -1;
    return execution.steps.findIndex(step => step.id === execution.currentStep);
  };

  const isStepExpanded = (stepId: string) => expandedSteps.has(stepId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{execution.workflowName}</CardTitle>
              <p className="text-sm text-muted-foreground">Execution ID: {execution.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(execution.status)}>
                {execution.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDuration(execution.duration || Date.now() - execution.startTime)}
              </span>
              {execution.status === 'running' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel?.(execution.id)}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
              {execution.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry?.(execution.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{execution.steps.filter(s => s.status === 'completed').length}/{execution.steps.length} steps</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started: {new Date(execution.startTime).toLocaleTimeString()}</span>
              {execution.endTime && (
                <span>Ended: {new Date(execution.endTime).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Workflow Steps</CardTitle>
            <div className="flex items-center space-x-2">
              <label className="text-sm">Auto-scroll</label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {execution.steps.map((step, index) => {
                const isCurrentStep = step.id === execution.currentStep;
                const StepIcon = STEP_STATUS_ICONS[step.status];
                const isExpanded = isStepExpanded(step.id);

                return (
                  <div
                    key={step.id}
                    id={`step-${step.id}`}
                    className={`border rounded-lg p-3 transition-all ${
                      isCurrentStep ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <StepIcon className={`h-5 w-5 mt-0.5 ${STEP_STATUS_COLORS[step.status]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{step.name}</h4>
                            <Badge variant="secondary" className={AGENT_COLORS[step.agent] || 'bg-gray-100'}>
                              <Bot className="h-3 w-3 mr-1" />
                              {step.agent}
                            </Badge>
                            {step.retryCount && step.retryCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Retry {step.retryCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            {step.startTime && (
                              <span>Started: {new Date(step.startTime).toLocaleTimeString()}</span>
                            )}
                            {step.duration && (
                              <span>Duration: {formatDuration(step.duration)}</span>
                            )}
                            {step.tokensUsed && (
                              <span>Tokens: {step.tokensUsed.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {step.status === 'running' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        {(step.output || step.error) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStepExpansion(step.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        {step.output && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium mb-1">Output</h5>
                            <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                              {typeof step.output === 'string' ? (
                                step.output
                              ) : (
                                <pre>{JSON.stringify(step.output, null, 2)}</pre>
                              )}
                            </div>
                          </div>
                        )}
                        {step.error && (
                          <div>
                            <h5 className="text-sm font-medium mb-1 text-red-600">Error</h5>
                            <div className="bg-red-50 p-2 rounded text-xs font-mono text-red-700">
                              {step.error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary */}
      {execution.status !== 'running' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {execution.steps.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {execution.steps.filter(s => s.status === 'failed').length}
                </div>
                <div className="text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {execution.steps.reduce((sum, step) => sum + (step.tokensUsed || 0), 0).toLocaleString()}
                </div>
                <div className="text-muted-foreground">Tokens Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatDuration(execution.duration || 0)}
                </div>
                <div className="text-muted-foreground">Total Duration</div>
              </div>
            </div>
            {execution.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="text-sm font-medium text-red-800 mb-1">Execution Error</h5>
                <p className="text-sm text-red-700">{execution.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}