/**
 * Task Queue Client for Python Worker Integration
 * Enqueues AI tasks to Celery via Redis
 */

import { randomUUID } from "crypto";
import Redis from "ioredis";

interface TaskOptions {
  taskName: string;
  args?: any[];
  kwargs?: Record<string, any>;
  queue?: string;
}

interface TaskResult {
  taskId: string;
  status: "queued";
  taskName: string;
}

/**
 * Redis-based Task Queue Client
 * Integrates with Python Celery worker
 */
class TaskQueueClient {
  private redisHost: string;
  private redisPort: number;
  private redisDb: number;
  private redis: Redis | null = null;

  constructor() {
    this.redisHost = process.env.REDIS_HOST || "localhost";
    this.redisPort = parseInt(process.env.REDIS_PORT || "6379");
    this.redisDb = parseInt(process.env.REDIS_DB || "0");
  }

  /**
   * Get or create Redis client
   */
  private getRedisClient(): Redis {
    if (!this.redis) {
      this.redis = new Redis({
        host: this.redisHost,
        port: this.redisPort,
        db: this.redisDb,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on("error", (err) => {
        console.error("❌ Redis connection error:", err);
      });

      this.redis.on("connect", () => {
        console.log("✅ Redis connected for task queue");
      });
    }
    return this.redis;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /**
   * Enqueue a task to the Python worker
   * Uses Celery's message protocol
   */
  async enqueueTask(options: TaskOptions): Promise<TaskResult> {
    const taskId = randomUUID();
    const { taskName, args = [], kwargs = {}, queue = "celery" } = options;

    // Celery message format
    const message = {
      body: Buffer.from(
        JSON.stringify([args, kwargs, { callbacks: null, errbacks: null, chain: null, chord: null }])
      ).toString("base64"),
      "content-encoding": "utf-8",
      "content-type": "application/json",
      headers: {
        lang: "js",
        task: taskName,
        id: taskId,
        retries: 0,
        eta: null,
        expires: null,
      },
      properties: {
        correlation_id: taskId,
        reply_to: randomUUID(),
        delivery_mode: 2,
        delivery_info: {
          exchange: "",
          routing_key: queue,
        },
        priority: 0,
        body_encoding: "base64",
        delivery_tag: randomUUID(),
      },
    };

    try {
      const redis = this.getRedisClient();

      // Serialize the Celery message
      const serializedMessage = JSON.stringify(message);

      // Push to the Celery queue (list in Redis)
      await redis.lpush(queue, serializedMessage);

      console.log(`📤 Task enqueued: ${taskName} (${taskId}) → queue: ${queue}`);

      return {
        taskId,
        status: "queued",
        taskName,
      };
    } catch (error) {
      console.error("❌ Failed to enqueue task:", error);
      throw new Error(`Failed to enqueue task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enqueue RAG query task
   */
  async enqueueRAGQuery(
    collectionName: string,
    query: string,
    nContextDocs: number = 3
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "rag.query_with_context",
      kwargs: {
        collection_name: collectionName,
        query: query,
        n_context_docs: nContextDocs,
      },
    });
  }

  /**
   * Enqueue document parsing task
   */
  async enqueueDocumentParse(filePath: string): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "documents.parse",
      kwargs: {
        file_path: filePath,
      },
    });
  }

  /**
   * Enqueue multi-agent task
   */
  async enqueueMultiAgent(
    agents: Array<{ role: string; task_description?: string }>,
    task: string,
    mode: "sequential" | "parallel" = "sequential"
  ): Promise<TaskResult> {
    const taskName =
      mode === "sequential"
        ? "agents.multi_agent_sequential"
        : "agents.multi_agent_parallel";

    return this.enqueueTask({
      taskName,
      kwargs: {
        agents,
        initial_task: task,
        pass_context: true,
      },
    });
  }

  /**
   * Enqueue document indexing workflow
   */
  async enqueueDocumentWorkflow(
    filePath: string,
    collectionName: string,
    generateSummary: boolean = true
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "workflows.document_to_knowledge_base",
      kwargs: {
        file_path: filePath,
        collection_name: collectionName,
        generate_summary: generateSummary,
      },
    });
  }

  /**
   * Enqueue research workflow
   */
  async enqueueResearchWorkflow(
    topic: string,
    collectionName: string,
    reportStyle: string = "comprehensive"
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "workflows.research_and_report",
      kwargs: {
        topic,
        collection_name: collectionName,
        report_style: reportStyle,
      },
    });
  }

  /**
   * Enqueue content creation workflow
   */
  async enqueueContentPipeline(
    topic: string,
    contentType: string = "blog_post",
    tone: string = "professional",
    length: string = "medium"
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "workflows.content_pipeline",
      kwargs: {
        topic,
        content_type: contentType,
        tone,
        length,
      },
    });
  }

  // ==================== Pydantic AI Tasks ====================

  /**
   * Enqueue type-safe code analysis with Pydantic AI
   */
  async enqueuePydanticCodeAnalysis(
    code: string,
    language?: string,
    context?: string,
    useOpenAI: boolean = false
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "pydantic.analyze_code",
      kwargs: {
        code,
        language,
        context,
        use_openai: useOpenAI,
      },
    });
  }

  /**
   * Enqueue type-safe data analysis with Pydantic AI
   */
  async enqueuePydanticDataAnalysis(
    dataDescription: string,
    datasetSummary?: string,
    specificQuestions?: string[],
    useOpenAI: boolean = false
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "pydantic.analyze_data",
      kwargs: {
        data_description: dataDescription,
        dataset_summary: datasetSummary,
        specific_questions: specificQuestions,
        use_openai: useOpenAI,
      },
    });
  }

  /**
   * Enqueue long-running task with checkpointing
   */
  async enqueuePydanticLongTask(
    taskDescription: string,
    checkpointData?: Record<string, any>
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "pydantic.run_long_task",
      kwargs: {
        task_description: taskDescription,
        checkpoint_data: checkpointData,
      },
    });
  }

  /**
   * Compare Claude vs GPT-4 code analysis side-by-side
   */
  async enqueuePydanticModelComparison(
    code: string,
    language?: string
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "pydantic.compare_models",
      kwargs: {
        code,
        language,
      },
    });
  }

  /**
   * Batch validate multiple code files
   */
  async enqueuePydanticBatchValidation(
    codeFiles: Array<{ filename: string; code: string; language?: string }>,
    useOpenAI: boolean = false
  ): Promise<TaskResult> {
    return this.enqueueTask({
      taskName: "pydantic.validate_code_batch",
      kwargs: {
        code_files: codeFiles,
        use_openai: useOpenAI,
      },
    });
  }
}

// Singleton instance
export const taskQueue = new TaskQueueClient();

// Example usage helpers
export const AITasks = {
  /**
   * Query knowledge base with RAG
   */
  async queryKnowledgeBase(collection: string, query: string) {
    return taskQueue.enqueueRAGQuery(collection, query);
  },

  /**
   * Parse and analyze document
   */
  async analyzeDocument(filePath: string) {
    return taskQueue.enqueueDocumentParse(filePath);
  },

  /**
   * Run multi-agent research
   */
  async research(topic: string, collection: string) {
    return taskQueue.enqueueResearchWorkflow(topic, collection);
  },

  /**
   * Generate content with AI pipeline
   */
  async createContent(topic: string, type: string = "blog_post") {
    return taskQueue.enqueueContentPipeline(topic, type);
  },

  /**
   * Index document to knowledge base
   */
  async indexDocument(filePath: string, collection: string) {
    return taskQueue.enqueueDocumentWorkflow(filePath, collection);
  },

  // ==================== Pydantic AI Helpers ====================

  /**
   * Analyze code quality with type-safe Pydantic AI agent
   * @param code - Source code to analyze
   * @param language - Programming language (optional, auto-detected)
   * @param options - Additional options
   * @returns Task result with validated CodeAnalysisResult
   */
  async analyzeCodeWithPydantic(
    code: string,
    language?: string,
    options?: { context?: string; useOpenAI?: boolean }
  ) {
    return taskQueue.enqueuePydanticCodeAnalysis(
      code,
      language,
      options?.context,
      options?.useOpenAI || false
    );
  },

  /**
   * Analyze data with type-safe Pydantic AI agent
   * @param dataDescription - Description of the dataset
   * @param options - Additional options
   * @returns Task result with validated DataAnalysisResult
   */
  async analyzeDataWithPydantic(
    dataDescription: string,
    options?: {
      datasetSummary?: string;
      specificQuestions?: string[];
      useOpenAI?: boolean;
    }
  ) {
    return taskQueue.enqueuePydanticDataAnalysis(
      dataDescription,
      options?.datasetSummary,
      options?.specificQuestions,
      options?.useOpenAI || false
    );
  },

  /**
   * Run long-running task with checkpointing support
   * @param taskDescription - What the task should accomplish
   * @param checkpointData - Previous checkpoint for resumption
   * @returns Task result with LongRunningTaskResult
   */
  async runLongTask(taskDescription: string, checkpointData?: Record<string, any>) {
    return taskQueue.enqueuePydanticLongTask(taskDescription, checkpointData);
  },

  /**
   * Compare Claude vs GPT-4 code analysis side-by-side
   * @param code - Source code to analyze
   * @param language - Programming language
   * @returns Comparison results from both models
   */
  async compareModels(code: string, language?: string) {
    return taskQueue.enqueuePydanticModelComparison(code, language);
  },

  /**
   * Batch validate multiple code files
   * @param files - Array of code files to analyze
   * @param useOpenAI - Use GPT-4 instead of Claude
   * @returns Batch validation results
   */
  async batchValidateCode(
    files: Array<{ filename: string; code: string; language?: string }>,
    useOpenAI: boolean = false
  ) {
    return taskQueue.enqueuePydanticBatchValidation(files, useOpenAI);
  },
};
