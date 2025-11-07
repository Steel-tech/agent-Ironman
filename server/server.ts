/**
 * Agent Ironman - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Check for --setup flag before starting the server
if (process.argv.includes('--setup')) {
  const { runSetup } = await import('../setup');
  await runSetup();
  process.exit(0);
}

// Check for OAuth flags before starting the server
// Run cli.ts as a separate process to avoid importing server modules
const oauthFlag = process.argv.find(arg =>
  arg === '--login' || arg === 'login' ||
  arg === '--logout' || arg === 'logout' ||
  arg === '--status' || arg === 'status' || arg === '--auth-status'
);

if (oauthFlag) {
  const proc = Bun.spawn(['bun', 'run', 'cli.ts', oauthFlag], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;
  process.exit(exitCode);
}

import { watch } from "fs";
import { getDefaultWorkingDirectory, ensureDirectory } from "./directoryUtils";
import { handleStaticFile } from "./staticFileServer";
import { initializeStartup, checkNodeAvailability } from "./startup";
import { handleSessionRoutes } from "./routes/sessions";
import { handleDirectoryRoutes } from "./routes/directory";
import { handleUserConfigRoutes } from "./routes/userConfig";
import { handleCommandRoutes } from "./routes/commands";
import { handleAIRoutes } from "./routes/ai";
import { handlePythonRoutes } from "./routes/python";
import { handleWorkflowRoutes } from "./routes/workflows";
import { handlePydanticAIRoutes } from "./routes/pydantic-ai";
import { handleWebSocketMessage } from "./websocket/messageHandlers";
import { ProjectMemoryService } from "./memory/projectMemoryService";
import { PythonEnvironmentManager } from "./python/pythonManager";
import { WorkflowEngine } from "./workflows/workflowEngine";
import { PydanticAIManager } from "./pydantic-ai/pydanticAIManager";
import {
  PersonalLearningEngine,
  PredictiveSuggestions,
  PersonalKnowledgeBase,
  HabitTracking
} from "./ai";
import type { ServerWebSocket, Server as ServerType } from "bun";

// Initialize startup configuration (loads env vars, sets up PostCSS)
const { isStandalone: IS_STANDALONE, binaryDir: BINARY_DIR, postcss, tailwindcss, autoprefixer } = await initializeStartup();

// Check Node.js availability for Claude SDK subprocess
await checkNodeAvailability();

// Initialize default working directory
const DEFAULT_WORKING_DIR = getDefaultWorkingDirectory();
ensureDirectory(DEFAULT_WORKING_DIR);

// Hot reload WebSocket clients
interface HotReloadClient {
  send: (message: string) => void;
}

// Chat WebSocket clients
interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Store active queries for mid-stream control
const activeQueries = new Map<string, unknown>();

// Store project memory services, Python managers, and workflow engines per session
const sessionMemoryServices = new Map<string, ProjectMemoryService>();
const sessionPythonManagers = new Map<string, PythonEnvironmentManager>();
const sessionWorkflowEngines = new Map<string, WorkflowEngine>();
const sessionPydanticAIManagers = new Map<string, PydanticAIManager>();

// Store AI services per session
const sessionLearningEngines = new Map<string, PersonalLearningEngine>();
const sessionPredictiveSuggestions = new Map<string, PredictiveSuggestions>();
const sessionKnowledgeBases = new Map<string, PersonalKnowledgeBase>();
const sessionHabitTracking = new Map<string, HabitTracking>();

const hotReloadClients = new Set<HotReloadClient>();

/**
 * Get or create project memory service for a session
 */
export function getProjectMemoryService(sessionId: string): ProjectMemoryService {
  let service = sessionMemoryServices.get(sessionId);
  if (!service) {
    service = new ProjectMemoryService(sessionId);
    sessionMemoryServices.set(sessionId, service);
  }
  return service;
}

/**
 * Get or create Python environment manager for a session
 */
export function getPythonManager(sessionId: string): PythonEnvironmentManager {
  let manager = sessionPythonManagers.get(sessionId);
  if (!manager) {
    manager = new PythonEnvironmentManager(sessionId);
    sessionPythonManagers.set(sessionId, manager);
  }
  return manager;
}

/**
 * Get or create workflow engine for a session
 */
export function getWorkflowEngine(sessionId: string): WorkflowEngine {
  let engine = sessionWorkflowEngines.get(sessionId);
  if (!engine) {
    engine = new WorkflowEngine(sessionId);
    sessionWorkflowEngines.set(sessionId, engine);
  }
  return engine;
}

/**
 * Get or create PydanticAI manager for a session
 */
export function getPydanticAIManager(sessionId: string): PydanticAIManager {
  let manager = sessionPydanticAIManagers.get(sessionId);
  if (!manager) {
    manager = new PydanticAIManager(sessionId);
    sessionPydanticAIManagers.set(sessionId, manager);
  }
  return manager;
}

/**
 * Get or create personal learning engine for a session
 */
export function getLearningEngine(sessionId: string): PersonalLearningEngine {
  let engine = sessionLearningEngines.get(sessionId);
  if (!engine) {
    engine = new PersonalLearningEngine(sessionId);
    sessionLearningEngines.set(sessionId, engine);
  }
  return engine;
}

/**
 * Get or create predictive suggestions for a session
 */
export function getPredictiveSuggestions(sessionId: string): PredictiveSuggestions {
  let suggestions = sessionPredictiveSuggestions.get(sessionId);
  if (!suggestions) {
    suggestions = new PredictiveSuggestions(sessionId);
    sessionPredictiveSuggestions.set(sessionId, suggestions);
  }
  return suggestions;
}

/**
 * Get or create knowledge base for a session
 */
export function getKnowledgeBase(sessionId: string): PersonalKnowledgeBase {
  let kb = sessionKnowledgeBases.get(sessionId);
  if (!kb) {
    kb = new PersonalKnowledgeBase(sessionId);
    sessionKnowledgeBases.set(sessionId, kb);
  }
  return kb;
}

/**
 * Get or create habit tracking for a session
 */
export function getHabitTracking(sessionId: string): HabitTracking {
  let tracking = sessionHabitTracking.get(sessionId);
  if (!tracking) {
    tracking = new HabitTracking(sessionId);
    sessionHabitTracking.set(sessionId, tracking);
  }
  return tracking;
}

/**
 * Get all AI services for a session
 */
export function getAIServices(sessionId: string) {
  return {
    learning: getLearningEngine(sessionId),
    suggestions: getPredictiveSuggestions(sessionId),
    knowledge: getKnowledgeBase(sessionId),
    habits: getHabitTracking(sessionId)
  };
}

/**
 * Clean up session resources when session ends
 */
export function cleanupSession(sessionId: string): void {
  sessionMemoryServices.delete(sessionId);
  sessionPythonManagers.delete(sessionId);
  sessionWorkflowEngines.delete(sessionId);
  sessionPydanticAIManagers.delete(sessionId);
  sessionLearningEngines.delete(sessionId);
  sessionPredictiveSuggestions.delete(sessionId);
  sessionKnowledgeBases.delete(sessionId);
  sessionHabitTracking.delete(sessionId);
}

// Watch for file changes (hot reload) - only in dev mode
if (!IS_STANDALONE) {
  watch('./client', { recursive: true }, (_eventType, filename) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css') || filename.endsWith('.html'))) {
      // Notify all hot reload clients
      hotReloadClients.forEach(client => {
        try {
          client.send(JSON.stringify({ type: 'reload' }));
        } catch {
          hotReloadClients.delete(client);
        }
      });
    }
  });
}

const server = Bun.serve({
  port: 3003,
  idleTimeout: 255, // 4.25 minutes (Bun's maximum) - keepalive messages every 30s prevent timeout

  websocket: {
    open(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.add(ws);
      }
      // Session ID is assigned in first message, not on connection
    },

    async message(ws: ServerWebSocket<ChatWebSocketData>, message: string) {
      await handleWebSocketMessage(ws, message, activeQueries);
    },

    close(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.delete(ws);
      } else if (ws.data?.type === 'chat' && ws.data?.sessionId) {
        console.log(`🔌 WebSocket disconnected: session ${ws.data.sessionId.substring(0, 8)}`);
      }
    }
  },

  async fetch(req: Request, server: ServerType<ChatWebSocketData>) {
    const url = new URL(req.url);

    // WebSocket endpoints
    if (url.pathname === '/hot-reload') {
      const upgraded = server.upgrade(req, { data: { type: 'hot-reload' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, { data: { type: 'chat' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    // Try session routes
    const sessionResponse = await handleSessionRoutes(req, url, activeQueries);
    if (sessionResponse) {
      return sessionResponse;
    }

    // Try AI routes
    const aiResponse = await handleAIRoutes(req, url);
    if (aiResponse) {
      return aiResponse;
    }

    // Try Python routes
    const pythonResponse = await handlePythonRoutes(req, url);
    if (pythonResponse) {
      return pythonResponse;
    }

    // Try workflow routes
    const workflowResponse = await handleWorkflowRoutes(req, url);
    if (workflowResponse) {
      return workflowResponse;
    }

    // Try PydanticAI routes
    const pydanticAIResponse = await handlePydanticAIRoutes(req, url);
    if (pydanticAIResponse) {
      return pydanticAIResponse;
    }

    // Try directory routes
    const directoryResponse = await handleDirectoryRoutes(req, url);
    if (directoryResponse) {
      return directoryResponse;
    }

    // Try user config routes
    const userConfigResponse = await handleUserConfigRoutes(req, url);
    if (userConfigResponse) {
      return userConfigResponse;
    }

    // Try command routes
    const commandResponse = await handleCommandRoutes(req, url);
    if (commandResponse) {
      return commandResponse;
    }

    // Try to handle as static file
    const staticResponse = await handleStaticFile(req, {
      binaryDir: BINARY_DIR,
      isStandalone: IS_STANDALONE,
      postcss,
      tailwindcss,
      autoprefixer,
    });

    if (staticResponse) {
      return staticResponse;
    }

    return new Response('Not Found', { status: 404 });
  },
});

// ASCII Art Banner
console.log('\n');
console.log('  █████╗  ██████╗ ███████╗███╗   ██╗████████╗    ██╗██████╗  ██████╗ ███╗   ██╗███╗   ███╗ █████╗ ███╗   ██╗');
console.log(' ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██║██╔══██╗██╔═══██╗████╗  ██║████╗ ████║██╔══██╗████╗  ██║');
console.log(' ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ██║██████╔╝██║   ██║██╔██╗ ██║██╔████╔██║███████║██╔██╗ ██║');
console.log(' ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██║██╔══██╗██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║██║╚██╗██║');
console.log(' ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ██║██║  ██║╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║██║ ╚████║');
console.log(' ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝');
console.log('\n');
console.log(`  👉 Open here: http://localhost:${server.port}`);
console.log('\n');
console.log('  ═══════════════════════════════════════════════════════════════════════════');
console.log('\n');
console.log('  All logs will show below this:');
console.log('\n');
