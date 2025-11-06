/**
 * Workflow Builder Component
 * Interactive drag-and-drop interface for creating workflows
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Play, Save, Plus, Trash2, Settings, GitBranch, Clock, FileText, Zap } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  description: string;
  dependsOn?: string[];
}

interface WorkflowBuilderProps {
  onSave?: (workflow: any) => void;
  onExecute?: (workflowId: string) => void;
}

const AVAILABLE_AGENTS = [
  { id: 'code-reviewer', name: 'Code Reviewer', category: 'development', color: 'blue' },
  { id: 'python-data-scientist', name: 'Python Data Scientist', category: 'python', color: 'green' },
  { id: 'python-backend-developer', name: 'Python Backend Dev', category: 'python', color: 'green' },
  { id: 'test-writer', name: 'Test Writer', category: 'testing', color: 'purple' },
  { id: 'security-auditor', name: 'Security Auditor', category: 'security', color: 'red' },
  { id: 'performance-optimizer', name: 'Performance Optimizer', category: 'optimization', color: 'orange' },
  { id: 'documenter', name: 'Documenter', category: 'documentation', color: 'gray' },
  { id: 'git-specialist', name: 'Git Specialist', category: 'development', color: 'blue' },
  { id: 'debugger', name: 'Debugger', category: 'development', color: 'yellow' },
];

const WORKFLOW_TEMPLATES = [
  {
    id: 'smart-commit',
    name: 'Smart Git Commit',
    description: 'Stage, review, and commit changes automatically',
    icon: GitBranch,
    steps: [
      { agent: 'git-specialist', name: 'Stage Changes' },
      { agent: 'code-reviewer', name: 'Review Changes' },
      { agent: 'documenter', name: 'Generate Message' },
      { agent: 'git-specialist', name: 'Create Commit' },
    ],
  },
  {
    id: 'python-analysis',
    name: 'Python Data Analysis',
    description: 'Complete data analysis pipeline',
    icon: FileText,
    steps: [
      { agent: 'python-data-scientist', name: 'Load Data' },
      { agent: 'python-data-scientist', name: 'Analyze' },
      { agent: 'python-data-scientist', name: 'Visualize' },
      { agent: 'documenter', name: 'Generate Report' },
    ],
  },
  {
    id: 'test-automation',
    name: 'Test Automation',
    description: 'Generate and run comprehensive tests',
    icon: Zap,
    steps: [
      { agent: 'test-writer', name: 'Generate Tests' },
      { agent: 'test-writer', name: 'Run Tests' },
      { agent: 'validator', name: 'Validate Results' },
    ],
  },
];

export function WorkflowBuilder({ onSave, onExecute }: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const addStep = useCallback(() => {
    if (!selectedAgent) return;

    const agent = AVAILABLE_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: `${agent.name} Step`,
      agent: selectedAgent,
      description: `Execute ${agent.name} task`,
    };

    setSteps(prev => [...prev, newStep]);
    setSelectedAgent('');
  }, [selectedAgent]);

  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => {
      const newSteps = prev.filter(step => step.id !== stepId);
      // Remove dependencies
      return newSteps.map(step => ({
        ...step,
        dependsOn: step.dependsOn?.filter(dep => dep !== stepId),
      }));
    });
  }, []);

  const addDependency = useCallback((stepId: string, dependsOn: string) => {
    if (stepId === dependsOn) return;

    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const deps = new Set(step.dependsOn || []);
        deps.add(dependsOn);
        return { ...step, dependsOn: Array.from(deps) };
      }
      return step;
    }));
  }, []);

  const removeDependency = useCallback((stepId: string, dependsOn: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          dependsOn: step.dependsOn?.filter(dep => dep !== dependsOn),
        };
      }
      return step;
    }));
  }, []);

  const applyTemplate = useCallback((template: any) => {
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setSteps(template.steps.map((step: any, index: number) => ({
      id: `step-${Date.now()}-${index}`,
      name: step.name,
      agent: step.agent,
      description: step.name,
      dependsOn: index > 0 ? [`step-${Date.now()}-${index - 1}`] : undefined,
    })));
    setShowTemplates(false);
  }, []);

  const saveWorkflow = useCallback(() => {
    if (!workflowName.trim()) return;

    const workflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      steps: steps.map((step, index) => ({
        ...step,
        order: index,
      })),
      trigger: { type: 'manual' },
    };

    onSave?.(workflow);
  }, [workflowName, workflowDescription, steps, onSave]);

  const handleDragStart = useCallback((stepId: string) => {
    setDraggedStep(stepId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStep || draggedStep === targetStepId) return;

    addDependency(targetStepId, draggedStep);
    setDraggedStep(null);
  }, [draggedStep, addDependency]);

  const getAgentColor = (agentId: string) => {
    const agent = AVAILABLE_AGENTS.find(a => a.id === agentId);
    return agent?.color || 'gray';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      development: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      testing: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      optimization: 'bg-orange-100 text-orange-800',
      documentation: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-full">
      {/* Main Builder Area */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <Input
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-semibold mb-2"
          />
          <Input
            placeholder="Workflow Description"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
          />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const agent = AVAILABLE_AGENTS.find(a => a.id === step.agent);
            const hasDependencies = step.dependsOn && step.dependsOn.length > 0;

            return (
              <div key={step.id} className="relative">
                {/* Dependency Lines */}
                {hasDependencies && step.dependsOn!.map((depId, depIndex) => (
                  <div
                    key={depId}
                    className="absolute left-4 top-0 w-0.5 h-4 bg-blue-300"
                    style={{ top: '-16px' }}
                  />
                ))}

                <Card
                  draggable
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, step.id)}
                  className="cursor-move hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${getAgentColor(step.agent)}-500`} />
                        <CardTitle className="text-sm">{step.name}</CardTitle>
                        <Badge variant="outline" className={getCategoryColor(agent?.category || '')}>
                          {agent?.name}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {hasDependencies && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Depends on:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.dependsOn!.map(depId => {
                            const depStep = steps.find(s => s.id === depId);
                            const depAgent = AVAILABLE_AGENTS.find(a => a.id === depStep?.agent);
                            return (
                              <Badge
                                key={depId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {depAgent?.name || depStep?.name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDependency(step.id, depId)}
                                  className="h-3 w-3 p-0 ml-1"
                                >
                                  ×
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {steps.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center h-24">
                <p className="text-muted-foreground">Add steps to build your workflow</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-6">
          <Button onClick={saveWorkflow} disabled={!workflowName.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l p-4 space-y-4">
        {/* Add Step */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Select an agent...</option>
              {AVAILABLE_AGENTS.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <Button onClick={addStep} disabled={!selectedAgent} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        {/* Workflow Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workflow Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Steps:</span>
              <span>{steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Duration:</span>
              <span>{steps.length * 2} min</span>
            </div>
            <div className="flex justify-between">
              <span>Dependencies:</span>
              <span>{steps.reduce((acc, step) => acc + (step.dependsOn?.length || 0), 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Select an agent and click "Add Step"</p>
            <p>• Drag and drop steps to create dependencies</p>
            <p>• Steps execute in dependency order</p>
            <p>• Save workflow to reuse later</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-2/3 max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOW_TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.steps.map((step: any, index: number) => {
                            const agent = AVAILABLE_AGENTS.find(a => a.id === step.agent);
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {agent?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowTemplates(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}