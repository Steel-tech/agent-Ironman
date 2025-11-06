/**
 * Personal Knowledge Base Component
 * AI-powered documentation hub with search and learning capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Star,
  Clock,
  Tag,
  Code,
  Lightbulb,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  Brain,
  TrendingUp,
  Award
} from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: 'snippet' | 'pattern' | 'solution' | 'reference' | 'note' | 'insight';
  category: string;
  tags: string[];
  projectId?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  importance: number;
  confidence: number;
  sources: Array<{
    type: 'conversation' | 'code' | 'documentation' | 'learning' | 'external' | 'generated';
    reference: string;
    confidence: number;
    timestamp: number;
  }>;
  relatedEntries: string[];
  created: number;
  updated: number;
  accessed: number;
  accessCount: number;
  rating?: number;
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

interface KnowledgeSearchResult {
  entry: KnowledgeEntry;
  score: number;
  matchReasons: string[];
}

interface PersonalKnowledgeBaseProps {
  onCreateEntry?: (entry: Partial<KnowledgeEntry>) => void;
  onUpdateEntry?: (id: string, updates: Partial<KnowledgeEntry>) => void;
  onDeleteEntry?: (id: string) => void;
}

const TYPE_ICONS = {
  snippet: Code,
  pattern: Brain,
  solution: Lightbulb,
  reference: BookOpen,
  note: Edit,
  insight: TrendingUp
};

const TYPE_COLORS = {
  snippet: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  pattern: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
  solution: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  reference: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
  note: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100',
  insight: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
};

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  intermediate: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  advanced: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
  expert: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
};

export function PersonalKnowledgeBase({
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry
}: PersonalKnowledgeBaseProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all',
    difficulty: 'all',
    sortBy: 'relevance'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    entriesByType: {},
    averageRating: 0,
    mostAccessed: [],
    recentAdditions: []
  });

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    } else {
      loadKnowledgeBase();
    }
  }, [searchQuery, filter]);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API
      const mockEntries: KnowledgeEntry[] = [
        {
          id: '1',
          title: 'React Component Best Practices',
          content: 'Key practices for building React components:\n\n1. Use functional components with hooks\n2. Implement proper prop types\n3. Keep components small and focused\n4. Use memoization for expensive operations\n5. Handle loading and error states\n\nExample:\n```jsx\nconst MyComponent = ({ data }) => {\n  const [loading, setLoading] = useState(false);\n  const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);\n  \n  if (loading) return <Loading />;\n  return <div>{memoizedValue}</div>;\n};\n```',
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
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
          }],
          relatedEntries: [],
          created: Date.now() - 7 * 24 * 60 * 60 * 1000,
          updated: Date.now() - 2 * 24 * 60 * 60 * 1000,
          accessed: Date.now() - 1 * 24 * 60 * 60 * 1000,
          accessCount: 15,
          rating: 5,
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
          id: '2',
          title: 'Git Workflow Optimization',
          content: 'Optimal Git workflow patterns for development teams:\n\n1. Use feature branches for new work\n2. Commit frequently with descriptive messages\n3. Use pull requests for code review\n4. Keep main branch stable\n5. Use rebase for clean history\n\nBranch naming convention:\n- feature/feature-name\n- bugfix/issue-number-description\n- hotfix/critical-fix-description',
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
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
          }],
          relatedEntries: [],
          created: Date.now() - 5 * 24 * 60 * 60 * 1000,
          updated: Date.now() - 1 * 24 * 60 * 60 * 1000,
          accessed: Date.now() - 12 * 60 * 60 * 1000,
          accessCount: 23,
          rating: 4,
          metadata: {
            keywords: ['git', 'workflow', 'branches', 'commits', 'pull-requests'],
            estimatedTimeToMaster: 90,
            prerequisites: ['git-basics'],
            relatedSkills: ['collaboration', 'code-review']
          }
        },
        {
          id: '3',
          title: 'Node.js Performance Optimization',
          content: 'Performance optimization techniques for Node.js applications:\n\n1. Use async/await properly\n2. Implement caching strategies\n3. Optimize database queries\n4. Use clustering for CPU-intensive tasks\n5. Monitor memory usage\n\nCode example:\n```javascript\n// Implementing caching\nconst cache = new Map();\n\nasync function getCachedData(key) {\n  if (cache.has(key)) {\n    return cache.get(key);\n  }\n  const data = await fetchData(key);\n  cache.set(key, data);\n  return data;\n}\n```',
          type: 'solution',
          category: 'backend',
          tags: ['nodejs', 'performance', 'optimization', 'caching'],
          difficulty: 'advanced',
          importance: 7,
          confidence: 0.85,
          sources: [{
            type: 'conversation',
            reference: 'conversation-nodejs-perf',
            confidence: 0.9,
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
          }],
          relatedEntries: ['1'],
          created: Date.now() - 3 * 24 * 60 * 60 * 1000,
          updated: Date.now() - 3 * 24 * 60 * 60 * 1000,
          accessed: Date.now() - 2 * 24 * 60 * 60 * 1000,
          accessCount: 8,
          rating: 4,
          metadata: {
            language: 'javascript',
            framework: 'nodejs',
            keywords: ['nodejs', 'performance', 'caching', 'optimization'],
            estimatedTimeToMaster: 180,
            prerequisites: ['nodejs-basics', 'javascript-async'],
            relatedSkills: ['database-optimization', 'monitoring']
          }
        }
      ];

      setEntries(mockEntries);
      if (!searchQuery) {
        setSearchResults(mockEntries.map(entry => ({
          entry,
          score: 1,
          matchReasons: []
        })));
      }

      // Calculate stats
      const stats = {
        totalEntries: mockEntries.length,
        entriesByType: mockEntries.reduce((acc, entry) => {
          acc[entry.type] = (acc[entry.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageRating: mockEntries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / mockEntries.length,
        mostAccessed: mockEntries.sort((a, b) => b.accessCount - a.accessCount).slice(0, 5),
        recentAdditions: mockEntries.sort((a, b) => b.created - a.created).slice(0, 5)
      };
      setStats(stats);

    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      loadKnowledgeBase();
      return;
    }

    try {
      setLoading(true);
      // Simple search implementation - in real app would call API
      const results = entries
        .map(entry => {
          const score = calculateSearchScore(entry, searchQuery);
          const matchReasons = getMatchReasons(entry, searchQuery);
          return { entry, score, matchReasons };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSearchScore = (entry: KnowledgeEntry, query: string): number => {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title matches (highest weight)
    if (entry.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Tag matches (high weight)
    entry.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 5;
      }
    });

    // Content matches (medium weight)
    if (entry.content.toLowerCase().includes(queryLower)) {
      score += 3;
    }

    // Category matches
    if (entry.category.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    // Importance boost
    score += entry.importance * 0.5;

    return score;
  };

  const getMatchReasons = (entry: KnowledgeEntry, query: string): string[] => {
    const reasons: string[] = [];
    const queryLower = query.toLowerCase();

    if (entry.title.toLowerCase().includes(queryLower)) {
      reasons.push('Title match');
    }

    const matchingTags = entry.tags.filter(tag => tag.toLowerCase().includes(queryLower));
    if (matchingTags.length > 0) {
      reasons.push(`Tags: ${matchingTags.join(', ')}`);
    }

    if (entry.content.toLowerCase().includes(queryLower)) {
      reasons.push('Content match');
    }

    if (entry.category.toLowerCase().includes(queryLower)) {
      reasons.push('Category match');
    }

    return reasons;
  };

  const handleSelectEntry = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    // Update access count
    onUpdateEntry?.(entry.id, {
      accessed: Date.now(),
      accessCount: entry.accessCount + 1
    });
  };

  const handleRateEntry = (entryId: string, rating: number) => {
    onUpdateEntry?.(entryId, { rating });
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(prev => prev ? { ...prev, rating } : null);
    }
  };

  const handleCreateEntry = (entryData: Partial<KnowledgeEntry>) => {
    onCreateEntry?.(entryData);
    setShowCreateForm(false);
    loadKnowledgeBase();
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      onDeleteEntry?.(entryId);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
      loadKnowledgeBase();
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Personal Knowledge Base
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

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Personal Knowledge Base
              <Badge variant="secondary" className="ml-2">
                {stats.totalEntries} entries
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
              <div className="text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.averageRating.toFixed(1)} ⭐
              </div>
              <div className="text-muted-foreground">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.mostAccessed[0]?.accessCount || 0}
              </div>
              <div className="text-muted-foreground">Most Accessed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.recentAdditions.length}
              </div>
              <div className="text-muted-foreground">Recent Additions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="snippet">Snippets</option>
              <option value="pattern">Patterns</option>
              <option value="solution">Solutions</option>
              <option value="reference">References</option>
              <option value="note">Notes</option>
              <option value="insight">Insights</option>
            </select>
            <select
              value={filter.difficulty}
              onChange={(e) => setFilter(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border rounded"
            >
              <option value="relevance">Relevance</option>
              <option value="created">Recently Created</option>
              <option value="updated">Recently Updated</option>
              <option value="accessed">Recently Accessed</option>
              <option value="rating">Highest Rated</option>
              <option value="importance">Most Important</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {searchQuery ? `Search Results (${searchResults.length})` : 'All Entries'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {searchResults.map((result) => {
                    const entry = result.entry;
                    const TypeIcon = TYPE_ICONS[entry.type];

                    return (
                      <div
                        key={entry.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedEntry?.id === entry.id ? 'border-blue-300 bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectEntry(entry)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-3 flex-1">
                            <TypeIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium truncate">{entry.title}</h4>
                                <Badge variant="outline" className={TYPE_COLORS[entry.type]}>
                                  {entry.type}
                                </Badge>
                                <Badge variant="outline" className={DIFFICULTY_COLORS[entry.difficulty]}>
                                  {entry.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {entry.content}
                              </p>

                              {/* Metadata */}
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(entry.updated)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>{entry.rating || 'Not rated'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Award className="h-3 w-3" />
                                  <span>{entry.importance}/10</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{entry.accessCount} views</span>
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {entry.tags.slice(0, 5).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {entry.tags.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{entry.tags.length - 5} more
                                  </Badge>
                                )}
                              </div>

                              {/* Search match reasons */}
                              {result.matchReasons.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  Match: {result.matchReasons.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No entries found matching your search.' : 'No entries in your knowledge base yet.'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Selected entry details */}
        <div className="lg:col-span-1">
          {selectedEntry ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedEntry.title}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(selectedEntry.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">Rating:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 cursor-pointer ${
                                star <= (selectedEntry.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              onClick={() => handleRateEntry(selectedEntry.id, star)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Content:</h5>
                      <div className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {selectedEntry.content}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Details:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <Badge variant="outline" className={TYPE_COLORS[selectedEntry.type]}>
                            {selectedEntry.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span>{selectedEntry.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Difficulty:</span>
                          <Badge variant="outline" className={DIFFICULTY_COLORS[selectedEntry.difficulty]}>
                            {selectedEntry.difficulty}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Importance:</span>
                          <span>{selectedEntry.importance}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>{Math.round(selectedEntry.confidence * 100)}%</span>
                        </div>
                        {selectedEntry.metadata.estimatedTimeToMaster && (
                          <div className="flex justify-between">
                            <span>Time to Master:</span>
                            <span>{formatDuration(selectedEntry.metadata.estimatedTimeToMaster)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Tags:</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntry.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {selectedEntry.metadata.prerequisites && selectedEntry.metadata.prerequisites.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Prerequisites:</h5>
                        <ul className="text-sm list-disc list-inside">
                          {selectedEntry.metadata.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sources */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Sources:</h5>
                      <div className="space-y-1">
                        {selectedEntry.sources.map((source, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            <span className="font-medium">{source.type}:</span> {source.reference}
                            <span className="ml-2">({Math.round(source.confidence * 100)}% confidence)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Statistics:</h5>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Created: {formatTime(selectedEntry.created)}</div>
                        <div>Updated: {formatTime(selectedEntry.updated)}</div>
                        <div>Accessed: {selectedEntry.accessCount} times</div>
                        <div>Last accessed: {formatTime(selectedEntry.accessed)}</div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select an entry to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create entry modal - would implement this as a separate component */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-2/3 max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Create New Knowledge Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Create entry form would go here...</p>
              <div className="flex justify-end mt-4 space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateForm(false)}>
                  Create Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}