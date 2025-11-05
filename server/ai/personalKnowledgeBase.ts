/**
 * Personal Knowledge Base
 * AI-powered documentation hub that learns from user interactions and creates personalized knowledge
 */

import { createHash, randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { personalLearning } from './personalLearning';
import { projectMemory, type ProjectContext } from '../memory/projectMemoryService';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: 'snippet' | 'pattern' | 'solution' | 'reference' | 'note' | 'insight';
  category: string;
  tags: string[];
  projectId?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  importance: number; // 1-10
  confidence: number; // 0-1
  sources: KnowledgeSource[];
  relatedEntries: string[];
  created: number;
  updated: number;
  accessed: number;
  accessCount: number;
  rating?: number; // 1-5, user rating
  userNotes?: string;
  metadata: {
    language?: string;
    framework?: string;
    keywords: string[];
    estimatedTimeToMaster?: number;
    prerequisites?: string[];
    relatedSkills?: string[];
  };
}

export interface KnowledgeSource {
  type: 'conversation' | 'code' | 'documentation' | 'learning' | 'external' | 'generated';
  reference: string;
  confidence: number;
  timestamp: number;
}

export interface KnowledgeSearchQuery {
  query: string;
  type?: KnowledgeEntry['type'][];
  category?: string[];
  tags?: string[];
  difficulty?: KnowledgeEntry['difficulty'][];
  importance?: number;
  project?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  sortBy?: 'relevance' | 'created' | 'updated' | 'accessed' | 'rating' | 'importance';
  limit?: number;
}

export interface KnowledgeSearchResult {
  entry: KnowledgeEntry;
  score: number;
  matchReasons: string[];
}

export interface KnowledgeStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  entriesByCategory: Record<string, number>;
  entriesByDifficulty: Record<string, number>;
  averageRating: number;
  mostAccessed: KnowledgeEntry[];
  recentAdditions: KnowledgeEntry[];
  knowledgeGaps: string[];
}

export class PersonalKnowledgeBase {
  private dbPath: string;
  private indexDbPath: string;
  private entries: Map<string, KnowledgeEntry> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // word -> entry IDs
  private categoryIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private lastAnalyzed = 0;

  constructor(dataPath: string = './data') {
    this.dbPath = path.join(dataPath, 'knowledgeBase.json');
    this.indexDbPath = path.join(dataPath, 'knowledgeIndex.json');
    this.loadKnowledgeBase();
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      const [data, indexData] = await Promise.all([
        fs.readFile(this.dbPath, 'utf-8'),
        fs.readFile(this.indexDbPath, 'utf-8').catch(() => '{}')
      ]);

      const entries: KnowledgeEntry[] = JSON.parse(data);
      entries.forEach(entry => {
        this.entries.set(entry.id, entry);
      });

      const indices = JSON.parse(indexData);
      this.searchIndex = new Map(Object.entries(indices.searchIndex || {}));
      this.categoryIndex = new Map(Object.entries(indices.categoryIndex || {}));
      this.tagIndex = new Map(Object.entries(indices.tagIndex || {}));

    } catch (error) {
      console.log('No existing knowledge base found, starting fresh');
      await this.initializeKnowledgeBase();
    }
  }

  private async initializeKnowledgeBase(): Promise<void> {
    // Create initial knowledge entries based on common patterns
    const initialEntries: Omit<KnowledgeEntry, 'id' | 'created' | 'updated'>[] = [
      {
        title: 'React Component Best Practices',
        content: 'Key practices for building React components: 1) Use functional components with hooks 2) Implement proper prop types 3) Keep components small and focused 4) Use memoization for expensive operations 5) Handle loading and error states',
        type: 'pattern',
        category: 'frontend',
        tags: ['react', 'components', 'best-practices', 'hooks'],
        difficulty: 'intermediate',
        importance: 8,
        confidence: 0.9,
        sources: [{
          type: 'generated',
          reference: 'initial-knowledge',
          confidence: 0.8,
          timestamp: Date.now()
        }],
        relatedEntries: [],
        accessed: 0,
        accessCount: 0,
        metadata: {
          language: 'javascript',
          framework: 'react',
          keywords: ['react', 'components', 'hooks', 'functional'],
          estimatedTimeToMaster: 120,
          prerequisites: ['javascript-basics', 'jsx-syntax'],
          relatedSkills: ['state-management', 'component-testing']
        }
      },
      {
        title: 'Git Workflow Optimization',
        content: 'Optimal Git workflow patterns: 1) Use feature branches for new work 2) Commit frequently with descriptive messages 3) Use pull requests for code review 4) Keep main branch stable 5) Use rebase for clean history',
        type: 'pattern',
        category: 'development',
        tags: ['git', 'workflow', 'version-control', 'best-practices'],
        difficulty: 'intermediate',
        importance: 9,
        confidence: 0.95,
        sources: [{
          type: 'generated',
          reference: 'initial-knowledge',
          confidence: 0.9,
          timestamp: Date.now()
        }],
        relatedEntries: [],
        accessed: 0,
        accessCount: 0,
        metadata: {
          keywords: ['git', 'workflow', 'branches', 'commits', 'pull-requests'],
          estimatedTimeToMaster: 90,
          prerequisites: ['git-basics'],
          relatedSkills: ['collaboration', 'code-review']
        }
      }
    ];

    for (const entryData of initialEntries) {
      await this.addKnowledgeEntry(entryData);
    }
  }

  async addKnowledgeEntry(entryData: Omit<KnowledgeEntry, 'id' | 'created' | 'updated'>): Promise<string> {
    const entry: KnowledgeEntry = {
      ...entryData,
      id: randomUUID(),
      created: Date.now(),
      updated: Date.now()
    };

    this.entries.set(entry.id, entry);
    this.updateSearchIndex(entry);
    await this.saveKnowledgeBase();

    return entry.id;
  }

  async updateKnowledgeEntry(id: string, updates: Partial<Omit<KnowledgeEntry, 'id' | 'created'>>): Promise<boolean> {
    const existing = this.entries.get(id);
    if (!existing) return false;

    const updated: KnowledgeEntry = {
      ...existing,
      ...updates,
      updated: Date.now()
    };

    this.entries.set(id, updated);
    this.updateSearchIndex(updated);
    await this.saveKnowledgeBase();

    return true;
  }

  async deleteKnowledgeEntry(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.entries.delete(id);
    this.removeFromSearchIndex(entry);
    await this.saveKnowledgeBase();

    return true;
  }

  async searchKnowledge(query: KnowledgeSearchQuery): Promise<KnowledgeSearchResult[]> {
    const startTime = Date.now();
    let candidates = Array.from(this.entries.values());

    // Apply filters
    if (query.type && query.type.length > 0) {
      candidates = candidates.filter(entry => query.type!.includes(entry.type));
    }

    if (query.category && query.category.length > 0) {
      candidates = candidates.filter(entry => query.category!.includes(entry.category));
    }

    if (query.tags && query.tags.length > 0) {
      candidates = candidates.filter(entry =>
        query.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    if (query.difficulty && query.difficulty.length > 0) {
      candidates = candidates.filter(entry => query.difficulty!.includes(entry.difficulty));
    }

    if (query.importance) {
      candidates = candidates.filter(entry => entry.importance >= query.importance!);
    }

    if (query.project) {
      candidates = candidates.filter(entry => entry.projectId === query.project);
    }

    if (query.timeRange) {
      candidates = candidates.filter(entry =>
        entry.created >= query.timeRange!.start && entry.created <= query.timeRange!.end
      );
    }

    // Calculate relevance scores
    const results: KnowledgeSearchResult[] = candidates.map(entry => {
      const { score, reasons } = this.calculateRelevanceScore(entry, query);
      return {
        entry,
        score,
        matchReasons: reasons
      };
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply secondary sorting
    if (query.sortBy) {
      this.applySecondarySorting(results, query.sortBy);
    }

    // Update access count for returned entries
    results.slice(0, query.limit || 10).forEach(result => {
      const entry = this.entries.get(result.entry.id);
      if (entry) {
        entry.accessed = Date.now();
        entry.accessCount += 1;
      }
    });

    await this.saveKnowledgeBase();

    const searchTime = Date.now() - startTime;
    console.log(`Knowledge search completed in ${searchTime}ms, found ${results.length} results`);

    return results.slice(0, query.limit || 10);
  }

  private calculateRelevanceScore(entry: KnowledgeEntry, query: KnowledgeSearchQuery): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Text matching
    if (query.query) {
      const queryWords = query.query.toLowerCase().split(/\s+/);
      const titleWords = entry.title.toLowerCase().split(/\s+/);
      const contentWords = entry.content.toLowerCase().split(/\s+/);
      const tagWords = entry.tags.map(tag => tag.toLowerCase());

      // Title matches (highest weight)
      const titleMatches = queryWords.filter(word => titleWords.some(titleWord => titleWord.includes(word)));
      if (titleMatches.length > 0) {
        score += titleMatches.length * 10;
        reasons.push(`${titleMatches.length} title matches`);
      }

      // Tag matches (high weight)
      const tagMatches = queryWords.filter(word => tagWords.some(tagWord => tagWord.includes(word)));
      if (tagMatches.length > 0) {
        score += tagMatches.length * 8;
        reasons.push(`${tagMatches.length} tag matches`);
      }

      // Content matches (medium weight)
      const contentMatches = queryWords.filter(word => contentWords.some(contentWord => contentWord.includes(word)));
      if (contentMatches.length > 0) {
        score += contentMatches.length * 3;
        reasons.push(`${contentMatches.length} content matches`);
      }

      // Exact phrase match (very high weight)
      if (entry.title.toLowerCase().includes(query.query.toLowerCase()) ||
          entry.content.toLowerCase().includes(query.query.toLowerCase())) {
        score += 15;
        reasons.push('Exact phrase match');
      }
    }

    // Importance boost
    score += entry.importance * 2;

    // Confidence boost
    score += entry.confidence * 5;

    // Access frequency boost (popular content)
    if (entry.accessCount > 0) {
      score += Math.log(entry.accessCount) * 2;
    }

    // Rating boost
    if (entry.rating) {
      score += entry.rating * 2;
    }

    // Recency boost (slight preference for recent content)
    const daysSinceCreated = (Date.now() - entry.created) / (24 * 60 * 60 * 1000);
    if (daysSinceCreated < 30) {
      score += 2;
      reasons.push('Recently added');
    }

    return { score, reasons };
  }

  private applySecondarySorting(results: KnowledgeSearchResult[], sortBy: string): void {
    results.sort((a, b) => {
      // Primary sort is already by score
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }

      // Secondary sort
      switch (sortBy) {
        case 'created':
          return b.entry.created - a.entry.created;
        case 'updated':
          return b.entry.updated - a.entry.updated;
        case 'accessed':
          return b.entry.accessed - a.entry.accessed;
        case 'rating':
          return (b.entry.rating || 0) - (a.entry.rating || 0);
        case 'importance':
          return b.entry.importance - a.entry.importance;
        default:
          return b.score - a.score;
      }
    });
  }

  async learnFromConversation(conversationData: {
    messages: Array<{ role: string; content: string; timestamp: number }>;
    context: string;
    outcome?: string;
    projectId?: string;
  }): Promise<string[]> {
    const learnedEntries: string[] = [];

    // Analyze conversation for potential knowledge entries
    const patterns = this.extractKnowledgePatterns(conversationData);

    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        const entryId = await this.addKnowledgeEntry({
          title: pattern.title,
          content: pattern.content,
          type: pattern.type,
          category: pattern.category,
          tags: pattern.tags,
          projectId: conversationData.projectId,
          difficulty: this.estimateDifficulty(pattern.content),
          importance: this.estimateImportance(pattern),
          confidence: pattern.confidence,
          sources: [{
            type: 'conversation',
            reference: `conversation-${Date.now()}`,
            confidence: pattern.confidence,
            timestamp: Date.now()
          }],
          relatedEntries: [],
          accessed: 0,
          accessCount: 0,
          metadata: {
            keywords: pattern.keywords,
            estimatedTimeToMaster: this.estimateTimeToMaster(pattern.content),
            prerequisites: pattern.prerequisites || []
          }
        });

        learnedEntries.push(entryId);
      }
    }

    return learnedEntries;
  }

  private extractKnowledgePatterns(conversationData: any): Array<{
    title: string;
    content: string;
    type: KnowledgeEntry['type'];
    category: string;
    tags: string[];
    confidence: number;
    keywords: string[];
    prerequisites?: string[];
  }> {
    const patterns: Array<{
      title: string;
      content: string;
      type: KnowledgeEntry['type'];
      category: string;
      tags: string[];
      confidence: number;
      keywords: string[];
      prerequisites?: string[];
    }> = [];
    const messages = conversationData.messages;

    // Look for solution patterns
    const solutionPatterns = this.findSolutionPatterns(messages);
    patterns.push(...solutionPatterns);

    // Look for code snippets
    const snippetPatterns = this.findSnippetPatterns(messages);
    patterns.push(...snippetPatterns);

    // Look for insights
    const insightPatterns = this.findInsightPatterns(messages);
    patterns.push(...insightPatterns);

    return patterns;
  }

  private findSolutionPatterns(messages: any[]): any[] {
    const patterns: Array<{
      title: string;
      content: string;
      type: KnowledgeEntry['type'];
      category: string;
      tags: string[];
      confidence: number;
      keywords: string[];
      prerequisites?: string[];
    }> = [];

    // Look for problem-solution pairs
    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      if (current.role === 'user' && this.isProblemStatement(current.content) &&
          next.role === 'assistant' && this.isSolution(next.content)) {

        patterns.push({
          title: this.extractTitleFromSolution(next.content),
          content: this.extractSolutionContent(next.content),
          type: 'solution' as const,
          category: this.inferCategory(next.content),
          tags: this.extractTags(next.content),
          confidence: 0.8,
          keywords: this.extractKeywords(next.content)
        });
      }
    }

    return patterns;
  }

  private findSnippetPatterns(messages: any[]): any[] {
    const patterns: Array<{
      title: string;
      content: string;
      type: KnowledgeEntry['type'];
      category: string;
      tags: string[];
      confidence: number;
      keywords: string[];
      prerequisites?: string[];
    }> = [];

    messages.forEach(message => {
      if (message.content.includes('```')) {
        const snippets = this.extractCodeSnippets(message.content);
        snippets.forEach(snippet => {
          patterns.push({
            title: snippet.title || 'Code Snippet',
            content: snippet.content,
            type: 'snippet' as const,
            category: this.inferCategory(snippet.content),
            tags: [...this.extractTags(snippet.content), 'code'],
            confidence: 0.75,
            keywords: this.extractKeywords(snippet.content)
          });
        });
      }
    });

    return patterns;
  }

  private findInsightPatterns(messages: any[]): any[] {
    const patterns: Array<{
      title: string;
      content: string;
      type: KnowledgeEntry['type'];
      category: string;
      tags: string[];
      confidence: number;
      keywords: string[];
      prerequisites?: string[];
    }> = [];

    messages.forEach(message => {
      if (message.role === 'assistant' && this.isInsightful(message.content)) {
        patterns.push({
          title: this.extractInsightTitle(message.content),
          content: message.content,
          type: 'insight' as const,
          category: 'learning',
          tags: ['insight', 'learning'],
          confidence: 0.7,
          keywords: this.extractKeywords(message.content)
        });
      }
    });

    return patterns;
  }

  // Helper methods for pattern extraction
  private isProblemStatement(content: string): boolean {
    const problemIndicators = ['error', 'issue', 'problem', 'help', 'stuck', 'confused', 'not working'];
    return problemIndicators.some(indicator => content.toLowerCase().includes(indicator));
  }

  private isSolution(content: string): boolean {
    const solutionIndicators = ['solution', 'fix', 'here\'s how', 'try this', 'you can', 'the answer is'];
    return solutionIndicators.some(indicator => content.toLowerCase().includes(indicator));
  }

  private isInsightful(content: string): boolean {
    const insightIndicators = ['insight', 'pattern', 'principle', 'best practice', 'tip', 'recommendation'];
    return insightIndicators.some(indicator => content.toLowerCase().includes(indicator));
  }

  private extractTitleFromSolution(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : 'Solution Pattern';
  }

  private extractInsightTitle(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100 && !trimmed.startsWith('```')) {
        return trimmed;
      }
    }
    return 'Insight';
  }

  private extractSolutionContent(content: string): string {
    // Remove markdown and extract clean content
    return content
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim();
  }

  private extractCodeSnippets(content: string): Array<{ title?: string; content: string }> {
    const snippets = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      snippets.push({
        title: `${language} Code Snippet`,
        content: code
      });
    }

    return snippets;
  }

  private inferCategory(content: string): string {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('react') || contentLower.includes('component') || contentLower.includes('jsx')) {
      return 'frontend';
    }
    if (contentLower.includes('node') || contentLower.includes('express') || contentLower.includes('api')) {
      return 'backend';
    }
    if (contentLower.includes('python') || contentLower.includes('django') || contentLower.includes('flask')) {
      return 'python';
    }
    if (contentLower.includes('git') || contentLower.includes('commit') || contentLower.includes('branch')) {
      return 'development';
    }
    if (contentLower.includes('test') || contentLower.includes('spec') || contentLower.includes('jest')) {
      return 'testing';
    }

    return 'general';
  }

  private extractTags(content: string): string[] {
    const tags = new Set<string>();
    const contentLower = content.toLowerCase();

    // Common technology tags
    const techTags = ['react', 'vue', 'angular', 'node', 'express', 'python', 'django', 'flask',
                     'javascript', 'typescript', 'git', 'docker', 'aws', 'database', 'sql', 'nosql',
                     'testing', 'jest', 'cypress', 'api', 'rest', 'graphql'];

    techTags.forEach(tag => {
      if (contentLower.includes(tag)) {
        tags.add(tag);
      }
    });

    // Extract words that look like tags (single words, all lowercase)
    const words = contentLower.match(/\b[a-z]+\b/g) || [];
    words.forEach(word => {
      if (word.length > 3 && word.length < 20) {
        tags.add(word);
      }
    });

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  private extractKeywords(content: string): string[] {
    // Extract meaningful keywords (simplified version)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common words
    const stopWords = ['this', 'that', 'with', 'from', 'they', 'have', 'been', 'said', 'each', 'which', 'their', 'time', 'will'];
    const keywords = words.filter(word => !stopWords.includes(word));

    return keywords.slice(0, 15);
  }

  private extractPrerequisites(content: string): string[] {
    const prerequisites: string[] = [];

    // Look for prerequisite indicators
    const prereqPatterns = [
      /you should know (\w+)/gi,
      /requires (\w+)/gi,
      /make sure you have (\w+)/gi,
      /assuming you know (\w+)/gi
    ];

    prereqPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const prereq = match.replace(/you should know |requires |make sure you have |assuming you know /gi, '').trim();
          if (prereq.length > 0) {
            prerequisites.push(prereq);
          }
        });
      }
    });

    return prerequisites.slice(0, 5);
  }

  private estimateDifficulty(content: string): KnowledgeEntry['difficulty'] {
    const contentLower = content.toLowerCase();

    // Look for difficulty indicators
    if (contentLower.includes('beginner') || contentLower.includes('basic') || contentLower.includes('simple')) {
      return 'beginner';
    }
    if (contentLower.includes('advanced') || contentLower.includes('complex') || contentLower.includes('expert')) {
      return 'advanced';
    }
    if (contentLower.includes('expert') || contentLower.includes('master') || contentLower.includes('professional')) {
      return 'expert';
    }

    // Estimate based on content complexity
    const codeBlocks = (content.match(/```/g) || []).length;
    const technicalTerms = contentLower.match(/\b(api|endpoint|database|algorithm|architecture|framework)\b/g) || [];

    if (codeBlocks > 3 || technicalTerms.length > 5) {
      return 'advanced';
    } else if (codeBlocks > 1 || technicalTerms.length > 2) {
      return 'intermediate';
    }

    return 'beginner';
  }

  private estimateImportance(pattern: any): number {
    let importance = 5; // Base importance

    // Boost based on content indicators
    if (pattern.content.includes('security')) importance += 2;
    if (pattern.content.includes('performance')) importance += 1;
    if (pattern.content.includes('best practice')) importance += 2;
    if (pattern.tags.includes('critical') || pattern.tags.includes('important')) importance += 2;

    // Boost based on category
    if (pattern.category === 'security') importance += 2;
    if (pattern.category === 'testing') importance += 1;

    return Math.min(10, importance);
  }

  private estimateTimeToMaster(content: string): number {
    // Estimate time in minutes based on content length and complexity
    const wordCount = content.split(/\s+/).length;
    const codeBlocks = (content.match(/```/g) || []).length;

    let baseTime = Math.max(10, wordCount / 10); // 1 minute per 10 words, minimum 10 minutes
    baseTime += codeBlocks * 15; // Add 15 minutes per code block

    return Math.round(baseTime);
  }

  private updateSearchIndex(entry: KnowledgeEntry): void {
    // Update text search index
    const words = [
      ...entry.title.toLowerCase().split(/\s+/),
      ...entry.content.toLowerCase().split(/\s+/),
      ...entry.tags.map(tag => tag.toLowerCase())
    ];

    words.forEach(word => {
      if (word.length > 2) {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(entry.id);
      }
    });

    // Update category index
    if (!this.categoryIndex.has(entry.category)) {
      this.categoryIndex.set(entry.category, new Set());
    }
    this.categoryIndex.get(entry.category)!.add(entry.id);

    // Update tag index
    entry.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(entry.id);
    });
  }

  private removeFromSearchIndex(entry: KnowledgeEntry): void {
    // Remove from text search index
    const words = [
      ...entry.title.toLowerCase().split(/\s+/),
      ...entry.content.toLowerCase().split(/\s+/),
      ...entry.tags.map(tag => tag.toLowerCase())
    ];

    words.forEach(word => {
      if (this.searchIndex.has(word)) {
        this.searchIndex.get(word)!.delete(entry.id);
        if (this.searchIndex.get(word)!.size === 0) {
          this.searchIndex.delete(word);
        }
      }
    });

    // Remove from category index
    if (this.categoryIndex.has(entry.category)) {
      this.categoryIndex.get(entry.category)!.delete(entry.id);
      if (this.categoryIndex.get(entry.category)!.size === 0) {
        this.categoryIndex.delete(entry.category);
      }
    }

    // Remove from tag index
    entry.tags.forEach(tag => {
      if (this.tagIndex.has(tag)) {
        this.tagIndex.get(tag)!.delete(entry.id);
        if (this.tagIndex.get(tag)!.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  async getKnowledgeStats(): Promise<KnowledgeStats> {
    const entries = Array.from(this.entries.values());

    // Total entries
    const totalEntries = entries.length;

    // Entries by type
    const entriesByType: Record<string, number> = {};
    entries.forEach(entry => {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    });

    // Entries by category
    const entriesByCategory: Record<string, number> = {};
    entries.forEach(entry => {
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
    });

    // Entries by difficulty
    const entriesByDifficulty: Record<string, number> = {};
    entries.forEach(entry => {
      entriesByDifficulty[entry.difficulty] = (entriesByDifficulty[entry.difficulty] || 0) + 1;
    });

    // Average rating
    const ratedEntries = entries.filter(entry => entry.rating !== undefined);
    const averageRating = ratedEntries.length > 0
      ? ratedEntries.reduce((sum, entry) => sum + entry.rating!, 0) / ratedEntries.length
      : 0;

    // Most accessed
    const mostAccessed = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Recent additions
    const recentAdditions = entries
      .sort((a, b) => b.created - a.created)
      .slice(0, 10);

    // Knowledge gaps (categories with low coverage)
    const knowledgeGaps = this.identifyKnowledgeGaps(entriesByCategory);

    return {
      totalEntries,
      entriesByType,
      entriesByCategory,
      entriesByDifficulty,
      averageRating,
      mostAccessed,
      recentAdditions,
      knowledgeGaps
    };
  }

  private identifyKnowledgeGaps(entriesByCategory: Record<string, number>): string[] {
    const expectedCategories = [
      'frontend', 'backend', 'database', 'testing', 'security', 'performance',
      'deployment', 'monitoring', 'documentation', 'design', 'architecture'
    ];

    return expectedCategories.filter(category =>
      !entriesByCategory[category] || entriesByCategory[category] < 3
    );
  }

  private async saveKnowledgeBase(): Promise<void> {
    try {
      const entries = Array.from(this.entries.values());
      const indices = {
        searchIndex: Object.fromEntries(this.searchIndex),
        categoryIndex: Object.fromEntries(this.categoryIndex),
        tagIndex: Object.fromEntries(this.tagIndex)
      };

      await Promise.all([
        fs.writeFile(this.dbPath, JSON.stringify(entries, null, 2)),
        fs.writeFile(this.indexDbPath, JSON.stringify(indices, null, 2))
      ]);
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
    }
  }

  async exportKnowledgeBase(format: 'json' | 'markdown' = 'json'): Promise<string> {
    const entries = Array.from(this.entries.values());

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    if (format === 'markdown') {
      return entries.map(entry => {
        let markdown = `# ${entry.title}\n\n`;
        markdown += `**Type:** ${entry.type}\n`;
        markdown += `**Category:** ${entry.category}\n`;
        markdown += `**Difficulty:** ${entry.difficulty}\n`;
        markdown += `**Importance:** ${entry.importance}/10\n`;
        if (entry.tags.length > 0) {
          markdown += `**Tags:** ${entry.tags.join(', ')}\n`;
        }
        markdown += `\n${entry.content}\n`;

        if (entry.metadata.prerequisites && entry.metadata.prerequisites.length > 0) {
          markdown += `\n**Prerequisites:** ${entry.metadata.prerequisites.join(', ')}\n`;
        }

        markdown += `\n---\n`;
        return markdown;
      }).join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

// Singleton instance
export const personalKnowledgeBase = new PersonalKnowledgeBase();