/**
 * Agent Ironman - Python Environment Manager
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { spawn } from 'bun';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { ensureDirectory } from '../directoryUtils';

/**
 * Python installation information
 */
export interface PythonInstallation {
  version: string;
  executablePath: string;
  isDefault: boolean;
  architecture: 'x64' | 'arm64' | 'x86';
  vendor: 'python' | 'conda' | 'pyenv' | 'system';
}

/**
 * Python environment configuration
 */
export interface PythonEnvironment {
  id: string;
  name: string;
  pythonPath: string;
  version: string;
  type: 'venv' | 'conda' | 'poetry' | 'system';
  isActive: boolean;
  packages: PackageInfo[];
  created: number;
  lastUsed: number;
  projectPath?: string;
}

/**
 * Python package information
 */
export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  dependencies: string[];
  size?: number;
  installedAt: number;
}

/**
 * Python execution result
 */
export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  packagesUsed?: string[];
  outputFiles?: string[];
}

/**
 * Package management action
 */
export interface PackageAction {
  action: 'install' | 'uninstall' | 'update' | 'list' | 'freeze';
  package?: string;
  version?: string;
  environment?: string;
  options?: Record<string, any>;
}

/**
 * Python Environment Manager
 * Handles detection, creation, and management of Python environments
 */
export class PythonEnvironmentManager {
  private installations: PythonInstallation[] = [];
  private environments: Map<string, PythonEnvironment> = new Map();
  private cacheDir: string;

  constructor(sessionId: string) {
    this.cacheDir = join(getWorkingDirectoryPath(sessionId), '.python-cache');
    ensureDirectory(this.cacheDir);
    this.detectPythonInstallations();
    this.loadEnvironments();
  }

  /**
   * Detect all Python installations on the system
   */
  async detectPythonInstallations(): Promise<PythonInstallation[]> {
    const possibleCommands = [
      'python3',
      'python',
      'python3.11',
      'python3.10',
      'python3.9',
      'python3.8',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      'conda',
      'pyenv',
    ];

    this.installations = [];

    for (const command of possibleCommands) {
      try {
        const result = await this.executeCommand(`${command} --version`);
        if (result.exitCode === 0) {
          const versionMatch = result.stdout.match(/Python (\d+\.\d+\.\d+)/);
          if (versionMatch) {
            const version = versionMatch[1];
            const execPath = await this.getExecutablePath(command);

            this.installations.push({
              version,
              executablePath: execPath,
              isDefault: command === 'python3' || command === 'python',
              architecture: await this.detectArchitecture(execPath),
              vendor: this.detectVendor(command),
            });
          }
        }
      } catch (error) {
        // Command not found, continue
      }
    }

    // Set default installation
    if (this.installations.length > 0 && !this.installations.some(inst => inst.isDefault)) {
      this.installations[0].isDefault = true;
    }

    return this.installations;
  }

  /**
   * Create a new virtual environment
   */
  async createVirtualEnvironment(
    name: string,
    pythonVersion?: string,
    projectPath?: string
  ): Promise<string> {
    const installation = pythonVersion
      ? this.installations.find(inst => inst.version.startsWith(pythonVersion))
      : this.installations.find(inst => inst.isDefault);

    if (!installation) {
      throw new Error(`Python installation not found for version: ${pythonVersion}`);
    }

    const envPath = join(this.cacheDir, 'envs', name);
    ensureDirectory(dirname(envPath));

    // Create virtual environment
    const result = await this.executeCommand(
      `${installation.executablePath} -m venv "${envPath}"`,
      dirname(envPath)
    );

    if (result.exitCode !== 0) {
      throw new Error(`Failed to create virtual environment: ${result.stderr}`);
    }

    // Create environment record
    const envId = `env_${Date.now()}_${name}`;
    const environment: PythonEnvironment = {
      id: envId,
      name,
      pythonPath: this.getPythonPathForEnv(envPath),
      version: installation.version,
      type: 'venv',
      isActive: false,
      packages: await this.listInstalledPackages(envPath),
      created: Date.now(),
      lastUsed: Date.now(),
      projectPath,
    };

    this.environments.set(envId, environment);
    await this.saveEnvironments();

    return envId;
  }

  /**
   * Create a conda environment
   */
  async createCondaEnvironment(
    name: string,
    pythonVersion?: string,
    packages?: string[]
  ): Promise<string> {
    const condaInstallation = this.installations.find(inst => inst.vendor === 'conda');
    if (!condaInstallation) {
      throw new Error('Conda not found. Please install Anaconda or Miniconda.');
    }

    const versionArg = pythonVersion ? `python=${pythonVersion}` : '';
    const packagesArg = packages ? packages.join(' ') : '';

    const command = [
      'conda create',
      '--name',
      name,
      '--yes',
      versionArg,
      packagesArg,
    ].filter(Boolean).join(' ');

    const result = await this.executeCommand(command);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create conda environment: ${result.stderr}`);
    }

    const envId = `conda_${Date.now()}_${name}`;
    const environment: PythonEnvironment = {
      id: envId,
      name,
      pythonPath: this.getCondaPythonPath(name),
      version: pythonVersion || '3.11',
      type: 'conda',
      isActive: false,
      packages: await this.listCondaPackages(name),
      created: Date.now(),
      lastUsed: Date.now(),
    };

    this.environments.set(envId, environment);
    await this.saveEnvironments();

    return envId;
  }

  /**
   * Execute Python code in a specific environment
   */
  async executePythonCode(
    code: string,
    envId?: string,
    workingDir?: string
  ): Promise<PythonExecutionResult> {
    const environment = envId ? this.environments.get(envId) : null;
    const pythonPath = environment?.pythonPath || this.getDefaultPython();

    const startTime = Date.now();

    // Create a temporary Python file
    const tempFile = join(this.cacheDir, `temp_${Date.now()}.py`);
    writeFileSync(tempFile, code);

    try {
      const result = await this.executeCommand(
        `"${pythonPath}" "${tempFile}"`,
        workingDir || process.cwd(),
        {
          PYTHONPATH: environment ? this.getPythonPathForEnv(environment) : undefined,
          VIRTUAL_ENV: environment?.projectPath,
        }
      );

      const executionTime = Date.now() - startTime;

      // Update last used time
      if (environment) {
        environment.lastUsed = Date.now();
        await this.saveEnvironments();
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime,
        packagesUsed: await this.extractUsedPackages(code),
      };
    } finally {
      // Clean up temp file
      try {
        await this.executeCommand(`rm "${tempFile}"`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Install a package in an environment
   */
  async installPackage(
    envId: string,
    packageName: string,
    version?: string
  ): Promise<void> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    const packageSpec = version ? `${packageName}==${version}` : packageName;
    let command: string;

    switch (environment.type) {
      case 'venv':
        command = `"${environment.pythonPath}" -m pip install ${packageSpec}`;
        break;
      case 'conda':
        command = `conda install --name ${environment.name} ${packageSpec} --yes`;
        break;
      case 'poetry':
        command = `poetry add ${packageSpec}`;
        break;
      default:
        throw new Error(`Unsupported environment type: ${environment.type}`);
    }

    const result = await this.executeCommand(command);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to install package: ${result.stderr}`);
    }

    // Update package list
    environment.packages = await this.listInstalledPackages(environment.projectPath || '');
    await this.saveEnvironments();
  }

  /**
   * Get list of installed packages
   */
  async listInstalledPackages(envPath?: string): Promise<PackageInfo[]> {
    const pythonPath = envPath ? this.getPythonPathForEnv(envPath) : this.getDefaultPython();
    const result = await this.executeCommand(
      `"${pythonPath}" -m pip list --format=json`
    );

    if (result.exitCode !== 0) {
      return [];
    }

    try {
      const packages = JSON.parse(result.stdout);
      return packages.map((pkg: any) => ({
        name: pkg.name,
        version: pkg.version,
        installedAt: Date.now(),
        dependencies: [],
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * List conda packages
   */
  async listCondaPackages(envName: string): Promise<PackageInfo[]> {
    const result = await this.executeCommand(
      `conda list --name ${envName} --json`
    );

    if (result.exitCode !== 0) {
      return [];
    }

    try {
      const packages = JSON.parse(result.stdout);
      return packages.map((pkg: any) => ({
        name: pkg.name,
        version: pkg.version,
        installedAt: Date.now(),
        dependencies: [],
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Freeze requirements from an environment
   */
  async freezeRequirements(envId: string): Promise<string> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    let command: string;

    switch (environment.type) {
      case 'venv':
        command = `"${environment.pythonPath}" -m pip freeze`;
        break;
      case 'conda':
        command = `conda env export --name ${environment.name}`;
        break;
      case 'poetry':
        command = `poetry show --tree`;
        break;
      default:
        throw new Error(`Unsupported environment type: ${environment.type}`);
    }

    const result = await this.executeCommand(command);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to freeze requirements: ${result.stderr}`);
    }

    return result.stdout;
  }

  /**
   * Get all available environments
   */
  getEnvironments(): PythonEnvironment[] {
    return Array.from(this.environments.values());
  }

  /**
   * Get default Python installation
   */
  getDefaultPython(): string {
    const defaultInstallation = this.installations.find(inst => inst.isDefault);
    return defaultInstallation?.executablePath || 'python3';
  }

  /**
   * Activate an environment
   */
  async activateEnvironment(envId: string): Promise<void> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    // Deactivate all other environments
    this.environments.forEach(env => env.isActive = false);
    environment.isActive = true;
    environment.lastUsed = Date.now();

    await this.saveEnvironments();
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(envId: string): Promise<void> {
    const environment = this.environments.get(envId);
    if (!environment) {
      throw new Error(`Environment not found: ${envId}`);
    }

    let command: string;

    switch (environment.type) {
      case 'venv':
        command = `rm -rf "${this.getEnvPath(environment.name)}"`;
        break;
      case 'conda':
        command = `conda env remove --name ${environment.name} --yes`;
        break;
      default:
        throw new Error(`Cannot delete environment type: ${environment.type}`);
    }

    await this.executeCommand(command);
    this.environments.delete(envId);
    await this.saveEnvironments();
  }

  // Private helper methods

  private async executeCommand(
    command: string,
    cwd?: string,
    env?: Record<string, string>
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const proc = spawn({
        cmd: ['sh', '-c', command],
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...env },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 });
      });
    });
  }

  private async getExecutablePath(command: string): Promise<string> {
    const result = await this.executeCommand(`which ${command}`);
    return result.stdout.trim();
  }

  private async detectArchitecture(executablePath: string): Promise<'x64' | 'arm64' | 'x86'> {
    const result = await this.executeCommand(`uname -m`);
    const arch = result.stdout.trim();
    if (arch.includes('arm') || arch.includes('aarch64')) return 'arm64';
    if (arch.includes('64')) return 'x64';
    return 'x86';
  }

  private detectVendor(command: string): 'python' | 'conda' | 'pyenv' | 'system' {
    if (command.includes('conda')) return 'conda';
    if (command.includes('pyenv')) return 'pyenv';
    if (command.includes('python')) return 'python';
    return 'system';
  }

  private getPythonPathForEnv(envPath: string): string {
    const isWindows = process.platform === 'win32';
    return isWindows
      ? join(envPath, 'Scripts', 'python.exe')
      : join(envPath, 'bin', 'python');
  }

  private getCondaPythonPath(envName: string): string {
    const isWindows = process.platform === 'win32';
    const condaPath = isWindows
      ? '%USERPROFILE%\\anaconda3\\envs'
      : '~/anaconda3/envs';
    return join(condaPath, envName, 'bin', 'python');
  }

  private getEnvPath(name: string): string {
    return join(this.cacheDir, 'envs', name);
  }

  private async extractUsedPackages(code: string): Promise<string[]> {
    // Simple import extraction - could be enhanced with AST parsing
    const imports = code.match(/import\s+(\w+)|from\s+(\w+)/g) || [];
    return imports
      .map(imp => imp.replace(/import\s+|from\s+/, ''))
      .filter(pkg => !['os', 'sys', 'json', 'time', 'datetime'].includes(pkg));
  }

  private loadEnvironments(): void {
    const envFile = join(this.cacheDir, 'environments.json');
    if (existsSync(envFile)) {
      try {
        const data = JSON.parse(readFileSync(envFile, 'utf-8'));
        data.forEach((env: PythonEnvironment) => {
          this.environments.set(env.id, env);
        });
      } catch (error) {
        console.warn('Failed to load environments:', error);
      }
    }
  }

  private async saveEnvironments(): Promise<void> {
    const envFile = join(this.cacheDir, 'environments.json');
    const data = Array.from(this.environments.values());
    writeFileSync(envFile, JSON.stringify(data, null, 2));
  }

  private getPythonPathForEnv(environment: PythonEnvironment): string {
    if (environment.projectPath) {
      return this.getPythonPathForEnv(environment.projectPath);
    }
    return environment.pythonPath;
  }
}

// Helper function to get working directory path
function getWorkingDirectoryPath(sessionId: string): string {
  // This should match the existing directoryUtils implementation
  return join(process.cwd(), '.agent-ironman-sessions', sessionId);
}