/**
 * Agent Ironman - Webhook System
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
 * Webhook System - Real-time event handling from external services
 */

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  source: 'github' | 'gitlab' | 'vercel' | 'railway' | 'discord' | 'slack' | 'custom';
  headers?: Record<string, string>;
  filters?: {
    branches?: string[];
    paths?: string[];
    tags?: string[];
  };
  actions?: {
    triggerWorkflows?: string[];
    sendNotifications?: boolean;
    createIssues?: boolean;
  };
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface WebhookEvent {
  id: string;
  source: string;
  type: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: number;
  signature?: string;
  processed: boolean;
  error?: string;
  result?: any;
}

export interface WebhookHandler {
  canHandle(event: WebhookEvent): boolean;
  handle(event: WebhookEvent): Promise<any>;
  getSupportedEvents(source: string): string[];
}

/**
 * GitHub Webhook Handler
 */
export class GitHubWebhookHandler implements WebhookHandler {
  getSupportedEvents(source: string): string[] {
    if (source !== 'github') return [];

    return [
      'push',
      'pull_request',
      'issues',
      'release',
      'create',
      'delete',
      'deployment',
      'deployment_status',
      'fork',
      'gollum',
      'member',
      'membership',
      'milestone',
      'organization',
      'page_build',
      'ping',
      'public',
      'repository',
      'release',
      'status',
      'team_add',
      'watch',
    ];
  }

  canHandle(event: WebhookEvent): boolean {
    return event.source === 'github' && this.getSupportedEvents('github').includes(event.type);
  }

  async handle(event: WebhookEvent): Promise<any> {
    const { type, payload } = event;

    switch (type) {
      case 'push':
        return this.handlePush(payload);
      case 'pull_request':
        return this.handlePullRequest(payload);
      case 'issues':
        return this.handleIssues(payload);
      case 'release':
        return this.handleRelease(payload);
      case 'deployment':
        return this.handleDeployment(payload);
      default:
        return { handled: false, message: `Event type ${type} not handled` };
    }
  }

  private async handlePush(payload: any): Promise<any> {
    return {
      handled: true,
      type: 'push',
      repository: payload.repository?.name,
      branch: payload.ref?.replace('refs/heads/', ''),
      commit: payload.head_commit?.id,
      message: payload.head_commit?.message,
      author: payload.head_commit?.author?.name,
      added: payload.head_commit?.added || [],
      removed: payload.head_commit?.removed || [],
      modified: payload.head_commit?.modified || [],
      totalCommits: payload.total_commits || 1,
      timestamp: Date.now(),
    };
  }

  private async handlePullRequest(payload: any): Promise<any> {
    return {
      handled: true,
      type: 'pull_request',
      action: payload.action,
      repository: payload.repository?.name,
      number: payload.pull_request?.number,
      title: payload.pull_request?.title,
      body: payload.pull_request?.body,
      state: payload.pull_request?.state,
      author: payload.pull_request?.user?.login,
      baseBranch: payload.pull_request?.base?.ref,
      headBranch: payload.pull_request?.head?.ref,
      additions: payload.pull_request?.additions,
      deletions: payload.pull_request?.deletions,
      changedFiles: payload.pull_request?.changed_files,
      timestamp: Date.now(),
    };
  }

  private async handleIssues(payload: any): Promise<any> {
    return {
      handled: true,
      type: 'issue',
      action: payload.action,
      repository: payload.repository?.name,
      number: payload.issue?.number,
      title: payload.issue?.title,
      body: payload.issue?.body,
      state: payload.issue?.state,
      author: payload.issue?.user?.login,
      labels: payload.issue?.labels?.map((label: any) => label.name) || [],
      assignees: payload.issue?.assignees?.map((assignee: any) => assignee.login) || [],
      timestamp: Date.now(),
    };
  }

  private async handleRelease(payload: any): Promise<any> {
    return {
      handled: true,
      type: 'release',
      action: payload.action,
      repository: payload.repository?.name,
      tagName: payload.release?.tag_name,
      name: payload.release?.name,
      body: payload.release?.body,
      prerelease: payload.release?.prerelease,
      draft: payload.release?.draft,
      author: payload.release?.author?.login,
      assets: payload.release?.assets?.length || 0,
      timestamp: Date.now(),
    };
  }

  private async handleDeployment(payload: any): Promise<any> {
    return {
      handled: true,
      type: 'deployment',
      repository: payload.repository?.name,
      deployment: payload.deployment?.id,
      environment: payload.deployment?.environment,
      ref: payload.deployment?.ref,
      description: payload.deployment?.description,
      creator: payload.deployment?.creator?.login,
      timestamp: Date.now(),
    };
  }
}

/**
 * Vercel Webhook Handler
 */
export class VercelWebhookHandler implements WebhookHandler {
  getSupportedEvents(source: string): string[] {
    if (source !== 'vercel') return [];

    return [
      'deployment.created',
      'deployment.ready',
      'deployment.error',
      'deployment.canceled',
      'deployment.succeeded',
      'deployment.building',
      'deployment.queued',
    ];
  }

  canHandle(event: WebhookEvent): boolean {
    return event.source === 'vercel' && this.getSupportedEvents('vercel').includes(event.type);
  }

  async handle(event: WebhookEvent): Promise<any> {
    const { type, payload } = event;

    return {
      handled: true,
      type: 'vercel_deployment',
      action: type.split('.')[1],
      deploymentId: payload.deployment?.id,
      deploymentUrl: payload.deployment?.url,
      state: payload.deployment?.state,
      target: payload.deployment?.target,
      project: payload.deployment?.project,
      createdAt: payload.deployment?.createdAt,
      readyAt: payload.deployment?.readyAt,
      error: payload.deployment?.error,
      timestamp: Date.now(),
    };
  }
}

/**
 * Webhook Manager
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private handlers: Map<string, WebhookHandler> = new Map();
  private events: WebhookEvent[] = [];
  private sessionId: string;
  private storagePath: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.storagePath = `/tmp/agent-ironman-${sessionId}/webhooks`;
    this.initializeHandlers();
    this.loadWebhooks();
  }

  private initializeHandlers(): void {
    this.handlers.set('github', new GitHubWebhookHandler());
    this.handlers.set('vercel', new VercelWebhookHandler());
  }

  private async loadWebhooks(): Promise<void> {
    // Load webhooks from storage
    // For now, initialize empty webhooks
  }

  private async saveWebhooks(): Promise<void> {
    // Save webhooks to storage
    // For now, just log
    console.log(`Saving ${this.webhooks.size} webhooks for session ${this.sessionId}`);
  }

  async createWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'triggerCount'>): Promise<string> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhook: WebhookConfig = {
      id,
      createdAt: Date.now(),
      triggerCount: 0,
      ...config,
    };

    this.webhooks.set(id, webhook);
    await this.saveWebhooks();

    return id;
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<boolean> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    this.webhooks.set(id, { ...webhook, ...updates });
    await this.saveWebhooks();

    return true;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const deleted = this.webhooks.delete(id);
    if (deleted) {
      await this.saveWebhooks();
    }
    return deleted;
  }

  getWebhooks(source?: string): WebhookConfig[] {
    const webhooks = Array.from(this.webhooks.values());
    return source ? webhooks.filter(w => w.source === source) : webhooks;
  }

  getWebhook(id: string): WebhookConfig | null {
    return this.webhooks.get(id) || null;
  }

  async processWebhook(
    source: string,
    type: string,
    payload: any,
    headers: Record<string, string> = {}
  ): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      type,
      payload,
      headers,
      timestamp: Date.now(),
      processed: false,
    };

    // Find matching webhooks
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook =>
      webhook.active &&
      webhook.source === source &&
      webhook.events.includes(type) &&
      this.matchesFilters(webhook, payload)
    );

    if (matchingWebhooks.length === 0) {
      event.processed = true;
      event.error = 'No matching webhooks found';
      this.events.push(event);
      return event;
    }

    // Process with first matching handler
    const handler = this.handlers.get(source);
    if (handler && handler.canHandle(event)) {
      try {
        const result = await handler.handle(event);
        event.result = result;
        event.processed = true;

        // Update webhook trigger counts
        matchingWebhooks.forEach(webhook => {
          webhook.triggerCount++;
          webhook.lastTriggered = Date.now();
        });

        await this.saveWebhooks();
      } catch (error) {
        event.error = error instanceof Error ? error.message : 'Unknown error';
        event.processed = true;
      }
    } else {
      event.error = `No handler found for ${source}:${type}`;
      event.processed = true;
    }

    this.events.push(event);
    return event;
  }

  private matchesFilters(webhook: WebhookConfig, payload: any): boolean {
    if (!webhook.filters) return true;

    const { branches, paths, tags } = webhook.filters;

    // Check branch filter (for GitHub events)
    if (branches && branches.length > 0) {
      const branch = payload.ref?.replace('refs/heads/', '') ||
                   payload.base?.ref ||
                   payload.pull_request?.base?.ref;

      if (!branch || !branches.some(b => branch.includes(b) || b.includes(branch))) {
        return false;
      }
    }

    // Check path filter (for GitHub push events)
    if (paths && paths.length > 0 && payload.head_commit) {
      const changedFiles = [
        ...(payload.head_commit.added || []),
        ...(payload.head_commit.modified || []),
        ...(payload.head_commit.removed || []),
      ];

      const matchesPath = changedFiles.some(file =>
        paths.some(path => file.includes(path) || path.includes(file))
      );

      if (!matchesPath) {
        return false;
      }
    }

    // Check tag filter (for GitHub release events)
    if (tags && tags.length > 0 && payload.ref) {
      const tag = payload.ref.replace('refs/tags/', '');
      if (!tags.some(t => tag.includes(t) || t.includes(tag))) {
        return false;
      }
    }

    return true;
  }

  getEvents(limit: number = 50): WebhookEvent[] {
    return this.events.slice(-limit).reverse();
  }

  getEvent(id: string): WebhookEvent | null {
    return this.events.find(event => event.id === id) || null;
  }

  async triggerWorkflow(event: WebhookEvent, workflowId: string): Promise<any> {
    // This would integrate with the workflow engine
    // For now, just return the event result
    return {
      workflowId,
      triggeredBy: event.id,
      timestamp: Date.now(),
      result: event.result,
    };
  }

  generateWebhookUrl(webhookId: string): string {
    // This should generate a public URL that points to your server
    // For development, use localhost
    return `http://localhost:3003/webhooks/${webhookId}`;
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Verify webhook signature using HMAC-SHA256
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  getWebhookStats(): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    eventsBySource: Record<string, number>;
    recentActivity: Array<{ timestamp: number; source: string; type: string }>;
  } {
    const webhooks = Array.from(this.webhooks.values());
    const activeWebhooks = webhooks.filter(w => w.active);
    const eventsBySource: Record<string, number> = {};
    const recentActivity = this.events
      .slice(-10)
      .map(event => ({
        timestamp: event.timestamp,
        source: event.source,
        type: event.type,
      }));

    this.events.forEach(event => {
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
    });

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: activeWebhooks.length,
      totalEvents: this.events.length,
      eventsBySource,
      recentActivity,
    };
  }

  async cleanupOldEvents(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAge;
    const initialCount = this.events.length;

    this.events = this.events.filter(event => event.timestamp > cutoff);

    return initialCount - this.events.length;
  }
}