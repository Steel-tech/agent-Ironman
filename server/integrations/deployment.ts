/**
 * Agent Ironman - Deployment Integration
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
 * Deployment Integration - Support for Vercel, Railway, and other deployment platforms
 */

export interface DeploymentConfig {
  platform: 'vercel' | 'railway' | 'netlify' | 'heroku' | 'aws' | 'custom';
  apiKey: string;
  teamId?: string;
  projectId?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  rootDirectory: string;
  buildCommand: {
    command: string;
    watch?: string;
  };
  devCommand?: {
    command: string;
    watch?: string;
  };
  installCommand?: string;
  outputDirectory: string;
  publicDirectory?: string;
  functionsDirectory?: string;
  gitRepository?: {
    repo: string;
    type: 'github' | 'gitlab' | 'bitbucket';
  };
  env: Array<{
    key: string;
    value: string;
    type: 'system' | 'secret' | 'plain';
    target: Array<'production' | 'preview' | 'development'>;
  }>;
  build: {
    env: Array<{
      key: string;
      value: string;
    }>;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'CANCELED' | 'INITIALIZING';
  createdAt: number;
  readyAt?: number;
  target?: 'production' | 'preview' | 'development';
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitOrg?: string;
    githubCommitRepo?: string;
    githubCommitRef?: string;
  };
  build: {
    state: string;
    error?: string;
  };
}

export interface RailwayProject {
  id: string;
  name: string;
  projectId: string;
  serviceId: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
  domain: string;
  status: 'running' | 'stopped' | 'crashed' | 'building';
  service: {
    name: string;
    environmentVariables: Array<{
      key: string;
      value: string;
    }>;
    healthCheckPath?: string;
    healthCheckPort?: number;
    startCommand: string;
    buildCommand: string;
    rootDirectory: string;
    dockerfilePath?: string;
    dockerContextPath?: string;
    source: {
      repo: string;
      branch: string;
    };
  };
}

export interface RailwayDeployment {
  id: string;
  projectId: string;
  status: 'failed' | 'deploying' | 'deployed' | 'crashed' | 'idle';
  createdAt: string;
  updatedAt: string;
  domain: string;
  commitSha?: string;
  commitMessage?: string;
  branch?: string;
}

/**
 * Vercel Integration
 */
export class VercelIntegration {
  private apiKey: string;
  private teamId?: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(config: { apiKey: string; teamId?: string }) {
    this.apiKey = config.apiKey;
    this.teamId = config.teamId;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Vercel API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getProjects(): Promise<VercelProject[]> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelProject[]>(`/v9/projects${teamQuery}`);
  }

  async getProject(projectIdOrName: string): Promise<VercelProject> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelProject>(`/v13/projects/${projectIdOrName}${teamQuery}`);
  }

  async createProject(project: Partial<VercelProject>): Promise<VercelProject> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelProject>(`/v10/projects${teamQuery}`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(projectId: string, updates: Partial<VercelProject>): Promise<VercelProject> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelProject>(`/v9/projects/${projectId}${teamQuery}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async createDeployment(
    projectId: string,
    deploymentConfig?: {
      name?: string;
      target?: 'production' | 'preview' | 'development';
      gitSource?: {
        type: 'github' | 'gitlab' | 'bitbucket';
        repo?: string;
        ref?: string;
        sha?: string;
      };
      files?: Array<{
        file: string;
        data: string;
      }>;
    }
  ): Promise<VercelDeployment> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelDeployment>(`/v13/deployments${teamQuery}`, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        ...deploymentConfig,
      }),
    });
  }

  async getDeployments(projectId?: string, limit: number = 20): Promise<VercelDeployment[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (projectId) params.append('projectId', projectId);
    if (this.teamId) params.append('teamId', this.teamId);

    return this.makeRequest<VercelDeployment[]>(`/v6/deployments?${params}`);
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelDeployment>(`/v13/deployments/${deploymentId}${teamQuery}`);
  }

  async cancelDeployment(deploymentId: string): Promise<void> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    await this.makeRequest(`/v13/deployments/${deploymentId}/cancel${teamQuery}`, {
      method: 'POST',
    });
  }

  async redeploy(deploymentId: string): Promise<VercelDeployment> {
    const teamQuery = this.teamId ? `?teamId=${this.teamId}` : '';
    return this.makeRequest<VercelDeployment>(`/v13/deployments/${deploymentId}/redeploy${teamQuery}`, {
      method: 'POST',
    });
  }
}

/**
 * Railway Integration
 */
export class RailwayIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.railway.app/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Railway API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getProjects(): Promise<RailwayProject[]> {
    return this.makeRequest<{ data: RailwayProject[] }>('/projects').then(r => r.data);
  }

  async getProject(projectId: string): Promise<RailwayProject> {
    return this.makeRequest<{ data: RailwayProject }>(`/projects/${projectId}`).then(r => r.data);
  }

  async createProject(name: string, serviceConfig?: Partial<RailwayProject['service']>): Promise<RailwayProject> {
    return this.makeRequest<{ data: RailwayProject }>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        service: serviceConfig || {},
      }),
    }).then(r => r.data);
  }

  async updateProject(projectId: string, updates: Partial<RailwayProject>): Promise<RailwayProject> {
    return this.makeRequest<{ data: RailwayProject }>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).then(r => r.data);
  }

  async createDeployment(projectId: string, branch?: string): Promise<RailwayDeployment> {
    return this.makeRequest<{ data: RailwayDeployment }>(`/projects/${projectId}/deployments`, {
      method: 'POST',
      body: JSON.stringify({
        branch: branch || 'main',
      }),
    }).then(r => r.data);
  }

  async getDeployments(projectId: string): Promise<RailwayDeployment[]> {
    return this.makeRequest<{ data: RailwayDeployment[] }>(`/projects/${projectId}/deployments`).then(r => r.data);
  }

  async redeploy(projectId: string, branch?: string): Promise<RailwayDeployment> {
    return this.makeRequest<{ data: RailwayDeployment }>(`/projects/${projectId}/deploy`, {
      method: 'POST',
      body: JSON.stringify({
        branch: branch || 'main',
      }),
    }).then(r => r.data);
  }

  async setEnvironmentVariable(projectId: string, key: string, value: string): Promise<void> {
    return this.makeRequest(`/projects/${projectId}/environment-variables`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        value,
      }),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Unified Deployment Manager
 */
export class DeploymentManager {
  private vercel?: VercelIntegration;
  private railway?: RailwayIntegration;
  private configs: Map<string, DeploymentConfig> = new Map();

  constructor() {}

  addPlatform(platform: string, config: DeploymentConfig): void {
    this.configs.set(platform, config);

    switch (config.platform) {
      case 'vercel':
        this.vercel = new VercelIntegration({
          apiKey: config.apiKey,
          teamId: config.teamId,
        });
        break;
      case 'railway':
        this.railway = new RailwayIntegration(config.apiKey);
        break;
    }
  }

  async getProjects(platform?: string): Promise<Array<{ platform: string; project: any }>> {
    const results: Array<{ platform: string; project: any }> = [];

    if (!platform || platform === 'vercel') {
      if (this.vercel) {
        try {
          const vercelProjects = await this.vercel.getProjects();
          results.push(...vercelProjects.map(p => ({ platform: 'vercel', project: p })));
        } catch (error) {
          console.warn('Failed to fetch Vercel projects:', error);
        }
      }
    }

    if (!platform || platform === 'railway') {
      if (this.railway) {
        try {
          const railwayProjects = await this.railway.getProjects();
          results.push(...railwayProjects.map(p => ({ platform: 'railway', project: p })));
        } catch (error) {
          console.warn('Failed to fetch Railway projects:', error);
        }
      }
    }

    return results;
  }

  async createDeployment(
    platform: string,
    projectId: string,
    config?: any
  ): Promise<any> {
    switch (platform) {
      case 'vercel':
        if (!this.vercel) throw new Error('Vercel not configured');
        return this.vercel.createDeployment(projectId, config);

      case 'railway':
        if (!this.railway) throw new Error('Railway not configured');
        return this.railway.createDeployment(projectId, config?.branch);

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async getDeployments(platform?: string, projectId?: string): Promise<Array<{
    platform: string;
    deployment: any;
  }>> {
    const results: Array<{ platform: string; deployment: any }> = [];

    if (!platform || platform === 'vercel') {
      if (this.vercel) {
        try {
          const vercelDeployments = await this.vercel.getDeployments(projectId);
          results.push(...vercelDeployments.map(d => ({ platform: 'vercel', deployment: d })));
        } catch (error) {
          console.warn('Failed to fetch Vercel deployments:', error);
        }
      }
    }

    if (!platform || platform === 'railway') {
      if (this.railway && projectId) {
        try {
          const railwayDeployments = await this.railway.getDeployments(projectId);
          results.push(...railwayDeployments.map(d => ({ platform: 'railway', deployment: d })));
        } catch (error) {
          console.warn('Failed to fetch Railway deployments:', error);
        }
      }
    }

    return results;
  }

  async monitorDeployment(
    platform: string,
    deploymentId: string,
    onUpdate?: (deployment: any) => void
  ): Promise<void> {
    const pollInterval = 5000; // 5 seconds

    const poll = async () => {
      try {
        let deployment: any;

        switch (platform) {
          case 'vercel':
            if (!this.vercel) return;
            deployment = await this.vercel.getDeployment(deploymentId);
            break;
          case 'railway':
            // Railway doesn't have a direct getDeployment endpoint
            // Would need to fetch from project deployments list
            return;
          default:
            return;
        }

        onUpdate?.(deployment);

        // Continue polling if deployment is still building
        if (deployment.state === 'BUILDING' || deployment.state === 'INITIALIZING') {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    poll();
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.configs.keys());
  }

  isConfigured(platform: string): boolean {
    return this.configs.has(platform);
  }
}