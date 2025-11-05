import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PythonVersion {
  version: string;
  path: string;
  isDefault: boolean;
}

export interface VirtualEnvironment {
  name: string;
  path: string;
  pythonVersion: string;
  type: 'venv' | 'conda' | 'poetry';
  packages: PackageInfo[];
  isActive: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  location?: string;
}

export interface PythonEnvironmentStatus {
  installedVersions: PythonVersion[];
  activeEnvironment: VirtualEnvironment | null;
  availableEnvironments: VirtualEnvironment[];
  projectRequirements: string[];
}

export class PythonEnvironmentManager {
  private workingDirectory: string;
  private activeEnv: VirtualEnvironment | null = null;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * Detect all installed Python versions
   */
  async detectPythonVersions(): Promise<PythonVersion[]> {
    const versions: PythonVersion[] = [];

    try {
      // Check python3
      const { stdout: python3Output } = await execAsync('which python3 && python3 --version');
      const python3Match = python3Output.match(/Python (\d+\.\d+\.\d+)/);
      if (python3Match) {
        versions.push({
          version: python3Match[1],
          path: python3Output.split('\n')[0],
          isDefault: true,
        });
      }
    } catch (error) {
      console.log('Python3 not found');
    }

    try {
      // Check python
      const { stdout: pythonOutput } = await execAsync('which python && python --version');
      const pythonMatch = pythonOutput.match(/Python (\d+\.\d+\.\d+)/);
      if (pythonMatch) {
        versions.push({
          version: pythonMatch[1],
          path: pythonOutput.split('\n')[0],
          isDefault: false,
        });
      }
    } catch (error) {
      console.log('Python not found');
    }

    // Check conda environments
    try {
      const { stdout: condaOutput } = await execAsync('conda env list');
      const envs = condaOutput.split('\n').filter(line => line && !line.startsWith('#'));
      // Additional conda processing can be added here
    } catch (error) {
      console.log('Conda not found');
    }

    return versions;
  }

  /**
   * Create a new virtual environment
   */
  async createVirtualEnvironment(
    name: string,
    type: 'venv' | 'conda' | 'poetry' = 'venv',
    pythonVersion?: string
  ): Promise<VirtualEnvironment> {
    const envPath = path.join(this.workingDirectory, name);

    try {
      switch (type) {
        case 'venv':
          const pythonCmd = pythonVersion ? `python${pythonVersion}` : 'python3';
          await execAsync(`${pythonCmd} -m venv ${envPath}`);
          break;

        case 'conda':
          const condaCmd = pythonVersion
            ? `conda create -n ${name} python=${pythonVersion} -y`
            : `conda create -n ${name} -y`;
          await execAsync(condaCmd);
          break;

        case 'poetry':
          await execAsync(`cd ${this.workingDirectory} && poetry init --no-interaction`);
          await execAsync(`cd ${this.workingDirectory} && poetry env use ${pythonVersion || 'python3'}`);
          break;
      }

      const env = await this.getEnvironmentInfo(name, envPath, type);
      return env;
    } catch (error) {
      throw new Error(`Failed to create ${type} environment: ${error}`);
    }
  }

  /**
   * List all virtual environments in the working directory
   */
  async listVirtualEnvironments(): Promise<VirtualEnvironment[]> {
    const environments: VirtualEnvironment[] = [];

    try {
      // Check for venv/virtualenv directories
      const files = await fs.readdir(this.workingDirectory);
      for (const file of files) {
        const fullPath = path.join(this.workingDirectory, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          // Check if it's a venv
          const binPath = path.join(fullPath, 'bin', 'python');
          const scriptsPath = path.join(fullPath, 'Scripts', 'python.exe');

          try {
            await fs.access(binPath);
            const env = await this.getEnvironmentInfo(file, fullPath, 'venv');
            environments.push(env);
          } catch {
            try {
              await fs.access(scriptsPath);
              const env = await this.getEnvironmentInfo(file, fullPath, 'venv');
              environments.push(env);
            } catch {
              // Not a venv directory
            }
          }
        }
      }

      // Check for conda environments
      try {
        const { stdout } = await execAsync('conda env list --json');
        const condaEnvs = JSON.parse(stdout);
        for (const envPath of condaEnvs.envs || []) {
          const name = path.basename(envPath);
          const env = await this.getEnvironmentInfo(name, envPath, 'conda');
          environments.push(env);
        }
      } catch (error) {
        console.log('No conda environments found');
      }

      // Check for poetry
      try {
        await fs.access(path.join(this.workingDirectory, 'pyproject.toml'));
        const { stdout } = await execAsync(`cd ${this.workingDirectory} && poetry env info --path`);
        const envPath = stdout.trim();
        const env = await this.getEnvironmentInfo('poetry', envPath, 'poetry');
        environments.push(env);
      } catch (error) {
        console.log('No poetry environment found');
      }

    } catch (error) {
      console.error('Error listing environments:', error);
    }

    return environments;
  }

  /**
   * Get detailed information about an environment
   */
  private async getEnvironmentInfo(
    name: string,
    envPath: string,
    type: 'venv' | 'conda' | 'poetry'
  ): Promise<VirtualEnvironment> {
    let pythonVersion = 'unknown';
    let packages: PackageInfo[] = [];

    try {
      const pythonBin = type === 'conda'
        ? `conda run -n ${name} python`
        : type === 'poetry'
        ? `cd ${this.workingDirectory} && poetry run python`
        : `${envPath}/bin/python`;

      // Get Python version
      const { stdout: versionOutput } = await execAsync(`${pythonBin} --version`);
      const versionMatch = versionOutput.match(/Python (\d+\.\d+\.\d+)/);
      if (versionMatch) {
        pythonVersion = versionMatch[1];
      }

      // Get installed packages
      const pipCmd = type === 'conda'
        ? `conda run -n ${name} pip`
        : type === 'poetry'
        ? `cd ${this.workingDirectory} && poetry run pip`
        : `${envPath}/bin/pip`;

      const { stdout: packagesOutput } = await execAsync(`${pipCmd} list --format=json`);
      packages = JSON.parse(packagesOutput);
    } catch (error) {
      console.log(`Error getting environment info: ${error}`);
    }

    return {
      name,
      path: envPath,
      pythonVersion,
      type,
      packages,
      isActive: this.activeEnv?.name === name,
    };
  }

  /**
   * Activate a virtual environment
   */
  async activateEnvironment(name: string): Promise<VirtualEnvironment> {
    const environments = await this.listVirtualEnvironments();
    const env = environments.find(e => e.name === name);

    if (!env) {
      throw new Error(`Environment ${name} not found`);
    }

    this.activeEnv = env;
    this.activeEnv.isActive = true;

    return this.activeEnv;
  }

  /**
   * Install packages in the active environment
   */
  async installPackages(packages: string[]): Promise<{ success: boolean; output: string }> {
    if (!this.activeEnv) {
      throw new Error('No active environment. Please activate an environment first.');
    }

    try {
      const packageStr = packages.join(' ');
      let command: string;

      switch (this.activeEnv.type) {
        case 'conda':
          command = `conda run -n ${this.activeEnv.name} pip install ${packageStr}`;
          break;
        case 'poetry':
          command = `cd ${this.workingDirectory} && poetry add ${packageStr}`;
          break;
        default:
          command = `${this.activeEnv.path}/bin/pip install ${packageStr}`;
      }

      const { stdout, stderr } = await execAsync(command);
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Install packages from requirements.txt
   */
  async installFromRequirements(requirementsPath?: string): Promise<{ success: boolean; output: string }> {
    if (!this.activeEnv) {
      throw new Error('No active environment. Please activate an environment first.');
    }

    const reqPath = requirementsPath || path.join(this.workingDirectory, 'requirements.txt');

    try {
      await fs.access(reqPath);
    } catch {
      throw new Error(`Requirements file not found: ${reqPath}`);
    }

    try {
      let command: string;

      switch (this.activeEnv.type) {
        case 'conda':
          command = `conda run -n ${this.activeEnv.name} pip install -r ${reqPath}`;
          break;
        case 'poetry':
          command = `cd ${this.workingDirectory} && poetry install`;
          break;
        default:
          command = `${this.activeEnv.path}/bin/pip install -r ${reqPath}`;
      }

      const { stdout, stderr } = await execAsync(command);
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Parse requirements.txt to get list of required packages
   */
  async parseRequirements(requirementsPath?: string): Promise<string[]> {
    const reqPath = requirementsPath || path.join(this.workingDirectory, 'requirements.txt');

    try {
      const content = await fs.readFile(reqPath, 'utf-8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
    } catch {
      return [];
    }
  }

  /**
   * Get comprehensive environment status
   */
  async getEnvironmentStatus(): Promise<PythonEnvironmentStatus> {
    const [installedVersions, availableEnvironments, projectRequirements] = await Promise.all([
      this.detectPythonVersions(),
      this.listVirtualEnvironments(),
      this.parseRequirements(),
    ]);

    return {
      installedVersions,
      activeEnvironment: this.activeEnv,
      availableEnvironments,
      projectRequirements,
    };
  }

  /**
   * Uninstall packages from the active environment
   */
  async uninstallPackages(packages: string[]): Promise<{ success: boolean; output: string }> {
    if (!this.activeEnv) {
      throw new Error('No active environment. Please activate an environment first.');
    }

    try {
      const packageStr = packages.join(' ');
      let command: string;

      switch (this.activeEnv.type) {
        case 'conda':
          command = `conda run -n ${this.activeEnv.name} pip uninstall ${packageStr} -y`;
          break;
        case 'poetry':
          command = `cd ${this.workingDirectory} && poetry remove ${packageStr}`;
          break;
        default:
          command = `${this.activeEnv.path}/bin/pip uninstall ${packageStr} -y`;
      }

      const { stdout, stderr } = await execAsync(command);
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Run a Python script in the active environment
   */
  async runScript(scriptPath: string, args: string[] = []): Promise<{ success: boolean; output: string }> {
    if (!this.activeEnv) {
      throw new Error('No active environment. Please activate an environment first.');
    }

    try {
      const argsStr = args.join(' ');
      let command: string;

      switch (this.activeEnv.type) {
        case 'conda':
          command = `conda run -n ${this.activeEnv.name} python ${scriptPath} ${argsStr}`;
          break;
        case 'poetry':
          command = `cd ${this.workingDirectory} && poetry run python ${scriptPath} ${argsStr}`;
          break;
        default:
          command = `${this.activeEnv.path}/bin/python ${scriptPath} ${argsStr}`;
      }

      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });
      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }
}

// Session-based environment manager storage
const environmentManagers = new Map<string, PythonEnvironmentManager>();

export function getPythonEnvironmentManager(sessionId: string, workingDirectory: string): PythonEnvironmentManager {
  if (!environmentManagers.has(sessionId)) {
    environmentManagers.set(sessionId, new PythonEnvironmentManager(workingDirectory));
  }
  return environmentManagers.get(sessionId)!;
}

export function cleanupPythonEnvironmentManager(sessionId: string): void {
  environmentManagers.delete(sessionId);
}
