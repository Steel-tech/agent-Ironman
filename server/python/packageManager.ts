import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  downloads?: number;
}

export interface PackageDetails {
  name: string;
  version: string;
  summary: string;
  author: string;
  license: string;
  homepage?: string;
  requires: string[];
  installedVersion?: string;
}

export interface OutdatedPackage {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'major' | 'minor' | 'patch';
}

export class PythonPackageManager {
  private workingDirectory: string;
  private environmentPath?: string;

  constructor(workingDirectory: string, environmentPath?: string) {
    this.workingDirectory = workingDirectory;
    this.environmentPath = environmentPath;
  }

  /**
   * Get the pip command for the current environment
   */
  private getPipCommand(): string {
    if (this.environmentPath) {
      return `${this.environmentPath}/bin/pip`;
    }
    return 'pip3';
  }

  /**
   * Search for packages on PyPI
   */
  async searchPackages(query: string, limit: number = 10): Promise<PackageSearchResult[]> {
    try {
      // PyPI XML-RPC API or use pip search alternative
      // Since pip search is disabled, we'll use PyPI JSON API
      const response = await fetch(`https://pypi.org/pypi/${query}/json`);

      if (!response.ok) {
        // Try searching via simple API
        const searchResponse = await fetch(`https://pypi.org/search/?q=${encodeURIComponent(query)}`);
        return []; // Would need HTML parsing for full implementation
      }

      const data = await response.json();

      return [{
        name: data.info.name,
        version: data.info.version,
        description: data.info.summary,
        author: data.info.author,
        homepage: data.info.home_page,
      }];
    } catch (error) {
      console.error('Error searching packages:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a package
   */
  async getPackageInfo(packageName: string): Promise<PackageDetails | null> {
    try {
      const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const info = data.info;

      // Check if package is installed
      let installedVersion: string | undefined;
      try {
        const pipCmd = this.getPipCommand();
        const { stdout } = await execAsync(`${pipCmd} show ${packageName}`);
        const versionMatch = stdout.match(/Version: (.+)/);
        if (versionMatch) {
          installedVersion = versionMatch[1];
        }
      } catch {
        // Package not installed
      }

      return {
        name: info.name,
        version: info.version,
        summary: info.summary || '',
        author: info.author || '',
        license: info.license || '',
        homepage: info.home_page,
        requires: info.requires_dist || [],
        installedVersion,
      };
    } catch (error) {
      console.error('Error getting package info:', error);
      return null;
    }
  }

  /**
   * Install a package
   */
  async installPackage(
    packageName: string,
    version?: string,
    options: { upgrade?: boolean; dev?: boolean } = {}
  ): Promise<{ success: boolean; output: string }> {
    try {
      const pipCmd = this.getPipCommand();
      const packageSpec = version ? `${packageName}==${version}` : packageName;
      const upgradeFlag = options.upgrade ? '--upgrade' : '';

      const command = `${pipCmd} install ${packageSpec} ${upgradeFlag}`.trim();
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });

      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Uninstall a package
   */
  async uninstallPackage(packageName: string): Promise<{ success: boolean; output: string }> {
    try {
      const pipCmd = this.getPipCommand();
      const command = `${pipCmd} uninstall ${packageName} -y`;
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });

      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * List installed packages
   */
  async listInstalledPackages(): Promise<PackageDetails[]> {
    try {
      const pipCmd = this.getPipCommand();
      const { stdout } = await execAsync(`${pipCmd} list --format=json`);
      const packages = JSON.parse(stdout);

      return packages.map((pkg: any) => ({
        name: pkg.name,
        version: pkg.version,
        summary: '',
        author: '',
        license: '',
        requires: [],
        installedVersion: pkg.version,
      }));
    } catch (error) {
      console.error('Error listing packages:', error);
      return [];
    }
  }

  /**
   * Check for outdated packages
   */
  async checkOutdatedPackages(): Promise<OutdatedPackage[]> {
    try {
      const pipCmd = this.getPipCommand();
      const { stdout } = await execAsync(`${pipCmd} list --outdated --format=json`);
      const outdated = JSON.parse(stdout);

      return outdated.map((pkg: any) => {
        const current = pkg.version.split('.');
        const latest = pkg.latest_version.split('.');

        let type: 'major' | 'minor' | 'patch' = 'patch';
        if (current[0] !== latest[0]) type = 'major';
        else if (current[1] !== latest[1]) type = 'minor';

        return {
          name: pkg.name,
          currentVersion: pkg.version,
          latestVersion: pkg.latest_version,
          type,
        };
      });
    } catch (error) {
      console.error('Error checking outdated packages:', error);
      return [];
    }
  }

  /**
   * Update all packages or specific package
   */
  async updatePackages(packageName?: string): Promise<{ success: boolean; output: string }> {
    try {
      const pipCmd = this.getPipCommand();

      if (packageName) {
        const command = `${pipCmd} install --upgrade ${packageName}`;
        const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });
        return { success: true, output: stdout + stderr };
      } else {
        // Update all packages
        const outdated = await this.checkOutdatedPackages();
        const packages = outdated.map(pkg => pkg.name).join(' ');

        if (!packages) {
          return { success: true, output: 'All packages are up to date' };
        }

        const command = `${pipCmd} install --upgrade ${packages}`;
        const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });
        return { success: true, output: stdout + stderr };
      }
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Generate requirements.txt from installed packages
   */
  async generateRequirements(includeVersions: boolean = true): Promise<string> {
    try {
      const pipCmd = this.getPipCommand();
      const command = includeVersions ? `${pipCmd} freeze` : `${pipCmd} list --format=freeze | cut -d'=' -f1`;
      const { stdout } = await execAsync(command, { cwd: this.workingDirectory });

      return stdout.trim();
    } catch (error) {
      console.error('Error generating requirements:', error);
      return '';
    }
  }

  /**
   * Save requirements to file
   */
  async saveRequirements(filePath?: string, includeVersions: boolean = true): Promise<{ success: boolean; path: string }> {
    try {
      const requirements = await this.generateRequirements(includeVersions);
      const savePath = filePath || path.join(this.workingDirectory, 'requirements.txt');

      await fs.writeFile(savePath, requirements, 'utf-8');

      return { success: true, path: savePath };
    } catch (error) {
      console.error('Error saving requirements:', error);
      throw new Error('Failed to save requirements file');
    }
  }

  /**
   * Install packages from requirements.txt
   */
  async installFromRequirements(requirementsPath?: string): Promise<{ success: boolean; output: string }> {
    const reqPath = requirementsPath || path.join(this.workingDirectory, 'requirements.txt');

    try {
      await fs.access(reqPath);
    } catch {
      throw new Error(`Requirements file not found: ${reqPath}`);
    }

    try {
      const pipCmd = this.getPipCommand();
      const command = `${pipCmd} install -r ${reqPath}`;
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });

      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  /**
   * Get package dependencies
   */
  async getPackageDependencies(packageName: string): Promise<string[]> {
    try {
      const pipCmd = this.getPipCommand();
      const { stdout } = await execAsync(`${pipCmd} show ${packageName}`);

      const requiresMatch = stdout.match(/Requires: (.+)/);
      if (requiresMatch && requiresMatch[1] !== '') {
        return requiresMatch[1].split(', ').map(dep => dep.trim());
      }

      return [];
    } catch (error) {
      console.error('Error getting dependencies:', error);
      return [];
    }
  }

  /**
   * Check if a package is installed
   */
  async isPackageInstalled(packageName: string): Promise<boolean> {
    try {
      const pipCmd = this.getPipCommand();
      await execAsync(`${pipCmd} show ${packageName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get package installation size
   */
  async getPackageSize(packageName: string): Promise<string | null> {
    try {
      const pipCmd = this.getPipCommand();
      const { stdout } = await execAsync(`${pipCmd} show ${packageName}`);

      const locationMatch = stdout.match(/Location: (.+)/);
      if (locationMatch) {
        const location = locationMatch[1];
        const packagePath = path.join(location, packageName);

        try {
          const { stdout: sizeOutput } = await execAsync(`du -sh ${packagePath}`);
          return sizeOutput.split('\t')[0];
        } catch {
          return null;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Session-based package manager storage
const packageManagers = new Map<string, PythonPackageManager>();

export function getPythonPackageManager(
  sessionId: string,
  workingDirectory: string,
  environmentPath?: string
): PythonPackageManager {
  const key = `${sessionId}-${environmentPath || 'default'}`;
  if (!packageManagers.has(key)) {
    packageManagers.set(key, new PythonPackageManager(workingDirectory, environmentPath));
  }
  return packageManagers.get(key)!;
}

export function cleanupPythonPackageManager(sessionId: string): void {
  const keysToDelete = Array.from(packageManagers.keys()).filter(key => key.startsWith(sessionId));
  keysToDelete.forEach(key => packageManagers.delete(key));
}
