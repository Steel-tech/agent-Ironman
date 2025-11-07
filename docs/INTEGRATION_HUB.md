<metadata>
purpose: Complete technical documentation for Integration Hub system covering GitHub, deployment, webhooks, and package registry integrations
type: API
language: TypeScript
dependencies: fetch, crypto, node:fs
last-updated: 2025-01-07
license: MIT
</metadata>

<overview>
Integration Hub provides centralized management for external service connections including GitHub repositories, deployment platforms (Vercel/Railway), webhook systems, and package registries (npm/PyPI). The system tracks connection states, manages authentication, handles rate limiting, logs events, and provides unified interfaces for all integration types.
</overview>

<architecture>
<component name="IntegrationHub">
  Core orchestrator managing all integration connections and managers. Tracks connection state, events, usage statistics, and health monitoring.
</component>

<component name="GitHubIntegration">
  Complete GitHub API client for repository management, PR workflows, commit operations, issues, and CI/CD workflows.
</component>

<component name="DeploymentManager">
  Unified deployment interface supporting Vercel and Railway platforms with project management and deployment monitoring.
</component>

<component name="WebhookManager">
  Real-time event handling system for incoming webhooks from GitHub, Vercel, and custom sources with filtering and workflow triggers.
</component>

<component name="PackageManager">
  Package registry client for npm and PyPI with security auditing, dependency checking, and update recommendations.
</component>
</architecture>

<types>
<type name="IntegrationConnection">
  <signature>interface IntegrationConnection</signature>
  <purpose>Represents a configured connection to an external service</purpose>
  <fields>
    <field name="id" type="string">Unique connection identifier</field>
    <field name="name" type="string">Human-readable connection name</field>
    <field name="type" type="'github' | 'vercel' | 'railway' | 'npm' | 'pypi' | 'webhook' | 'custom'">Integration type</field>
    <field name="provider" type="string">Service provider name</field>
    <field name="status" type="'connected' | 'disconnected' | 'error' | 'pending'">Connection state</field>
    <field name="config" type="any">Provider-specific configuration</field>
    <field name="metadata" type="object">Usage tracking and error history</field>
    <field name="capabilities" type="string[]">Available operations</field>
    <field name="permissions" type="string[]">Required permissions</field>
    <field name="rateLimit" type="object | undefined">API rate limit information</field>
  </fields>
</type>

<type name="IntegrationEvent">
  <signature>interface IntegrationEvent</signature>
  <purpose>Audit log entry for integration actions</purpose>
  <fields>
    <field name="id" type="string">Event identifier</field>
    <field name="integrationId" type="string">Associated connection ID</field>
    <field name="type" type="'success' | 'error' | 'warning' | 'info'">Event severity</field>
    <field name="action" type="string">Action performed</field>
    <field name="message" type="string">Human-readable description</field>
    <field name="timestamp" type="number">Unix timestamp</field>
    <field name="details" type="any | undefined">Additional context</field>
  </fields>
</type>

<type name="GitHubConfig">
  <signature>interface GitHubConfig</signature>
  <purpose>GitHub authentication configuration</purpose>
  <fields>
    <field name="token" type="string" required="true">Personal access token or OAuth token</field>
    <field name="username" type="string" required="true">GitHub username</field>
    <field name="defaultBranch" type="string | undefined">Default branch (defaults to 'main')</field>
    <field name="apiUrl" type="string | undefined">Custom API URL for GitHub Enterprise</field>
  </fields>
</type>

<type name="DeploymentConfig">
  <signature>interface DeploymentConfig</signature>
  <purpose>Deployment platform configuration</purpose>
  <fields>
    <field name="platform" type="'vercel' | 'railway' | 'netlify' | 'heroku' | 'aws' | 'custom'" required="true">Platform identifier</field>
    <field name="apiKey" type="string" required="true">Platform API key</field>
    <field name="teamId" type="string | undefined">Team/organization ID (Vercel)</field>
    <field name="projectId" type="string | undefined">Default project ID</field>
  </fields>
</type>

<type name="WebhookConfig">
  <signature>interface WebhookConfig</signature>
  <purpose>Webhook endpoint configuration</purpose>
  <fields>
    <field name="id" type="string">Webhook identifier</field>
    <field name="name" type="string">Webhook name</field>
    <field name="url" type="string">Endpoint URL</field>
    <field name="events" type="string[]">Event types to handle</field>
    <field name="secret" type="string | undefined">Signature verification secret</field>
    <field name="active" type="boolean">Whether webhook is active</field>
    <field name="source" type="'github' | 'gitlab' | 'vercel' | 'railway' | 'discord' | 'slack' | 'custom'">Event source</field>
    <field name="headers" type="Record&lt;string, string&gt; | undefined">Custom headers</field>
    <field name="filters" type="object | undefined">Event filtering rules (branches, paths, tags)</field>
    <field name="actions" type="object | undefined">Automated actions on events</field>
  </fields>
</type>

<type name="PackageInfo">
  <signature>interface PackageInfo</signature>
  <purpose>Package metadata from npm or PyPI</purpose>
  <fields>
    <field name="name" type="string">Package name</field>
    <field name="version" type="string">Latest version</field>
    <field name="description" type="string | undefined">Package description</field>
    <field name="author" type="object | undefined">Author information</field>
    <field name="license" type="string | undefined">License identifier</field>
    <field name="keywords" type="string[] | undefined">Package keywords</field>
    <field name="dependencies" type="Record&lt;string, string&gt; | undefined">Production dependencies</field>
    <field name="devDependencies" type="Record&lt;string, string&gt; | undefined">Development dependencies</field>
    <field name="security" type="object | undefined">Security vulnerability information</field>
  </fields>
</type>
</types>

<classes>
<class name="IntegrationHub">
  <purpose>Central orchestrator for all external integrations</purpose>
  <constructor>
    <signature>constructor(sessionId: string)</signature>
    <purpose>Initialize integration hub for a session</purpose>
    <parameters>
      <param name="sessionId" type="string" required="true">Unique session identifier</param>
    </parameters>
  </constructor>

  <method name="addGitHubConnection">
    <signature>async addGitHubConnection(name: string, config: GitHubConfig): Promise&lt;string&gt;</signature>
    <purpose>Add and test GitHub connection</purpose>
    <parameters>
      <param name="name" type="string" required="true">Connection display name</param>
      <param name="config" type="GitHubConfig" required="true">GitHub authentication config</param>
    </parameters>
    <returns>Connection ID</returns>
    <errors>
      <error type="Error">When authentication fails or API is unreachable</error>
    </errors>
    <example>
      <input>
await hub.addGitHubConnection("Primary GitHub", {
  token: "ghp_xxxxxxxxxxxx",
  username: "kenkai",
  defaultBranch: "main"
});
      </input>
      <output>"github_1736265600000_abc123xyz"</output>
    </example>
  </method>

  <method name="addDeploymentConnection">
    <signature>async addDeploymentConnection(name: string, config: DeploymentConfig): Promise&lt;string&gt;</signature>
    <purpose>Add deployment platform connection</purpose>
    <parameters>
      <param name="name" type="string" required="true">Connection display name</param>
      <param name="config" type="DeploymentConfig" required="true">Platform configuration</param>
    </parameters>
    <returns>Connection ID</returns>
    <example>
      <input>
await hub.addDeploymentConnection("Production Vercel", {
  platform: "vercel",
  apiKey: "xxx",
  teamId: "team_xxx"
});
      </input>
      <output>"deployment_1736265600000_def456uvw"</output>
    </example>
  </method>

  <method name="addWebhookConnection">
    <signature>async addWebhookConnection(name: string, config: WebhookConfig): Promise&lt;string&gt;</signature>
    <purpose>Register webhook endpoint</purpose>
    <parameters>
      <param name="name" type="string" required="true">Webhook display name</param>
      <param name="config" type="WebhookConfig" required="true">Webhook configuration</param>
    </parameters>
    <returns>Connection ID</returns>
    <example>
      <input>
await hub.addWebhookConnection("GitHub Push Events", {
  name: "push-webhook",
  url: "https://app.example.com/webhooks/github",
  events: ["push", "pull_request"],
  source: "github",
  active: true,
  filters: { branches: ["main", "develop"] }
});
      </input>
      <output>"webhook_1736265600000_ghi789rst"</output>
    </example>
  </method>

  <method name="testConnection">
    <signature>async testConnection(connectionId: string): Promise&lt;IntegrationTestResult&gt;</signature>
    <purpose>Test connection health and response time</purpose>
    <parameters>
      <param name="connectionId" type="string" required="true">Connection ID to test</param>
    </parameters>
    <returns>Test result with success status, response time, and data/error</returns>
    <example>
      <input>await hub.testConnection("github_1736265600000_abc123xyz")</input>
      <output>
{
  success: true,
  responseTime: 342,
  data: { repositoryCount: 47 }
}
      </output>
    </example>
  </method>

  <method name="updateConnection">
    <signature>async updateConnection(connectionId: string, updates: Partial&lt;IntegrationConnection&gt;): Promise&lt;boolean&gt;</signature>
    <purpose>Update connection configuration</purpose>
    <parameters>
      <param name="connectionId" type="string" required="true">Connection ID</param>
      <param name="updates" type="Partial&lt;IntegrationConnection&gt;" required="true">Fields to update</param>
    </parameters>
    <returns>True if updated successfully</returns>
  </method>

  <method name="removeConnection">
    <signature>async removeConnection(connectionId: string): Promise&lt;boolean&gt;</signature>
    <purpose>Remove connection and cleanup resources</purpose>
    <parameters>
      <param name="connectionId" type="string" required="true">Connection ID to remove</param>
    </parameters>
    <returns>True if removed successfully</returns>
  </method>

  <method name="getConnections">
    <signature>getConnections(type?: string): IntegrationConnection[]</signature>
    <purpose>Retrieve all connections, optionally filtered by type</purpose>
    <parameters>
      <param name="type" type="string" required="false">Filter by integration type</param>
    </parameters>
    <returns>Array of connections</returns>
    <example>
      <input>hub.getConnections("github")</input>
      <output>[{ id: "github_xxx", name: "Primary GitHub", type: "github", status: "connected", ... }]</output>
    </example>
  </method>

  <method name="getConnection">
    <signature>getConnection(id: string): IntegrationConnection | null</signature>
    <purpose>Get specific connection by ID</purpose>
    <parameters>
      <param name="id" type="string" required="true">Connection ID</param>
    </parameters>
    <returns>Connection object or null if not found</returns>
  </method>

  <method name="getEvents">
    <signature>getEvents(limit: number = 50): IntegrationEvent[]</signature>
    <purpose>Retrieve recent integration events</purpose>
    <parameters>
      <param name="limit" type="number" required="false">Maximum events to return (default: 50)</param>
    </parameters>
    <returns>Array of events in reverse chronological order</returns>
  </method>

  <method name="getEventsByConnection">
    <signature>getEventsByConnection(connectionId: string, limit: number = 20): IntegrationEvent[]</signature>
    <purpose>Get events for specific connection</purpose>
    <parameters>
      <param name="connectionId" type="string" required="true">Connection ID</param>
      <param name="limit" type="number" required="false">Maximum events (default: 20)</param>
    </parameters>
    <returns>Array of connection-specific events</returns>
  </method>

  <method name="getIntegrationStats">
    <signature>getIntegrationStats(): object</signature>
    <purpose>Get integration usage statistics</purpose>
    <returns>Statistics object with connection counts, event counts, and recent activity</returns>
    <example>
      <output>
{
  totalConnections: 5,
  connectionsByType: { github: 2, vercel: 1, webhook: 2 },
  activeConnections: 4,
  totalEvents: 127,
  eventsByType: { success: 98, error: 12, warning: 11, info: 6 },
  recentActivity: [...]
}
      </output>
    </example>
  </method>

  <method name="healthCheck">
    <signature>async healthCheck(): Promise&lt;object&gt;</signature>
    <purpose>Check overall integration health</purpose>
    <returns>Health status with connection details and manager availability</returns>
    <example>
      <output>
{
  overall: "healthy",
  connections: [
    { id: "github_xxx", name: "Primary", type: "github", status: "connected", errorCount: 0 }
  ],
  managers: {
    github: true,
    deployment: true,
    packages: true,
    webhooks: false
  }
}
      </output>
    </example>
  </method>

  <method name="cleanupOldData">
    <signature>async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise&lt;object&gt;</signature>
    <purpose>Remove old events and error logs</purpose>
    <parameters>
      <param name="maxAge" type="number" required="false">Maximum age in milliseconds (default: 30 days)</param>
    </parameters>
    <returns>Count of removed events and errors</returns>
  </method>

  <method name="getGitHubManager">
    <signature>getGitHubManager(): GitHubIntegration | undefined</signature>
    <purpose>Access GitHub integration manager</purpose>
    <returns>GitHubIntegration instance or undefined if not configured</returns>
  </method>

  <method name="getDeploymentManager">
    <signature>getDeploymentManager(): DeploymentManager | undefined</signature>
    <purpose>Access deployment manager</purpose>
    <returns>DeploymentManager instance or undefined if not configured</returns>
  </method>

  <method name="getPackageManager">
    <signature>getPackageManager(): PackageManager</signature>
    <purpose>Access package registry manager</purpose>
    <returns>PackageManager instance (always available)</returns>
  </method>

  <method name="getWebhookManager">
    <signature>getWebhookManager(): WebhookManager | undefined</signature>
    <purpose>Access webhook manager</purpose>
    <returns>WebhookManager instance or undefined if not configured</returns>
  </method>
</class>

<class name="GitHubIntegration">
  <purpose>Complete GitHub API client for repository operations</purpose>
  <constructor>
    <signature>constructor(config: GitHubConfig)</signature>
    <parameters>
      <param name="config" type="GitHubConfig" required="true">GitHub authentication</param>
    </parameters>
  </constructor>

  <method name="getRepositories">
    <signature>async getRepositories(type: 'all' | 'owner' | 'member' = 'all'): Promise&lt;GitHubRepository[]&gt;</signature>
    <purpose>Fetch user repositories</purpose>
    <parameters>
      <param name="type" type="'all' | 'owner' | 'member'" required="false">Repository ownership filter</param>
    </parameters>
    <returns>Array of repository objects</returns>
  </method>

  <method name="getRepository">
    <signature>async getRepository(owner: string, repo: string): Promise&lt;GitHubRepository&gt;</signature>
    <purpose>Get repository details</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner username</param>
      <param name="repo" type="string" required="true">Repository name</param>
    </parameters>
    <returns>Repository object</returns>
  </method>

  <method name="getRepositoryContents">
    <signature>async getRepositoryContents(owner: string, repo: string, path: string = '', ref?: string): Promise&lt;any&gt;</signature>
    <purpose>Get file or directory contents</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="path" type="string" required="false">File/directory path (default: root)</param>
      <param name="ref" type="string" required="false">Branch/tag/commit SHA</param>
    </parameters>
    <returns>File content or directory listing</returns>
  </method>

  <method name="getPullRequests">
    <signature>async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise&lt;GitHubPullRequest[]&gt;</signature>
    <purpose>List pull requests</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="state" type="'open' | 'closed' | 'all'" required="false">PR state filter</param>
    </parameters>
    <returns>Array of pull requests</returns>
  </method>

  <method name="createPullRequest">
    <signature>async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string, draft: boolean = false): Promise&lt;GitHubPullRequest&gt;</signature>
    <purpose>Create new pull request</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="title" type="string" required="true">PR title</param>
      <param name="head" type="string" required="true">Source branch</param>
      <param name="base" type="string" required="true">Target branch</param>
      <param name="body" type="string" required="false">PR description</param>
      <param name="draft" type="boolean" required="false">Create as draft PR</param>
    </parameters>
    <returns>Created pull request</returns>
    <example>
      <input>
await github.createPullRequest("kenkai", "agent-ironman",
  "Add webhook support", "feature/webhooks", "main",
  "Implements webhook handling for GitHub events", false);
      </input>
    </example>
  </method>

  <method name="mergePullRequest">
    <signature>async mergePullRequest(owner: string, repo: string, number: number, commitTitle?: string, commitMessage?: string, mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge'): Promise&lt;any&gt;</signature>
    <purpose>Merge pull request</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="number" type="number" required="true">PR number</param>
      <param name="commitTitle" type="string" required="false">Custom merge commit title</param>
      <param name="commitMessage" type="string" required="false">Custom merge commit message</param>
      <param name="mergeMethod" type="'merge' | 'squash' | 'rebase'" required="false">Merge strategy</param>
    </parameters>
    <returns>Merge result</returns>
  </method>

  <method name="getPullRequestFiles">
    <signature>async getPullRequestFiles(owner: string, repo: string, number: number): Promise&lt;GitHubCommitFile[]&gt;</signature>
    <purpose>Get files changed in pull request</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="number" type="number" required="true">PR number</param>
    </parameters>
    <returns>Array of changed files with patches</returns>
  </method>

  <method name="createPullRequestReview">
    <signature>async createPullRequestReview(owner: string, repo: string, number: number, body: string, event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT', comments?: Array&lt;object&gt;): Promise&lt;any&gt;</signature>
    <purpose>Create PR review with inline comments</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="number" type="number" required="true">PR number</param>
      <param name="body" type="string" required="true">Review summary</param>
      <param name="event" type="'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'" required="false">Review action</param>
      <param name="comments" type="Array&lt;object&gt;" required="false">Inline comments array</param>
    </parameters>
    <returns>Created review</returns>
  </method>

  <method name="getCommits">
    <signature>async getCommits(owner: string, repo: string, sha?: string, path?: string, since?: string, until?: string, perPage: number = 30): Promise&lt;GitHubCommit[]&gt;</signature>
    <purpose>List commits with filters</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="sha" type="string" required="false">Branch/tag/commit SHA</param>
      <param name="path" type="string" required="false">File path filter</param>
      <param name="since" type="string" required="false">ISO 8601 timestamp</param>
      <param name="until" type="string" required="false">ISO 8601 timestamp</param>
      <param name="perPage" type="number" required="false">Results per page (default: 30)</param>
    </parameters>
    <returns>Array of commits</returns>
  </method>

  <method name="getCommit">
    <signature>async getCommit(owner: string, repo: string, sha: string): Promise&lt;GitHubCommit&gt;</signature>
    <purpose>Get commit details with file changes</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="sha" type="string" required="true">Commit SHA</param>
    </parameters>
    <returns>Commit object with stats and files</returns>
  </method>

  <method name="getIssues">
    <signature>async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open', labels?: string[]): Promise&lt;GitHubIssue[]&gt;</signature>
    <purpose>List repository issues</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="state" type="'open' | 'closed' | 'all'" required="false">Issue state</param>
      <param name="labels" type="string[]" required="false">Label filters</param>
    </parameters>
    <returns>Array of issues</returns>
  </method>

  <method name="createIssue">
    <signature>async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[], assignees?: string[]): Promise&lt;GitHubIssue&gt;</signature>
    <purpose>Create new issue</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="title" type="string" required="true">Issue title</param>
      <param name="body" type="string" required="false">Issue description</param>
      <param name="labels" type="string[]" required="false">Labels to apply</param>
      <param name="assignees" type="string[]" required="false">Usernames to assign</param>
    </parameters>
    <returns>Created issue</returns>
  </method>

  <method name="updateIssue">
    <signature>async updateIssue(owner: string, repo: string, number: number, updates: object): Promise&lt;GitHubIssue&gt;</signature>
    <purpose>Update issue properties</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="number" type="number" required="true">Issue number</param>
      <param name="updates" type="object" required="true">Fields to update (title, body, state, labels, assignees)</param>
    </parameters>
    <returns>Updated issue</returns>
  </method>

  <method name="getWorkflows">
    <signature>async getWorkflows(owner: string, repo: string): Promise&lt;GitHubWorkflow[]&gt;</signature>
    <purpose>List GitHub Actions workflows</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
    </parameters>
    <returns>Array of workflows</returns>
  </method>

  <method name="triggerWorkflow">
    <signature>async triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string, inputs?: Record&lt;string, any&gt;): Promise&lt;any&gt;</signature>
    <purpose>Trigger workflow_dispatch event</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="workflowId" type="number" required="true">Workflow ID</param>
      <param name="ref" type="string" required="true">Branch/tag to run on</param>
      <param name="inputs" type="Record&lt;string, any&gt;" required="false">Workflow inputs</param>
    </parameters>
    <returns>Trigger result</returns>
  </method>

  <method name="autoReviewPullRequest">
    <signature>async autoReviewPullRequest(owner: string, repo: string, number: number, reviewContent: string, suggestions?: Array&lt;object&gt;): Promise&lt;any&gt;</signature>
    <purpose>Create AI-powered PR review with suggestions</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="number" type="number" required="true">PR number</param>
      <param name="reviewContent" type="string" required="true">Review summary</param>
      <param name="suggestions" type="Array&lt;object&gt;" required="false">Code suggestions with severity</param>
    </parameters>
    <returns>Created review</returns>
  </method>

  <method name="syncRepository">
    <signature>async syncRepository(owner: string, repo: string, localPath: string): Promise&lt;object&gt;</signature>
    <purpose>Prepare repository sync information</purpose>
    <parameters>
      <param name="owner" type="string" required="true">Repository owner</param>
      <param name="repo" type="string" required="true">Repository name</param>
      <param name="localPath" type="string" required="true">Local directory path</param>
    </parameters>
    <returns>Sync status and repository information</returns>
  </method>
</class>

<class name="DeploymentManager">
  <purpose>Unified interface for multiple deployment platforms</purpose>
  <constructor>
    <signature>constructor()</signature>
    <purpose>Initialize empty deployment manager</purpose>
  </constructor>

  <method name="addPlatform">
    <signature>addPlatform(platform: string, config: DeploymentConfig): void</signature>
    <purpose>Register deployment platform</purpose>
    <parameters>
      <param name="platform" type="string" required="true">Platform identifier</param>
      <param name="config" type="DeploymentConfig" required="true">Platform configuration</param>
    </parameters>
  </method>

  <method name="getProjects">
    <signature>async getProjects(platform?: string): Promise&lt;Array&lt;{ platform: string; project: any }&gt;&gt;</signature>
    <purpose>List projects across all or specific platform</purpose>
    <parameters>
      <param name="platform" type="string" required="false">Platform filter</param>
    </parameters>
    <returns>Array of projects with platform identifier</returns>
  </method>

  <method name="createDeployment">
    <signature>async createDeployment(platform: string, projectId: string, config?: any): Promise&lt;any&gt;</signature>
    <purpose>Create new deployment</purpose>
    <parameters>
      <param name="platform" type="string" required="true">Platform identifier</param>
      <param name="projectId" type="string" required="true">Project ID</param>
      <param name="config" type="any" required="false">Platform-specific deployment config</param>
    </parameters>
    <returns>Deployment object</returns>
    <errors>
      <error type="Error">When platform not configured or deployment fails</error>
    </errors>
  </method>

  <method name="getDeployments">
    <signature>async getDeployments(platform?: string, projectId?: string): Promise&lt;Array&lt;{ platform: string; deployment: any }&gt;&gt;</signature>
    <purpose>List deployments</purpose>
    <parameters>
      <param name="platform" type="string" required="false">Platform filter</param>
      <param name="projectId" type="string" required="false">Project filter</param>
    </parameters>
    <returns>Array of deployments with platform identifier</returns>
  </method>

  <method name="monitorDeployment">
    <signature>async monitorDeployment(platform: string, deploymentId: string, onUpdate?: (deployment: any) =&gt; void): Promise&lt;void&gt;</signature>
    <purpose>Poll deployment status until complete</purpose>
    <parameters>
      <param name="platform" type="string" required="true">Platform identifier</param>
      <param name="deploymentId" type="string" required="true">Deployment ID</param>
      <param name="onUpdate" type="(deployment: any) =&gt; void" required="false">Status update callback</param>
    </parameters>
    <example>
      <input>
await deploymentManager.monitorDeployment("vercel", "dpl_xxx", (deployment) => {
  console.log(`Deployment state: ${deployment.state}`);
});
      </input>
    </example>
  </method>

  <method name="getAvailablePlatforms">
    <signature>getAvailablePlatforms(): string[]</signature>
    <purpose>List configured platforms</purpose>
    <returns>Array of platform identifiers</returns>
  </method>

  <method name="isConfigured">
    <signature>isConfigured(platform: string): boolean</signature>
    <purpose>Check if platform is configured</purpose>
    <parameters>
      <param name="platform" type="string" required="true">Platform identifier</param>
    </parameters>
    <returns>True if platform has configuration</returns>
  </method>
</class>

<class name="VercelIntegration">
  <purpose>Vercel platform-specific API client</purpose>
  <constructor>
    <signature>constructor(config: { apiKey: string; teamId?: string })</signature>
    <parameters>
      <param name="config.apiKey" type="string" required="true">Vercel API token</param>
      <param name="config.teamId" type="string" required="false">Vercel team ID</param>
    </parameters>
  </constructor>

  <method name="getProjects">
    <signature>async getProjects(): Promise&lt;VercelProject[]&gt;</signature>
    <purpose>List Vercel projects</purpose>
    <returns>Array of project objects</returns>
  </method>

  <method name="createDeployment">
    <signature>async createDeployment(projectId: string, deploymentConfig?: object): Promise&lt;VercelDeployment&gt;</signature>
    <purpose>Deploy project</purpose>
    <parameters>
      <param name="projectId" type="string" required="true">Project ID</param>
      <param name="deploymentConfig" type="object" required="false">Deployment options (target, gitSource, files)</param>
    </parameters>
    <returns>Deployment object with ID and URL</returns>
  </method>

  <method name="getDeployments">
    <signature>async getDeployments(projectId?: string, limit: number = 20): Promise&lt;VercelDeployment[]&gt;</signature>
    <purpose>List deployments</purpose>
    <parameters>
      <param name="projectId" type="string" required="false">Project filter</param>
      <param name="limit" type="number" required="false">Max results (default: 20)</param>
    </parameters>
    <returns>Array of deployments</returns>
  </method>

  <method name="getDeployment">
    <signature>async getDeployment(deploymentId: string): Promise&lt;VercelDeployment&gt;</signature>
    <purpose>Get deployment details</purpose>
    <parameters>
      <param name="deploymentId" type="string" required="true">Deployment ID</param>
    </parameters>
    <returns>Deployment object</returns>
  </method>

  <method name="cancelDeployment">
    <signature>async cancelDeployment(deploymentId: string): Promise&lt;void&gt;</signature>
    <purpose>Cancel running deployment</purpose>
    <parameters>
      <param name="deploymentId" type="string" required="true">Deployment ID</param>
    </parameters>
  </method>

  <method name="redeploy">
    <signature>async redeploy(deploymentId: string): Promise&lt;VercelDeployment&gt;</signature>
    <purpose>Redeploy existing deployment</purpose>
    <parameters>
      <param name="deploymentId" type="string" required="true">Deployment ID to redeploy</param>
    </parameters>
    <returns>New deployment object</returns>
  </method>
</class>

<class name="RailwayIntegration">
  <purpose>Railway platform-specific API client</purpose>
  <constructor>
    <signature>constructor(apiKey: string)</signature>
    <parameters>
      <param name="apiKey" type="string" required="true">Railway API token</param>
    </parameters>
  </constructor>

  <method name="getProjects">
    <signature>async getProjects(): Promise&lt;RailwayProject[]&gt;</signature>
    <purpose>List Railway projects</purpose>
    <returns>Array of project objects</returns>
  </method>

  <method name="createDeployment">
    <signature>async createDeployment(projectId: string, branch?: string): Promise&lt;RailwayDeployment&gt;</signature>
    <purpose>Deploy project from branch</purpose>
    <parameters>
      <param name="projectId" type="string" required="true">Project ID</param>
      <param name="branch" type="string" required="false">Git branch (default: 'main')</param>
    </parameters>
    <returns>Deployment object</returns>
  </method>

  <method name="getDeployments">
    <signature>async getDeployments(projectId: string): Promise&lt;RailwayDeployment[]&gt;</signature>
    <purpose>List project deployments</purpose>
    <parameters>
      <param name="projectId" type="string" required="true">Project ID</param>
    </parameters>
    <returns>Array of deployments</returns>
  </method>

  <method name="setEnvironmentVariable">
    <signature>async setEnvironmentVariable(projectId: string, key: string, value: string): Promise&lt;void&gt;</signature>
    <purpose>Set environment variable</purpose>
    <parameters>
      <param name="projectId" type="string" required="true">Project ID</param>
      <param name="key" type="string" required="true">Variable name</param>
      <param name="value" type="string" required="true">Variable value</param>
    </parameters>
  </method>
</class>

<class name="WebhookManager">
  <purpose>Real-time webhook event handling system</purpose>
  <constructor>
    <signature>constructor(sessionId: string)</signature>
    <parameters>
      <param name="sessionId" type="string" required="true">Session identifier</param>
    </parameters>
  </constructor>

  <method name="createWebhook">
    <signature>async createWebhook(config: Omit&lt;WebhookConfig, 'id' | 'createdAt' | 'triggerCount'&gt;): Promise&lt;string&gt;</signature>
    <purpose>Register new webhook endpoint</purpose>
    <parameters>
      <param name="config" type="Omit&lt;WebhookConfig, 'id' | 'createdAt' | 'triggerCount'&gt;" required="true">Webhook configuration</param>
    </parameters>
    <returns>Webhook ID</returns>
    <example>
      <input>
await webhookManager.createWebhook({
  name: "Deploy on Push",
  url: "https://api.example.com/deploy",
  events: ["push"],
  source: "github",
  active: true,
  filters: { branches: ["main"] },
  actions: { triggerWorkflows: ["deploy-production"] }
});
      </input>
    </example>
  </method>

  <method name="updateWebhook">
    <signature>async updateWebhook(id: string, updates: Partial&lt;WebhookConfig&gt;): Promise&lt;boolean&gt;</signature>
    <purpose>Update webhook configuration</purpose>
    <parameters>
      <param name="id" type="string" required="true">Webhook ID</param>
      <param name="updates" type="Partial&lt;WebhookConfig&gt;" required="true">Fields to update</param>
    </parameters>
    <returns>True if updated successfully</returns>
  </method>

  <method name="deleteWebhook">
    <signature>async deleteWebhook(id: string): Promise&lt;boolean&gt;</signature>
    <purpose>Remove webhook</purpose>
    <parameters>
      <param name="id" type="string" required="true">Webhook ID</param>
    </parameters>
    <returns>True if deleted successfully</returns>
  </method>

  <method name="getWebhooks">
    <signature>getWebhooks(source?: string): WebhookConfig[]</signature>
    <purpose>List webhooks, optionally filtered by source</purpose>
    <parameters>
      <param name="source" type="string" required="false">Source filter</param>
    </parameters>
    <returns>Array of webhook configurations</returns>
  </method>

  <method name="processWebhook">
    <signature>async processWebhook(source: string, type: string, payload: any, headers: Record&lt;string, string&gt; = {}): Promise&lt;WebhookEvent&gt;</signature>
    <purpose>Process incoming webhook event</purpose>
    <parameters>
      <param name="source" type="string" required="true">Event source (github, vercel, etc.)</param>
      <param name="type" type="string" required="true">Event type (push, pull_request, etc.)</param>
      <param name="payload" type="any" required="true">Event payload</param>
      <param name="headers" type="Record&lt;string, string&gt;" required="false">Request headers</param>
    </parameters>
    <returns>Processed event with result or error</returns>
    <example>
      <input>
await webhookManager.processWebhook("github", "push", {
  ref: "refs/heads/main",
  repository: { name: "agent-ironman" },
  head_commit: { id: "abc123", message: "Add feature", author: { name: "Ken" } }
}, { "x-github-event": "push" });
      </input>
      <output>
{
  id: "event_xxx",
  source: "github",
  type: "push",
  payload: {...},
  timestamp: 1736265600000,
  processed: true,
  result: {
    handled: true,
    type: "push",
    repository: "agent-ironman",
    branch: "main",
    commit: "abc123"
  }
}
      </output>
    </example>
  </method>

  <method name="getEvents">
    <signature>getEvents(limit: number = 50): WebhookEvent[]</signature>
    <purpose>Retrieve recent webhook events</purpose>
    <parameters>
      <param name="limit" type="number" required="false">Max events (default: 50)</param>
    </parameters>
    <returns>Array of events in reverse chronological order</returns>
  </method>

  <method name="generateWebhookUrl">
    <signature>generateWebhookUrl(webhookId: string): string</signature>
    <purpose>Generate webhook endpoint URL</purpose>
    <parameters>
      <param name="webhookId" type="string" required="true">Webhook ID</param>
    </parameters>
    <returns>Public webhook URL</returns>
    <example>
      <input>webhookManager.generateWebhookUrl("webhook_xxx")</input>
      <output>"http://localhost:3003/webhooks/webhook_xxx"</output>
    </example>
  </method>

  <method name="verifySignature">
    <signature>verifySignature(payload: string, signature: string, secret: string): boolean</signature>
    <purpose>Verify webhook signature using HMAC-SHA256</purpose>
    <parameters>
      <param name="payload" type="string" required="true">Raw request body</param>
      <param name="signature" type="string" required="true">Signature header value</param>
      <param name="secret" type="string" required="true">Webhook secret</param>
    </parameters>
    <returns>True if signature is valid</returns>
  </method>

  <method name="getWebhookStats">
    <signature>getWebhookStats(): object</signature>
    <purpose>Get webhook usage statistics</purpose>
    <returns>Statistics with counts and recent activity</returns>
  </method>
</class>

<class name="PackageManager">
  <purpose>Unified package registry interface for npm and PyPI</purpose>
  <constructor>
    <signature>constructor()</signature>
    <purpose>Initialize package manager with npm and PyPI registries</purpose>
  </constructor>

  <method name="getPackage">
    <signature>async getPackage(packageName: string, registry: 'npm' | 'pypi' = 'npm'): Promise&lt;PackageInfo&gt;</signature>
    <purpose>Get package metadata</purpose>
    <parameters>
      <param name="packageName" type="string" required="true">Package name</param>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
    </parameters>
    <returns>Package information</returns>
    <errors>
      <error type="Error">When package not found</error>
    </errors>
  </method>

  <method name="searchPackages">
    <signature>async searchPackages(query: string, registry: 'npm' | 'pypi' = 'npm', limit: number = 20): Promise&lt;PackageSearchResult&gt;</signature>
    <purpose>Search packages by query</purpose>
    <parameters>
      <param name="query" type="string" required="true">Search query</param>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
      <param name="limit" type="number" required="false">Max results (default: 20)</param>
    </parameters>
    <returns>Search results with pagination</returns>
  </method>

  <method name="checkDependencies">
    <signature>async checkDependencies(dependencies: Record&lt;string, string&gt;, registry: 'npm' | 'pypi' = 'npm'): Promise&lt;object&gt;</signature>
    <purpose>Check for outdated dependencies and vulnerabilities</purpose>
    <parameters>
      <param name="dependencies" type="Record&lt;string, string&gt;" required="true">Dependency map (name: version)</param>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
    </parameters>
    <returns>Object with outdated packages and vulnerabilities</returns>
    <example>
      <input>
await packageManager.checkDependencies({
  "express": "4.17.1",
  "react": "17.0.2",
  "typescript": "4.5.0"
}, "npm");
      </input>
      <output>
{
  outdated: [
    { name: "express", current: "4.17.1", latest: "4.19.2" },
    { name: "react", current: "17.0.2", latest: "18.3.1" }
  ],
  vulnerabilities: []
}
      </output>
    </example>
  </method>

  <method name="getSecurityReport">
    <signature>async getSecurityReport(dependencies: Record&lt;string, string&gt;, registry: 'npm' | 'pypi' = 'npm'): Promise&lt;object&gt;</signature>
    <purpose>Get security vulnerability report</purpose>
    <parameters>
      <param name="dependencies" type="Record&lt;string, string&gt;" required="true">Dependency map</param>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
    </parameters>
    <returns>Vulnerabilities with severity summary</returns>
  </method>

  <method name="suggestUpdates">
    <signature>async suggestUpdates(dependencies: Record&lt;string, string&gt;, registry: 'npm' | 'pypi' = 'npm', options?: object): Promise&lt;object&gt;</signature>
    <purpose>Get intelligent update recommendations</purpose>
    <parameters>
      <param name="dependencies" type="Record&lt;string, string&gt;" required="true">Dependency map</param>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
      <param name="options" type="object" required="false">Options (includeBeta, securityOnly)</param>
    </parameters>
    <returns>Recommended and security updates with risk levels</returns>
    <example>
      <output>
{
  recommended: [
    {
      name: "express",
      current: "4.17.1",
      recommended: "4.19.2",
      reason: "Latest stable version available",
      riskLevel: "moderate"
    }
  ],
  security: [
    {
      name: "lodash",
      current: "4.17.15",
      patched: "4.17.21",
      vulnerabilities: [{ id: "CVE-2021-23337", severity: "high", ... }]
    }
  ]
}
      </output>
    </example>
  </method>

  <method name="getPopularPackages">
    <signature>async getPopularPackages(registry: 'npm' | 'pypi' = 'npm', category?: string, limit: number = 50): Promise&lt;PackageInfo[]&gt;</signature>
    <purpose>Get popular packages</purpose>
    <parameters>
      <param name="registry" type="'npm' | 'pypi'" required="false">Registry (default: npm)</param>
      <param name="category" type="string" required="false">Category filter (unused)</param>
      <param name="limit" type="number" required="false">Max results (default: 50)</param>
    </parameters>
    <returns>Array of popular packages</returns>
  </method>
</class>

<class name="NpmRegistry">
  <purpose>npm-specific package registry client</purpose>
  <method name="getPackage">
    <signature>async getPackage(packageName: string): Promise&lt;PackageInfo&gt;</signature>
    <purpose>Get npm package metadata</purpose>
  </method>
  <method name="getPackageVersions">
    <signature>async getPackageVersions(packageName: string): Promise&lt;PackageVersion[]&gt;</signature>
    <purpose>Get all versions of package</purpose>
  </method>
  <method name="getDownloads">
    <signature>async getDownloads(packageName: string, period: 'last-week' | 'last-month' | 'last-year' = 'last-week'): Promise&lt;number&gt;</signature>
    <purpose>Get download statistics</purpose>
  </method>
</class>

<class name="PyPIRegistry">
  <purpose>PyPI-specific package registry client</purpose>
  <method name="getPackage">
    <signature>async getPackage(packageName: string): Promise&lt;PackageInfo&gt;</signature>
    <purpose>Get PyPI package metadata</purpose>
  </method>
  <method name="getPackageVersions">
    <signature>async getPackageVersions(packageName: string): Promise&lt;PackageVersion[]&gt;</signature>
    <purpose>Get all versions of package</purpose>
  </method>
</class>

<class name="SecurityAdvisory">
  <purpose>Security vulnerability database integration</purpose>
  <method name="getVulnerabilities">
    <signature>async getVulnerabilities(packageName: string): Promise&lt;SecurityVulnerability[]&gt;</signature>
    <purpose>Get known vulnerabilities for package</purpose>
  </method>
  <method name="auditDependencies">
    <signature>async auditDependencies(dependencies: Record&lt;string, string&gt;): Promise&lt;object&gt;</signature>
    <purpose>Audit all dependencies for vulnerabilities</purpose>
  </method>
</class>
</classes>

<configuration>
<setting name="GitHub Token" type="string">
  Personal access token or OAuth token with required scopes: repo, read:org, user:email, read:user
</setting>

<setting name="Vercel API Token" type="string">
  Vercel API token from account settings with deployment permissions
</setting>

<setting name="Railway API Token" type="string">
  Railway API token from account settings
</setting>

<setting name="Webhook Secret" type="string">
  Secret key for HMAC signature verification (should be cryptographically random)
</setting>

<setting name="Session Storage Path" type="string" default="/tmp/agent-ironman-{sessionId}/">
  Directory for storing integration state and webhook data
</setting>

<setting name="Event History Limit" type="number" default="1000">
  Maximum events to keep in memory before rotation
</setting>

<setting name="Webhook Cleanup Age" type="number" default="604800000">
  Age in milliseconds after which old webhook events are removed (default: 7 days)
</setting>

<setting name="Integration Cleanup Age" type="number" default="2592000000">
  Age in milliseconds for integration data cleanup (default: 30 days)
</setting>
</configuration>

<security>
<principle name="Token Storage">
  API tokens and secrets are stored in connection configs. Production deployments MUST use encrypted storage or environment variables, never plain text in files or databases.
</principle>

<principle name="Webhook Signature Verification">
  Always verify webhook signatures using verifySignature() before processing payloads. Reject requests with invalid or missing signatures.
</principle>

<principle name="Rate Limiting">
  GitHub API has rate limits (5000 requests/hour authenticated, 60/hour unauthenticated). Track remaining requests via rateLimit field in IntegrationConnection.
</principle>

<principle name="Credential Scope">
  Request minimum required permissions. GitHub tokens should have specific repo access, not full org access. Vercel tokens should be scoped to specific teams.
</principle>

<principle name="Secret Rotation">
  Implement regular rotation of API tokens and webhook secrets. Update connections with updateConnection() when credentials change.
</principle>

<principle name="Input Validation">
  All webhook payloads should be validated against expected schemas before processing. Reject malformed or unexpected data.
</principle>

<principle name="HTTPS Only">
  Production webhook endpoints MUST use HTTPS. HTTP webhooks are only acceptable for local development.
</principle>

<principle name="Error Exposure">
  Do not expose sensitive information in error messages. Log detailed errors server-side, return generic messages to clients.
</principle>
</security>

<patterns>
<pattern name="Basic Integration Hub Setup">
```typescript
import { IntegrationHub } from './integrations/integrationHub';

// Initialize hub for session
const sessionId = "session_12345";
const hub = new IntegrationHub(sessionId);

// Add GitHub connection
const githubId = await hub.addGitHubConnection("Primary GitHub", {
  token: process.env.GITHUB_TOKEN!,
  username: "kenkai",
  defaultBranch: "main"
});

// Add Vercel deployment
const vercelId = await hub.addDeploymentConnection("Production", {
  platform: "vercel",
  apiKey: process.env.VERCEL_TOKEN!,
  teamId: process.env.VERCEL_TEAM_ID
});

// Test connections
const githubTest = await hub.testConnection(githubId);
console.log(`GitHub connected: ${githubTest.success}, ${githubTest.responseTime}ms`);

// Get connection statistics
const stats = hub.getIntegrationStats();
console.log(`Active connections: ${stats.activeConnections}/${stats.totalConnections}`);
```
</pattern>

<pattern name="GitHub PR Workflow">
```typescript
const github = hub.getGitHubManager();
if (!github) throw new Error("GitHub not connected");

// Create feature branch PR
const pr = await github.createPullRequest(
  "kenkai",
  "agent-ironman",
  "Add webhook integration",
  "feature/webhooks",
  "main",
  "Implements webhook handling for GitHub, Vercel, and custom sources",
  false
);

console.log(`Created PR #${pr.number}: ${pr.url}`);

// Get changed files
const files = await github.getPullRequestFiles("kenkai", "agent-ironman", pr.number);
console.log(`Changed ${files.length} files`);

// Create automated review
await github.autoReviewPullRequest(
  "kenkai",
  "agent-ironman",
  pr.number,
  "Automated code review completed",
  [
    {
      path: "server/webhooks.ts",
      line: 42,
      suggestion: "Add input validation for webhook payload",
      severity: "warning"
    }
  ]
);

// Merge when ready
await github.mergePullRequest("kenkai", "agent-ironman", pr.number,
  "feat: Add webhook integration",
  "Merges webhook support",
  "squash"
);
```
</pattern>

<pattern name="Deployment Monitoring">
```typescript
const deploymentManager = hub.getDeploymentManager();
if (!deploymentManager) throw new Error("Deployment not configured");

// Create Vercel deployment
const deployment = await deploymentManager.createDeployment(
  "vercel",
  "prj_abc123xyz",
  {
    target: "production",
    gitSource: {
      type: "github",
      repo: "kenkai/agent-ironman",
      ref: "main"
    }
  }
);

console.log(`Deployment created: ${deployment.id}`);
console.log(`URL: ${deployment.url}`);

// Monitor deployment progress
await deploymentManager.monitorDeployment(
  "vercel",
  deployment.id,
  (updatedDeployment) => {
    console.log(`Status: ${updatedDeployment.state}`);
    if (updatedDeployment.state === "READY") {
      console.log(`Deployment live at: ${updatedDeployment.url}`);
    } else if (updatedDeployment.state === "ERROR") {
      console.error(`Deployment failed: ${updatedDeployment.build.error}`);
    }
  }
);
```
</pattern>

<pattern name="Webhook Event Processing">
```typescript
const webhookManager = hub.getWebhookManager();
if (!webhookManager) throw new Error("Webhooks not configured");

// Create webhook for GitHub pushes
const webhookId = await webhookManager.createWebhook({
  name: "Deploy on Push",
  url: "https://api.example.com/deploy",
  events: ["push"],
  source: "github",
  active: true,
  secret: process.env.WEBHOOK_SECRET!,
  filters: {
    branches: ["main", "develop"]
  },
  actions: {
    triggerWorkflows: ["deploy-production"],
    sendNotifications: true
  }
});

// Process incoming webhook
app.post("/webhooks/:id", async (req, res) => {
  const webhookId = req.params.id;
  const signature = req.headers["x-hub-signature-256"];

  // Verify signature
  const webhook = webhookManager.getWebhook(webhookId);
  if (!webhook || !webhook.secret) {
    return res.status(404).json({ error: "Webhook not found" });
  }

  const isValid = webhookManager.verifySignature(
    JSON.stringify(req.body),
    signature,
    webhook.secret
  );

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process event
  const event = await webhookManager.processWebhook(
    "github",
    req.headers["x-github-event"],
    req.body,
    req.headers
  );

  res.json({ processed: event.processed, eventId: event.id });
});
```
</pattern>

<pattern name="Package Security Audit">
```typescript
const packageManager = hub.getPackageManager();

// Read package.json dependencies
const packageJson = JSON.parse(
  await fs.readFile("package.json", "utf-8")
);

// Check for outdated packages
const check = await packageManager.checkDependencies(
  packageJson.dependencies,
  "npm"
);

console.log("Outdated packages:");
check.outdated.forEach(pkg => {
  console.log(`  ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
});

// Get security report
const securityReport = await packageManager.getSecurityReport(
  packageJson.dependencies,
  "npm"
);

console.log("\nSecurity Summary:");
console.log(`  Critical: ${securityReport.summary.critical}`);
console.log(`  High: ${securityReport.summary.high}`);
console.log(`  Moderate: ${securityReport.summary.moderate}`);
console.log(`  Low: ${securityReport.summary.low}`);

// Get update recommendations
const updates = await packageManager.suggestUpdates(
  packageJson.dependencies,
  "npm",
  { securityOnly: false }
);

console.log("\nRecommended updates:");
updates.recommended.forEach(pkg => {
  console.log(`  ${pkg.name}: ${pkg.current} → ${pkg.recommended}`);
  console.log(`    Risk: ${pkg.riskLevel}, Reason: ${pkg.reason}`);
});

console.log("\nSecurity updates:");
updates.security.forEach(pkg => {
  console.log(`  ${pkg.name}: ${pkg.current} → ${pkg.patched}`);
  console.log(`    Vulnerabilities: ${pkg.vulnerabilities.length}`);
});
```
</pattern>

<pattern name="Multi-Platform Deployment">
```typescript
const deploymentManager = hub.getDeploymentManager();

// Get all projects across platforms
const allProjects = await deploymentManager.getProjects();

console.log("Projects by platform:");
const byPlatform = allProjects.reduce((acc, { platform, project }) => {
  acc[platform] = (acc[platform] || 0) + 1;
  return acc;
}, {});
console.log(byPlatform);

// Deploy to multiple platforms
const deployments = await Promise.all([
  deploymentManager.createDeployment("vercel", "prj_vercel_123"),
  deploymentManager.createDeployment("railway", "prj_railway_456")
]);

console.log("Deployments created:");
deployments.forEach((d, i) => {
  const platform = i === 0 ? "vercel" : "railway";
  console.log(`  ${platform}: ${d.id}`);
});

// Get deployment status across all platforms
const allDeployments = await deploymentManager.getDeployments();
console.log(`Total active deployments: ${allDeployments.length}`);
```
</pattern>

<pattern name="Integration Health Monitoring">
```typescript
// Periodic health check
setInterval(async () => {
  const health = await hub.healthCheck();

  if (health.overall === "error") {
    console.error("Integration system unhealthy!");
    health.connections.forEach(conn => {
      if (conn.status === "error" || conn.errorCount > 5) {
        console.error(`  ${conn.name} (${conn.type}): ${conn.errorCount} errors`);

        // Attempt reconnection
        const testResult = await hub.testConnection(conn.id);
        if (testResult.success) {
          console.log(`    Reconnected successfully`);
        } else {
          console.error(`    Reconnection failed: ${testResult.error}`);
        }
      }
    });
  } else if (health.overall === "warning") {
    console.warn("Integration system has warnings");
  } else {
    console.log("Integration system healthy");
  }

  // Cleanup old data
  const cleanup = await hub.cleanupOldData(7 * 24 * 60 * 60 * 1000); // 7 days
  if (cleanup.eventsRemoved > 0) {
    console.log(`Cleaned ${cleanup.eventsRemoved} old events`);
  }
}, 60000); // Check every minute
```
</pattern>

<pattern name="Error Handling and Retry">
```typescript
async function robustGitHubOperation() {
  const github = hub.getGitHubManager();
  if (!github) throw new Error("GitHub not connected");

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const repos = await github.getRepositories();
      return repos;
    } catch (error) {
      attempt++;

      if (error.message.includes("rate limit")) {
        console.warn(`Rate limit hit, waiting before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      } else if (error.message.includes("401") || error.message.includes("403")) {
        console.error("Authentication failed - token may be invalid");
        throw error; // Don't retry auth errors
      } else if (attempt < maxRetries) {
        console.warn(`Request failed, retrying ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      } else {
        throw error; // Max retries exceeded
      }
    }
  }
}
```
</pattern>
</patterns>

<api-endpoints>
<endpoint path="/api/integrations" method="GET">
  <purpose>List all integration connections</purpose>
  <query>
    <param name="type" type="string" required="false">Filter by integration type</param>
  </query>
  <response>
```json
{
  "connections": [
    {
      "id": "github_xxx",
      "name": "Primary GitHub",
      "type": "github",
      "status": "connected",
      "capabilities": ["get-repositories", "create-pull-request", ...],
      "metadata": {
        "usageCount": 47,
        "lastUsed": 1736265600000
      }
    }
  ]
}
```
  </response>
</endpoint>

<endpoint path="/api/integrations/:id/test" method="POST">
  <purpose>Test integration connection</purpose>
  <response>
```json
{
  "success": true,
  "responseTime": 342,
  "data": { "repositoryCount": 47 }
}
```
  </response>
</endpoint>

<endpoint path="/api/integrations/:id" method="DELETE">
  <purpose>Remove integration connection</purpose>
  <response>
```json
{ "success": true }
```
  </response>
</endpoint>

<endpoint path="/api/integrations/github" method="POST">
  <purpose>Add GitHub connection</purpose>
  <body>
```json
{
  "name": "Primary GitHub",
  "config": {
    "token": "ghp_xxx",
    "username": "kenkai",
    "defaultBranch": "main"
  }
}
```
  </body>
  <response>
```json
{ "connectionId": "github_xxx" }
```
  </response>
</endpoint>

<endpoint path="/api/integrations/deployment" method="POST">
  <purpose>Add deployment platform connection</purpose>
  <body>
```json
{
  "name": "Production Vercel",
  "config": {
    "platform": "vercel",
    "apiKey": "xxx",
    "teamId": "team_xxx"
  }
}
```
  </body>
</endpoint>

<endpoint path="/api/integrations/stats" method="GET">
  <purpose>Get integration statistics</purpose>
  <response>
```json
{
  "totalConnections": 5,
  "connectionsByType": { "github": 2, "vercel": 1 },
  "activeConnections": 4,
  "totalEvents": 127,
  "eventsByType": { "success": 98, "error": 12 }
}
```
  </response>
</endpoint>

<endpoint path="/api/webhooks" method="POST">
  <purpose>Create webhook endpoint</purpose>
  <body>
```json
{
  "name": "Deploy on Push",
  "url": "https://api.example.com/deploy",
  "events": ["push"],
  "source": "github",
  "active": true,
  "filters": { "branches": ["main"] }
}
```
  </body>
</endpoint>

<endpoint path="/webhooks/:id" method="POST">
  <purpose>Receive webhook event</purpose>
  <headers>
    <header name="x-hub-signature-256" type="string">GitHub webhook signature</header>
    <header name="x-github-event" type="string">Event type</header>
  </headers>
  <body>GitHub webhook payload (varies by event type)</body>
  <response>
```json
{
  "processed": true,
  "eventId": "event_xxx"
}
```
  </response>
</endpoint>

<endpoint path="/api/packages/:registry/search" method="GET">
  <purpose>Search packages</purpose>
  <query>
    <param name="q" type="string" required="true">Search query</param>
    <param name="limit" type="number" required="false">Max results</param>
  </query>
  <response>
```json
{
  "packages": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 20
}
```
  </response>
</endpoint>

<endpoint path="/api/packages/:registry/:name" method="GET">
  <purpose>Get package details</purpose>
  <response>
```json
{
  "name": "express",
  "version": "4.19.2",
  "description": "Fast, unopinionated, minimalist web framework",
  "dependencies": {...},
  "devDependencies": {...}
}
```
  </response>
</endpoint>
</api-endpoints>

<examples>
<example name="Complete Integration Setup">
```typescript
import { IntegrationHub } from './integrations/integrationHub';
import express from 'express';

const app = express();
const hub = new IntegrationHub("prod_session");

// Setup all integrations
async function setupIntegrations() {
  try {
    // GitHub
    const githubId = await hub.addGitHubConnection("Production GitHub", {
      token: process.env.GITHUB_TOKEN!,
      username: "kenkai"
    });
    console.log(`GitHub connected: ${githubId}`);

    // Vercel
    const vercelId = await hub.addDeploymentConnection("Vercel Production", {
      platform: "vercel",
      apiKey: process.env.VERCEL_TOKEN!,
      teamId: process.env.VERCEL_TEAM_ID
    });
    console.log(`Vercel connected: ${vercelId}`);

    // Webhooks
    const webhookId = await hub.addWebhookConnection("GitHub Webhooks", {
      name: "github-events",
      url: "https://api.example.com/webhooks/github",
      events: ["push", "pull_request", "release"],
      source: "github",
      active: true,
      secret: process.env.WEBHOOK_SECRET!,
      filters: { branches: ["main", "develop"] }
    });
    console.log(`Webhook configured: ${webhookId}`);

    // Test all connections
    const connections = hub.getConnections();
    for (const conn of connections) {
      const test = await hub.testConnection(conn.id);
      console.log(`${conn.name}: ${test.success ? 'OK' : 'FAILED'} (${test.responseTime}ms)`);
    }

    return true;
  } catch (error) {
    console.error("Integration setup failed:", error);
    return false;
  }
}

// API routes
app.get("/api/integrations", (req, res) => {
  const type = req.query.type as string;
  const connections = hub.getConnections(type);
  res.json({ connections });
});

app.get("/api/integrations/stats", (req, res) => {
  const stats = hub.getIntegrationStats();
  res.json(stats);
});

app.post("/webhooks/:id", async (req, res) => {
  const webhookManager = hub.getWebhookManager();
  if (!webhookManager) {
    return res.status(503).json({ error: "Webhooks not configured" });
  }

  const event = await webhookManager.processWebhook(
    "github",
    req.headers["x-github-event"] as string,
    req.body,
    req.headers as any
  );

  res.json({ processed: event.processed, eventId: event.id });
});

// Start
setupIntegrations().then(success => {
  if (success) {
    app.listen(3003, () => console.log("Integration Hub running on port 3003"));
  } else {
    process.exit(1);
  }
});
```
</example>
</examples>

<troubleshooting>
<issue name="GitHub Authentication Failures">
  <symptoms>401 or 403 errors when calling GitHub API</symptoms>
  <causes>
    - Expired or invalid token
    - Insufficient token scopes
    - Rate limit exceeded
    - IP address blocked
  </causes>
  <solutions>
    1. Verify token is valid: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user`
    2. Check token scopes include: repo, read:org, user:email
    3. Check rate limit: GET /rate_limit endpoint
    4. Generate new token with correct scopes if needed
  </solutions>
</issue>

<issue name="Webhook Signature Verification Fails">
  <symptoms>verifySignature() returns false</symptoms>
  <causes>
    - Incorrect webhook secret
    - Payload modified in transit
    - Charset encoding mismatch
    - Secret not set on webhook source
  </causes>
  <solutions>
    1. Verify webhook secret matches configured secret on source platform
    2. Use raw request body (not parsed JSON) for signature verification
    3. Ensure UTF-8 encoding for payload
    4. Log received signature and computed signature for debugging
  </solutions>
</issue>

<issue name="Deployment Monitoring Stuck">
  <symptoms>monitorDeployment() never completes</symptoms>
  <causes>
    - Deployment in failed state but not reporting error
    - Polling interval too short hitting rate limits
    - Network issues preventing status updates
  </causes>
  <solutions>
    1. Check deployment state directly via platform API
    2. Implement timeout for monitoring (max 15 minutes)
    3. Add error handling in onUpdate callback
    4. Increase polling interval if rate limiting occurs
  </solutions>
</issue>

<issue name="Package Security Report Empty">
  <symptoms>getSecurityReport() returns no vulnerabilities for known vulnerable packages</symptoms>
  <causes>
    - GitHub Advisory Database API rate limiting
    - Package name mismatch
    - Vulnerabilities not yet in database
  </causes>
  <solutions>
    1. Check rate limit status
    2. Verify exact package name matches registry
    3. Cross-reference with npm audit or Snyk for comparison
    4. Use fallback security tools if API unavailable
  </solutions>
</issue>

<issue name="Connection Health Check Shows Errors">
  <symptoms>healthCheck() returns 'error' status</symptoms>
  <causes>
    - Repeated API failures
    - Network connectivity issues
    - Stale connection configuration
  </causes>
  <solutions>
    1. Review connection error history: getEventsByConnection()
    2. Test each connection individually: testConnection()
    3. Update configuration if credentials changed
    4. Remove and re-add connection to reset state
  </solutions>
</issue>
</troubleshooting>

<best-practices>
<practice name="Connection Lifecycle Management">
  Always test connections after creation and periodically check health. Remove inactive connections to reduce overhead. Use healthCheck() before critical operations.
</practice>

<practice name="Event History Management">
  Implement regular cleanup with cleanupOldData() to prevent unbounded memory growth. Default 30-day retention is suitable for most applications.
</practice>

<practice name="Error Recovery">
  Implement exponential backoff for API retries. Don't retry authentication errors. Log all errors to connection metadata for debugging.
</practice>

<practice name="Webhook Security">
  Always verify signatures. Use HTTPS endpoints in production. Implement request size limits and rate limiting on webhook receivers.
</practice>

<practice name="Token Security">
  Store tokens in environment variables or secure vaults, never in code or configuration files. Rotate tokens regularly. Use minimum required scopes.
</practice>

<practice name="Rate Limit Management">
  Track API usage through rateLimit field. Implement queuing for bulk operations. Cache frequently accessed data when possible.
</practice>

<practice name="Multi-Platform Deployments">
  Use unified DeploymentManager interface for consistent deployment workflows across platforms. Handle platform-specific quirks in integration classes, not application code.
</practice>

<practice name="Package Updates">
  Run security audits before updates. Test updates in non-production environments. Use suggestUpdates() risk levels to prioritize changes. Always review breaking changes in major version updates.
</practice>
</best-practices>
