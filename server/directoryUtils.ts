/**
 * Agent Ironman - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 Ken Kai
 *
 * SPDX-License-Identifier: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get the default working directory for agent operations
 * Cross-platform: ~/Documents/agent-ironman (Mac/Linux) or C:\Users\{user}\Documents\agent-ironman (Windows)
 */
export function getDefaultWorkingDirectory(): string {
  const homeDir = os.homedir();
  const defaultDir = path.join(homeDir, 'Documents', 'agent-ironman');

  // Startup logs are now consolidated in server.ts
  // console.log('🏠 Platform:', os.platform());
  // console.log('🏠 Home directory:', homeDir);
  // console.log('🏠 Default working directory:', defaultDir);

  return defaultDir;
}

/**
 * Get the app data directory for storing database and app files
 * Cross-platform: ~/Documents/agent-ironman-app
 */
export function getAppDataDirectory(): string {
  const homeDir = os.homedir();
  const appDataDir = path.join(homeDir, 'Documents', 'agent-ironman-app');

  return appDataDir;
}

/**
 * Expand tilde (~) in path to actual home directory
 * Works cross-platform
 */
export function expandPath(dirPath: string): string {
  if (!dirPath) return dirPath;

  // If path starts with ~, replace with home directory
  if (dirPath.startsWith('~/') || dirPath === '~') {
    const homeDir = os.homedir();
    const expanded = dirPath === '~'
      ? homeDir
      : path.join(homeDir, dirPath.slice(2));

    console.log('🔄 Path expansion:', {
      original: dirPath,
      expanded: expanded
    });

    return expanded;
  }

  // Return absolute path as-is
  return path.resolve(dirPath);
}

/**
 * Validate that a directory exists and is accessible
 */
export function validateDirectory(dirPath: string): { valid: boolean; error?: string; expanded?: string } {
  try {
    // Expand path first
    const expanded = expandPath(dirPath);

    // Check if path exists
    if (!fs.existsSync(expanded)) {
      console.warn('⚠️  Directory does not exist:', expanded);
      return {
        valid: false,
        error: 'Directory does not exist',
        expanded
      };
    }

    // Check if it's actually a directory (follows symlinks)
    const stats = fs.statSync(expanded);
    if (!stats.isDirectory()) {
      console.warn('⚠️  Path is not a directory:', expanded);
      return {
        valid: false,
        error: 'Path is not a directory',
        expanded
      };
    }

    // Check if it's a symbolic link (log warning but allow)
    const lstat = fs.lstatSync(expanded);
    if (lstat.isSymbolicLink()) {
      console.warn('⚠️  Path is a symbolic link:', expanded);
      console.log('🔗 Symlink target:', fs.realpathSync(expanded));
    }

    // Check read/write permissions by attempting to access
    try {
      fs.accessSync(expanded, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      console.warn('⚠️  No read/write permissions:', expanded);
      return {
        valid: false,
        error: 'No read/write permissions',
        expanded
      };
    }

    // Additional safety check: ensure directory is accessible
    try {
      fs.readdirSync(expanded);
    } catch {
      console.warn('⚠️  Directory not accessible:', expanded);
      return {
        valid: false,
        error: 'Directory not accessible (may be deleted or moved)',
        expanded
      };
    }

    // Silent success - only log errors
    return {
      valid: true,
      expanded
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Directory validation error:', errorMessage);
    return {
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Create directory if it doesn't exist (including parent directories)
 */
export function ensureDirectory(dirPath: string): boolean {
  try {
    const expanded = expandPath(dirPath);

    if (fs.existsSync(expanded)) {
      console.log('📁 Directory already exists:', expanded);
      return true;
    }

    // Create directory recursively
    fs.mkdirSync(expanded, { recursive: true });
    console.log('✅ Directory created:', expanded);
    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to create directory:', errorMessage);
    return false;
  }
}

/**
 * Get platform-specific information for diagnostic logging
 */
export function getPlatformInfo(): {
  os: string;
  platform: string;
  home: string;
  arch: string;
  version: string;
} {
  const info = {
    os: os.type(),
    platform: os.platform(),
    home: os.homedir(),
    arch: os.arch(),
    version: os.release()
  };

  // Startup logs are now consolidated in server.ts
  // console.log('💻 Platform info:', info);
  return info;
}
