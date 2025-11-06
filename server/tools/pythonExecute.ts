/**
 * Agent Ironman - Python Execute Tool
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { PythonEnvironmentManager, PythonExecutionResult } from '../python/pythonManager';
import { getPythonManager } from '../server';

/**
 * Python Execute Tool Parameters
 */
export interface PythonExecuteParams {
  code: string;
  environment?: string;
  workingDirectory?: string;
  captureOutput?: boolean;
  timeout?: number;
}

/**
 * Python Execute Tool Result
 */
export interface PythonExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  packagesUsed?: string[];
  outputFiles?: string[];
  error?: string;
}

/**
 * Python Execute Tool Implementation
 *
 * This tool allows agents to execute Python code with full environment management.
 * It integrates with the PythonEnvironmentManager to handle virtual environments,
 * package installation, and proper Python execution.
 *
 * Usage examples:
 * - Data analysis: "Run this pandas analysis on the CSV file"
 * - Machine learning: "Train this scikit-learn model"
 * - Web scraping: "Execute this BeautifulSoup scraper"
 * - Backend testing: "Run this FastAPI endpoint test"
 */
export async function pythonExecute(
  sessionId: string,
  params: PythonExecuteParams
): Promise<PythonExecuteResult> {
  try {
    // Get Python manager for this session
    const pythonManager = getPythonManager(sessionId);

    // Execute the Python code
    const result = await pythonManager.executePythonCode(
      params.code,
      params.environment,
      params.workingDirectory
    );

    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      packagesUsed: result.packagesUsed,
      outputFiles: result.outputFiles,
      error: result.exitCode !== 0 ? `Process exited with code ${result.exitCode}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: -1,
      executionTime: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Python Package Management Tool
 */
export interface PythonPackageParams {
  action: 'install' | 'uninstall' | 'list' | 'freeze';
  package?: string;
  version?: string;
  environment?: string;
  requirements?: string[];
}

export interface PythonPackageResult {
  success: boolean;
  packages?: Array<{
    name: string;
    version: string;
  }>;
  requirements?: string;
  output?: string;
  error?: string;
}

/**
 * Install or manage Python packages
 */
export async function pythonPackageManage(
  sessionId: string,
  params: PythonPackageParams
): Promise<PythonPackageResult> {
  try {
    const pythonManager = getPythonManager(sessionId);

    switch (params.action) {
      case 'install':
        if (!params.package) {
          throw new Error('Package name is required for install action');
        }
        await pythonManager.installPackage(
          params.environment || 'default',
          params.package,
          params.version
        );
        return { success: true };

      case 'list':
        const env = params.environment ? pythonManager.getEnvironments().find(e => e.id === params.environment) : null;
        const packages = env ? env.packages : await pythonManager.listInstalledPackages();
        return {
          success: true,
          packages: packages.map(pkg => ({
            name: pkg.name,
            version: pkg.version,
          })),
        };

      case 'freeze':
        if (!params.environment) {
          throw new Error('Environment is required for freeze action');
        }
        const requirements = await pythonManager.freezeRequirements(params.environment);
        return {
          success: true,
          requirements,
        };

      default:
        throw new Error(`Unsupported action: ${params.action}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Python Environment Management Tool
 */
export interface PythonEnvironmentParams {
  action: 'create' | 'list' | 'activate' | 'delete';
  name?: string;
  pythonVersion?: string;
  type?: 'venv' | 'conda' | 'poetry';
  packages?: string[];
}

export interface PythonEnvironmentResult {
  success: boolean;
  environments?: Array<{
    id: string;
    name: string;
    version: string;
    type: string;
    isActive: boolean;
    packageCount: number;
  }>;
  environmentId?: string;
  error?: string;
}

/**
 * Manage Python environments
 */
export async function pythonEnvironmentManage(
  sessionId: string,
  params: PythonEnvironmentParams
): Promise<PythonEnvironmentResult> {
  try {
    const pythonManager = getPythonManager(sessionId);

    switch (params.action) {
      case 'create':
        if (!params.name) {
          throw new Error('Environment name is required for create action');
        }

        let envId: string;
        if (params.type === 'conda') {
          envId = await pythonManager.createCondaEnvironment(
            params.name,
            params.pythonVersion,
            params.packages
          );
        } else {
          envId = await pythonManager.createVirtualEnvironment(
            params.name,
            params.pythonVersion
          );
        }

        // Install additional packages if specified
        if (params.packages && params.packages.length > 0) {
          for (const pkg of params.packages) {
            await pythonManager.installPackage(envId, pkg);
          }
        }

        return {
          success: true,
          environmentId: envId,
        };

      case 'list':
        const environments = pythonManager.getEnvironments();
        return {
          success: true,
          environments: environments.map(env => ({
            id: env.id,
            name: env.name,
            version: env.version,
            type: env.type,
            isActive: env.isActive,
            packageCount: env.packages.length,
          })),
        };

      case 'activate':
        if (!params.name) {
          throw new Error('Environment name is required for activate action');
        }
        const envToActivate = pythonManager.getEnvironments().find(e => e.name === params.name);
        if (!envToActivate) {
          throw new Error(`Environment not found: ${params.name}`);
        }
        await pythonManager.activateEnvironment(envToActivate.id);
        return { success: true };

      case 'delete':
        if (!params.name) {
          throw new Error('Environment name is required for delete action');
        }
        const envToDelete = pythonManager.getEnvironments().find(e => e.name === params.name);
        if (!envToDelete) {
          throw new Error(`Environment not found: ${params.name}`);
        }
        await pythonManager.deleteEnvironment(envToDelete.id);
        return { success: true };

      default:
        throw new Error(`Unsupported action: ${params.action}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Auto-detect and set up Python environment for a project
 */
export interface PythonAutoSetupParams {
  projectPath?: string;
  requirementsFile?: string;
  preferredVersion?: string;
}

export interface PythonAutoSetupResult {
  success: boolean;
  environmentId?: string;
  pythonVersion?: string;
  packagesInstalled?: string[];
  error?: string;
}

/**
 * Automatically detect project requirements and set up Python environment
 */
export async function pythonAutoSetup(
  sessionId: string,
  params: PythonAutoSetupParams
): Promise<PythonAutoSetupResult> {
  try {
    const pythonManager = getPythonManager(sessionId);

    // Detect Python installations
    const installations = await pythonManager.detectPythonInstallations();
    if (installations.length === 0) {
      throw new Error('No Python installation found');
    }

    // Select appropriate Python version
    const selectedPython = params.preferredVersion
      ? installations.find(inst => inst.version.startsWith(params.preferredVersion))
      : installations.find(inst => inst.isDefault) || installations[0];

    if (!selectedPython) {
      throw new Error(`Python version ${params.preferredVersion} not found`);
    }

    // Create environment with project-specific name
    const projectName = params.projectPath ?
      params.projectPath.split('/').pop() || 'project' :
      'python-project';

    const envName = `${projectName}-${Date.now()}`;
    const envId = await pythonManager.createVirtualEnvironment(envName, selectedPython.version);

    const packagesInstalled: string[] = [];

    // Install requirements if specified
    if (params.requirementsFile) {
      // This would read the requirements file and install packages
      // For now, we'll install common packages
      const commonPackages = ['requests', 'python-dotenv', 'pydantic'];
      for (const pkg of commonPackages) {
        try {
          await pythonManager.installPackage(envId, pkg);
          packagesInstalled.push(pkg);
        } catch (error) {
          console.warn(`Failed to install ${pkg}:`, error);
        }
      }
    }

    return {
      success: true,
      environmentId: envId,
      pythonVersion: selectedPython.version,
      packagesInstalled,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}