/**
 * Agent Ironman - Integration Hub
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
 * Integration Hub - Centralized management of all external integrations
 */

import { GitHubIntegration, GitHubConfig } from './github';
import { DeploymentManager, DeploymentConfig } from './deployment';
import { PackageManager } from './packageRegistry';
import { WebhookManager, WebhookConfig } from './webhooks';

export interface IntegrationConnection {
  id: string;
  name: string;
  type: 'github' | 'vercel' | 'railway' | 'npm' | 'pypi' | 'webhook' | 'custom';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  config: any;
  metadata: {
    createdAt: number;
    lastUsed?: number;
    usageCount: number;
    errors: Array<{
      timestamp: number;
      message: string;
      details?: any;
    }>;
  };
  capabilities: string[];
  permissions: string[];
  rateLimit?: {
    requests: number;
    window: number;
    remaining: number;
    resetAt: number;
  };
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action: string;
  message: string;
  timestamp: number;
  details?: any;
}

export interface IntegrationTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

/**
 * Integration Hub - Central management for all external connections
 */
export class IntegrationHub {
  private connections: Map<string, IntegrationConnection> = new Map();
  private events: IntegrationEvent[] = [];
  private managers: {
    github?: GitHubIntegration;
    deployment?: DeploymentManager;
    packages?: PackageManager;
    webhooks?: WebhookManager;
  } = {};
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.initializeManagers();
    this.loadConnections();
  }

  private initializeManagers(): void {
    // Managers will be initialized when connections are added
    this.managers.packages = new PackageManager();
  }

  private async loadConnections(): Promise<void> {
    // Load connections from storage
    // For now, initialize empty connections
  }

  private async saveConnections(): Promise<void> {
    // Save connections to storage
    console.log(`Saving ${this.connections.size} integration connections for session ${this.sessionId}`);
  }

  private logEvent(event: Omit<IntegrationEvent, 'id' | 'timestamp'>): void {
    const fullEvent: IntegrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event,
    };

    this.events.push(fullEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Update connection usage
    const connection = this.connections.get(event.integrationId);
    if (connection) {
      connection.metadata.lastUsed = Date.now();
      connection.metadata.usageCount++;
    }
  }

  // GitHub Integration Methods
  async addGitHubConnection(name: string, config: GitHubConfig): Promise<string> {
    const id = `github_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Test connection
    try {
      const github = new GitHubIntegration(config);
      const repos = await github.getRepositories();

      this.managers.github = github;

      const connection: IntegrationConnection = {
        id,
        name,
        type: 'github',
        provider: 'GitHub',
        status: 'connected',
        config,
        metadata: {
          createdAt: Date.now(),
          usageCount: 1,
          errors: [],
        },
        capabilities: [
          'get-repositories',
          'create-pull-request',
          'merge-pull-request',
          'create-issue',
          'get-commits',
          'auto-review',
          'sync-repository',
        ],
        permissions: [
          'repo',
          'read:org',
          'user:email',
          'read:user',
        ],
      };

      this.connections.set(id, connection);
      await this.saveConnections();

      this.logEvent({
        integrationId: id,
        type: 'success',
        action: 'connection-established',
        message: `Connected to GitHub. Found ${repos.length} repositories.`,
        details: { repositoryCount: repos.length },
      });

      return id;
    } catch (error) {
      const connection: IntegrationConnection = {
        id,
        name,
        type: 'github',
        provider: 'GitHub',
        status: 'error',
        config,
        metadata: {
          createdAt: Date.now(),
          usageCount: 0,
          errors: [{
            timestamp: Date.now(),
            message: error instanceof Error ? error.message : 'Unknown error',
          }],
        },
        capabilities: [],
        permissions: [],
      };

      this.connections.set(id, connection);

      this.logEvent({
        integrationId: id,
        type: 'error',
        action: 'connection-failed',
        message: 'Failed to connect to GitHub',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      throw error;
    }
  }

  async addDeploymentConnection(name: string, config: DeploymentConfig): Promise<string> {
    const id = `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize deployment manager if not already done
    if (!this.managers.deployment) {
      this.managers.deployment = new DeploymentManager();
    }

    this.managers.deployment.addPlatform(config.platform, config);

    const connection: IntegrationConnection = {
      id,
      name,
      type: config.platform === 'vercel' ? 'vercel' : 'railway',
      provider: config.platform === 'vercel' ? 'Vercel' : 'Railway',
      status: 'connected',
      config,
      metadata: {
        createdAt: Date.now(),
        usageCount: 1,
        errors: [],
      },
      capabilities: [
        'get-projects',
        'create-deployment',
        'get-deployments',
        'monitor-deployment',
        'cancel-deployment',
      ],
      permissions: [],
    };

    this.connections.set(id, connection);
    await this.saveConnections();

    this.logEvent({
      integrationId: id,
      type: 'success',
      action: 'connection-established',
      message: `Connected to ${config.platform}.`,
    });

    return id;
  }

  async addWebhookConnection(name: string, config: WebhookConfig): Promise<string> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize webhook manager if not already done
    if (!this.managers.webhooks) {
      this.managers.webhooks = new WebhookManager(this.sessionId);
    }

    const webhookId = await this.managers.webhooks.createWebhook({
      ...config,
      id,
      createdAt: Date.now(),
      triggerCount: 0,
    });

    const connection: IntegrationConnection = {
      id,
      name,
      type: 'webhook',
      provider: config.source.charAt(0).toUpperCase() + config.source.slice(1),
      status: 'connected',
      config: { ...config, webhookId },
      metadata: {
        createdAt: Date.now(),
        usageCount: 1,
        errors: [],
      },
      capabilities: [
        'receive-events',
        'trigger-workflows',
        'filter-events',
        'event-history',
      ],
      permissions: [],
    };

    this.connections.set(id, connection);
    await this.saveConnections();

    this.logEvent({
      integrationId: id,
      type: 'success',
      action: 'webhook-created',
      message: `Created ${config.source} webhook`,
      details: { events: config.events },
    });

    return id;
  }

  // Connection Management
  async testConnection(connectionId: string): Promise<IntegrationTestResult> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const startTime = Date.now();

    try {
      let result: any;

      switch (connection.type) {
        case 'github':
          if (!this.managers.github) throw new Error('GitHub manager not initialized');
          const repos = await this.managers.github.getRepositories();
          result = { repositoryCount: repos.length };
          break;

        case 'vercel':
        case 'railway':
          if (!this.managers.deployment) throw new Error('Deployment manager not initialized');
          const projects = await this.managers.deployment.getProjects(connection.type);
          result = { projectCount: projects.length };
          break;

        case 'webhook':
          result = { status: 'active', webhookUrl: this.managers.webhooks?.generateWebhookUrl(connection.config.webhookId) };
          break;

        default:
          result = { status: 'connected' };
      }

      const responseTime = Date.now() - startTime;

      this.logEvent({
        integrationId: connectionId,
        type: 'success',
        action: 'connection-test',
        message: 'Connection test successful',
        details: { responseTime },
      });

      return {
        success: true,
        responseTime,
        data: result,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logEvent({
        integrationId: connectionId,
        type: 'error',
        action: 'connection-test',
        message: 'Connection test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error', responseTime },
      });

      // Add error to connection metadata
      connection.metadata.errors.push({
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateConnection(connectionId: string, updates: Partial<IntegrationConnection>): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    const updatedConnection = { ...connection, ...updates };
    this.connections.set(connectionId, updatedConnection);
    await this.saveConnections();

    this.logEvent({
      integrationId: connectionId,
      type: 'info',
      action: 'connection-updated',
      message: 'Connection configuration updated',
    });

    return true;
  }

  async removeConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    // Cleanup specific resources
    switch (connection.type) {
      case 'webhook':
        if (this.managers.webhooks && connection.config.webhookId) {
          await this.managers.webhooks.deleteWebhook(connection.config.webhookId);
        }
        break;
    }

    this.connections.delete(connectionId);
    await this.saveConnections();

    this.logEvent({
      integrationId: connectionId,
      type: 'info',
      action: 'connection-removed',
      message: 'Connection removed',
    });

    return true;
  }

  // Connection Retrieval
  getConnections(type?: string): IntegrationConnection[] {
    const connections = Array.from(this.connections.values());
    return type ? connections.filter(c => c.type === type) : connections;
  }

  getConnection(id: string): IntegrationConnection | null {
    return this.connections.get(id) || null;
  }

  // Event Management
  getEvents(limit: number = 50): IntegrationEvent[] {
    return this.events.slice(-limit).reverse();
  }

  getEventsByConnection(connectionId: string, limit: number = 20): IntegrationEvent[] {
    return this.events
      .filter(event => event.integrationId === connectionId)
      .slice(-limit)
      .reverse();
  }

  // Manager Access
  getGitHubManager(): GitHubIntegration | undefined {
    return this.managers.github;
  }

  getDeploymentManager(): DeploymentManager | undefined {
    return this.managers.deployment;
  }

  getPackageManager(): PackageManager {
    return this.managers.packages!;
  }

  getWebhookManager(): WebhookManager | undefined {
    return this.managers.webhooks;
  }

  // Statistics and Monitoring
  getIntegrationStats(): {
    totalConnections: number;
    connectionsByType: Record<string, number>;
    activeConnections: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentActivity: Array<{
      timestamp: number;
      integrationId: string;
      integrationName: string;
      action: string;
      type: string;
    }>;
  } {
    const connections = Array.from(this.connections.values());
    const connectionsByType: Record<string, number> = {};
    const activeConnections = connections.filter(c => c.status === 'connected').length;

    connections.forEach(conn => {
      connectionsByType[conn.type] = (connectionsByType[conn.type] || 0) + 1;
    });

    const eventsByType: Record<string, number> = {};
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const recentActivity = this.events
      .slice(-10)
      .map(event => ({
        timestamp: event.timestamp,
        integrationId: event.integrationId,
        integrationName: this.connections.get(event.integrationId)?.name || 'Unknown',
        action: event.action,
        type: event.type,
      }));

    return {
      totalConnections: connections.length,
      connectionsByType,
      activeConnections,
      totalEvents: this.events.length,
      eventsByType,
      recentActivity,
    };
  }

  async healthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    connections: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      lastUsed?: number;
      errorCount: number;
    }>;
    managers: {
      github: boolean;
      deployment: boolean;
      packages: boolean;
      webhooks: boolean;
    };
  }> {
    const connections = Array.from(this.connections.values());
    const connectionHealth = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      status: conn.status,
      lastUsed: conn.metadata.lastUsed,
      errorCount: conn.metadata.errors.length,
    }));

    const hasErrors = connectionHealth.some(c => c.status === 'error' || c.errorCount > 5);
    const hasOldConnections = connectionHealth.some(c =>
      c.lastUsed && Date.now() - c.lastUsed > 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    return {
      overall: hasErrors ? 'error' : hasOldConnections ? 'warning' : 'healthy',
      connections: connectionHealth,
      managers: {
        github: !!this.managers.github,
        deployment: !!this.managers.deployment,
        packages: !!this.managers.packages,
        webhooks: !!this.managers.webhooks,
      },
    };
  }

  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<{
    eventsRemoved: number;
    connectionErrorsRemoved: number;
  }> {
    const cutoff = Date.now() - maxAge;

    // Clean old events
    const initialEventCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp > cutoff);
    const eventsRemoved = initialEventCount - this.events.length;

    // Clean old connection errors
    let connectionErrorsRemoved = 0;
    for (const connection of this.connections.values()) {
      const initialErrorCount = connection.metadata.errors.length;
      connection.metadata.errors = connection.metadata.errors.filter(
        error => error.timestamp > cutoff
      );
      connectionErrorsRemoved += initialErrorCount - connection.metadata.errors.length;
    }

    await this.saveConnections();

    return { eventsRemoved, connectionErrorsRemoved };
  }
}