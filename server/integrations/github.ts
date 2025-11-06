/**
 * Agent Ironman - GitHub Integration
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
 * GitHub Integration - Complete GitHub repository management and automation
 */

export interface GitHubConfig {
  token: string;
  username: string;
  defaultBranch?: string;
  apiUrl?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  fork: boolean;
  url: string;
  sshUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  user: {
    login: string;
    id: number;
  };
  createdAt: string;
  updatedAt: string;
  mergeable?: boolean;
  mergeableState?: string;
  draft: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: GitHubCommitFile[];
}

export interface GitHubCommitFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
  blobUrl: string;
  rawUrl: string;
  contentsUrl: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    id: number;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    id: number;
  }>;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  comments: number;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
  badgeUrl: string;
  htmlUrl: string;
}

/**
 * GitHub Integration Class
 */
export class GitHubIntegration {
  private config: GitHubConfig;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://api.github.com';
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Agent-Ironman/1.0',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's repositories
   */
  async getRepositories(type: 'all' | 'owner' | 'member' = 'all'): Promise<GitHubRepository[]> {
    return this.makeRequest<GitHubRepository[]>(`/user/repos?type=${type}&per_page=100`);
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<any> {
    const params = ref ? `?ref=${ref}` : '';
    return this.makeRequest<any>(`/repos/${owner}/${repo}/contents/${path}${params}`);
  }

  /**
   * Get pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubPullRequest[]> {
    return this.makeRequest<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
  }

  /**
   * Get specific pull request
   */
  async getPullRequest(owner: string, repo: string, number: number): Promise<GitHubPullRequest> {
    return this.makeRequest<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${number}`);
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string,
    draft: boolean = false
  ): Promise<GitHubPullRequest> {
    return this.makeRequest<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        head,
        base,
        body: body || '',
        draft,
      }),
    });
  }

  /**
   * Update pull request
   */
  async updatePullRequest(
    owner: string,
    repo: string,
    number: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
    }
  ): Promise<GitHubPullRequest> {
    return this.makeRequest<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${number}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Merge pull request
   */
  async mergePullRequest(
    owner: string,
    repo: string,
    number: number,
    commitTitle?: string,
    commitMessage?: string,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge'
  ): Promise<any> {
    return this.makeRequest<any>(`/repos/${owner}/${repo}/pulls/${number}/merge`, {
      method: 'PUT',
      body: JSON.stringify({
        commit_title: commitTitle,
        commit_message: commitMessage,
        merge_method: mergeMethod,
      }),
    });
  }

  /**
   * Get pull request files
   */
  async getPullRequestFiles(
    owner: string,
    repo: string,
    number: number
  ): Promise<GitHubCommitFile[]> {
    return this.makeRequest<GitHubCommitFile[]>(`/repos/${owner}/${repo}/pulls/${number}/files`);
  }

  /**
   * Create pull request review
   */
  async createPullRequestReview(
    owner: string,
    repo: string,
    number: number,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT',
    comments?: Array<{
      path: string;
      position: number;
      body: string;
    }>
  ): Promise<any> {
    return this.makeRequest<any>(`/repos/${owner}/${repo}/pulls/${number}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        body,
        event,
        comments: comments || [],
      }),
    });
  }

  /**
   * Get commits
   */
  async getCommits(
    owner: string,
    repo: string,
    sha?: string,
    path?: string,
    since?: string,
    until?: string,
    perPage: number = 30
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      per_page: perPage.toString(),
    });

    if (sha) params.append('sha', sha);
    if (path) params.append('path', path);
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    return this.makeRequest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params}`);
  }

  /**
   * Get specific commit
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    return this.makeRequest<GitHubCommit>(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  /**
   * Create commit (requires files to be staged first)
   */
  async createCommit(
    owner: string,
    repo: string,
    message: string,
    tree: string,
    parents: string[]
  ): Promise<GitHubCommit> {
    return this.makeRequest<GitHubCommit>(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree,
        parents,
      }),
    });
  }

  /**
   * Get issues
   */
  async getIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
    labels?: string[]
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({ state });
    if (labels?.length) {
      params.append('labels', labels.join(','));
    }

    return this.makeRequest<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?${params}`);
  }

  /**
   * Create issue
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[]
  ): Promise<GitHubIssue> {
    return this.makeRequest<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: body || '',
        labels: labels || [],
        assignees: assignees || [],
      }),
    });
  }

  /**
   * Update issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    number: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
      assignees?: string[];
    }
  ): Promise<GitHubIssue> {
    return this.makeRequest<GitHubIssue>(`/repos/${owner}/${repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get repository workflows
   */
  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    return this.makeRequest<GitHubWorkflow[]>(`/repos/${owner}/${repo}/actions/workflows`);
  }

  /**
   * Trigger workflow run
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number,
    ref: string,
    inputs?: Record<string, any>
  ): Promise<any> {
    return this.makeRequest<any>(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({
        ref,
        inputs: inputs || {},
      }),
    });
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(owner: string, repo: string): Promise<any> {
    // Get contributors stats
    const contributors = this.makeRequest<any[]>(`/repos/${owner}/${repo}/stats/contributors`);

    // Get languages
    const languages = this.makeRequest<Record<string, number>>(`/repos/${owner}/${repo}/languages`);

    // Get commit activity
    const commitActivity = this.makeRequest<any[]>(`/repos/${owner}/${repo}/stats/commit_activity`);

    return {
      contributors,
      languages,
      commitActivity,
    };
  }

  /**
   * Auto-review pull request using AI
   */
  async autoReviewPullRequest(
    owner: string,
    repo: string,
    number: number,
    reviewContent: string,
    suggestions?: Array<{
      path: string;
      line: number;
      suggestion: string;
      severity: 'error' | 'warning' | 'info';
    }>
  ): Promise<any> {
    // Create review comments if suggestions provided
    const comments = suggestions?.map(suggestion => ({
      path: suggestion.path,
      position: suggestion.line,
      body: `**${suggestion.severity.toUpperCase()}**: ${suggestion.suggestion}`,
    }));

    return this.createPullRequestReview(owner, repo, number, reviewContent, 'COMMENT', comments);
  }

  /**
   * Generate smart commit message based on changes
   */
  async generateSmartCommitMessage(
    owner: string,
    repo: string,
    stagedFiles: string[],
    diff: string
  ): Promise<string> {
    // This would integrate with AI to generate commit messages
    // For now, return a basic analysis
    const fileTypes = stagedFiles.map(file => file.split('.').pop() || '');
    const uniqueTypes = [...new Set(fileTypes)];

    let commitType = 'feat';
    if (uniqueTypes.includes('md') || uniqueTypes.includes('txt')) {
      commitType = 'docs';
    } else if (uniqueTypes.includes('js') || uniqueTypes.includes('ts')) {
      commitType = 'feat';
    } else if (uniqueTypes.includes('json') || uniqueTypes.includes('yml') || uniqueTypes.includes('yaml')) {
      commitType = 'chore';
    }

    const changedFiles = stagedFiles.length;
    const scope = stagedFiles[0]?.split('/')[0] || 'main';

    return `${commitType}(${scope}): update ${changedFiles} file${changedFiles > 1 ? 's' : ''}`;
  }

  /**
   * Sync repository with local working directory
   */
  async syncRepository(
    owner: string,
    repo: string,
    localPath: string
  ): Promise<{
    status: 'success' | 'error';
    message: string;
    changes?: any;
  }> {
    try {
      // Get remote repository info
      const remoteRepo = await this.getRepository(owner, repo);

      // Get local git status (this would need local git integration)
      // For now, return basic sync info
      return {
        status: 'success',
        message: `Repository ${remoteRepo.fullName} is ready for sync`,
        changes: {
          remoteUrl: remoteRepo.cloneUrl,
          defaultBranch: remoteRepo.defaultBranch,
          lastUpdated: remoteRepo.pushedAt,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}