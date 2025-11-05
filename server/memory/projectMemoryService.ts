/**
 * Project Memory Service
 * Store and retrieve project-specific context and memory
 */

export interface ProjectContext {
  id: string;
  projectId: string;
  path: string;
  content: string;
  metadata: {
    type: string;
    tags: string[];
    timestamp: number;
    relevance: number;
  };
}

export interface MemoryQuery {
  projectId: string;
  query: string;
  limit?: number;
  filters?: {
    type?: string;
    tags?: string[];
    minRelevance?: number;
  };
}

export class ProjectMemoryService {
  private memories: Map<string, ProjectContext[]> = new Map();

  async storeContext(context: ProjectContext): Promise<void> {
    const projectMemories = this.memories.get(context.projectId) || [];
    projectMemories.push(context);
    this.memories.set(context.projectId, projectMemories);
  }

  async retrieveRelevantContext(
    projectId: string,
    query: string,
    limit: number = 5
  ): Promise<ProjectContext[]> {
    const projectMemories = this.memories.get(projectId) || [];

    // Simple relevance-based filtering
    return projectMemories
      .sort((a, b) => b.metadata.relevance - a.metadata.relevance)
      .slice(0, limit);
  }

  async queryMemory(query: MemoryQuery): Promise<ProjectContext[]> {
    const projectMemories = this.memories.get(query.projectId) || [];
    let filtered = projectMemories;

    if (query.filters) {
      filtered = filtered.filter(memory => {
        if (query.filters?.type && memory.metadata.type !== query.filters.type) {
          return false;
        }
        if (query.filters?.tags && !query.filters.tags.some(tag => memory.metadata.tags.includes(tag))) {
          return false;
        }
        if (query.filters?.minRelevance && memory.metadata.relevance < query.filters.minRelevance) {
          return false;
        }
        return true;
      });
    }

    return filtered.slice(0, query.limit || 10);
  }

  async getProjectSummary(projectId: string): Promise<{
    totalMemories: number;
    types: Record<string, number>;
    recentActivity: ProjectContext[];
  }> {
    const projectMemories = this.memories.get(projectId) || [];

    const types: Record<string, number> = {};
    projectMemories.forEach(memory => {
      types[memory.metadata.type] = (types[memory.metadata.type] || 0) + 1;
    });

    const recentActivity = projectMemories
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
      .slice(0, 10);

    return {
      totalMemories: projectMemories.length,
      types,
      recentActivity
    };
  }

  async clearProjectMemory(projectId: string): Promise<void> {
    this.memories.delete(projectId);
  }

  async getAllProjects(): Promise<string[]> {
    return Array.from(this.memories.keys());
  }
}

// Singleton instance
export const projectMemory = new ProjectMemoryService();
