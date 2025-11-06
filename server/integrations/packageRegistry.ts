/**
 * Agent Ironman - Package Registry Integration
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Package Registry Integration - Support for npm, PyPI, and other package registries
 */

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  author?: {
    name: string;
    email?: string;
  };
  license?: string;
  keywords?: string[];
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  downloads?: {
    lastWeek: number;
    lastMonth: number;
    lastYear: number;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  publishedAt?: string;
  modifiedAt?: string;
  size?: number;
  files?: string[];
  maintainers?: Array<{
    name: string;
    email?: string;
  }>;
  deprecated?: boolean;
  security?: {
    vulnerabilities: Array<{
      id: string;
      severity: 'low' | 'moderate' | 'high' | 'critical';
      title: string;
      url: string;
    }>;
  };
}

export interface PackageVersion {
  version: string;
  deprecated?: string;
  publishedAt?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  dist: {
    tarball: string;
    shasum: string;
    integrity?: string;
  };
}

export interface SecurityVulnerability {
  id: string;
  packageName: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  overview: string;
  recommendation: string;
  references: string[];
  cwe?: string[];
  cvssScore?: number;
  publishedAt: string;
  updatedAt: string;
  affectedVersions: string[];
  patchedVersions: string[];
}

export interface PackageSearchResult {
  packages: PackageInfo[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * npm Registry Integration
 */
export class NpmRegistry {
  private baseUrl = 'https://registry.npmjs.org';

  async getPackage(packageName: string): Promise<PackageInfo> {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    if (!response.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }

    const data = await response.json();

    // Transform npm response to PackageInfo format
    const latest = data['dist-tags']?.latest;
    const latestVersion = data.versions[latest];

    return {
      name: data.name,
      version: latest,
      description: data.description,
      author: latestVersion?.author,
      license: data.license,
      keywords: data.keywords,
      homepage: latestVersion?.homepage,
      repository: latestVersion?.repository,
      bugs: latestVersion?.bugs,
      dependencies: latestVersion?.dependencies,
      devDependencies: latestVersion?.devDependencies,
      peerDependencies: latestVersion?.peerDependencies,
      publishedAt: data.time?.[latest],
      modifiedAt: data.time?.modified,
      maintainers: data.maintainers,
      deprecated: data.deprecated,
    };
  }

  async getPackageVersions(packageName: string): Promise<PackageVersion[]> {
    const response = await fetch(`${this.baseUrl}/${packageName}`);
    if (!response.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }

    const data = await response.json();

    return Object.entries(data.versions).map(([version, info]: [string, any]) => ({
      version,
      deprecated: info.deprecated,
      publishedAt: data.time?.[version],
      dependencies: info.dependencies,
      devDependencies: info.devDependencies,
      peerDependencies: info.peerDependencies,
      dist: info.dist,
    }));
  }

  async searchPackages(query: string, limit: number = 20): Promise<PackageSearchResult> {
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();

    return {
      packages: data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        author: obj.package.publisher,
        keywords: obj.package.keywords,
        maintainers: obj.package.maintainers,
        deprecated: obj.package.deprecated,
      })),
      total: data.total,
      page: Math.floor(data.from / limit) + 1,
      pageSize: limit,
    };
  }

  async getDownloads(packageName: string, period: 'last-week' | 'last-month' | 'last-year' = 'last-week'): Promise<number> {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${period}/${packageName}`);
    if (!response.ok) {
      throw new Error('Failed to fetch downloads');
    }

    const data = await response.json();
    return data.downloads || 0;
  }

  async checkDependencies(dependencies: Record<string, string>): Promise<{
    outdated: Array<{ name: string; current: string; latest: string }>;
    vulnerabilities: SecurityVulnerability[];
  }> {
    const outdated: Array<{ name: string; current: string; latest: string }> = [];
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const pkg = await this.getPackage(name);
        if (pkg.version !== version) {
          outdated.push({ name, current: version, latest: pkg.version });
        }
      } catch (error) {
        // Package not found or other error
        continue;
      }
    }

    // Note: npm's audit API would require local npm audit
    // For now, we'll return empty vulnerabilities
    return { outdated, vulnerabilities };
  }

  async getPopularPackages(limit: number = 50): Promise<PackageInfo[]> {
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=keywords:popular&size=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch popular packages');
    }

    const data = await response.json();

    return data.objects.slice(0, limit).map((obj: any) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description,
      keywords: obj.package.keywords,
      maintainers: obj.package.maintainers,
    }));
  }
}

/**
 * PyPI Integration
 */
export class PyPIRegistry {
  private baseUrl = 'https://pypi.org/pypi';

  async getPackage(packageName: string): Promise<PackageInfo> {
    const response = await fetch(`${this.baseUrl}/${packageName}/json`);
    if (!response.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }

    const data = await response.json();
    const latestVersion = data.info.version;
    const latestRelease = data.releases[latestVersion]?.[0];

    return {
      name: data.info.name,
      version: latestVersion,
      description: data.info.summary,
      author: data.info.author,
      license: data.info.license,
      keywords: data.info.keywords?.split(',') || [],
      homepage: data.info.home_page,
      repository: data.info.project_url,
      bugs: data.info.bugs_url,
      dependencies: this.parseRequirements(latestRelease?.requires_dist),
      devDependencies: this.parseRequirements(latestRelease?.requires_dev),
      publishedAt: latestRelease?.upload_time,
      maintainers: data.info.maintainers?.map((m: string) => ({ name: m })),
      size: latestRelease?.size,
      files: data.releases[latestVersion]?.map((f: any) => f.filename) || [],
    };
  }

  async getPackageVersions(packageName: string): Promise<PackageVersion[]> {
    const response = await fetch(`${this.baseUrl}/${packageName}/json`);
    if (!response.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }

    const data = await response.json();

    return Object.entries(data.releases).map(([version, releases]: [string, any[]]) => ({
      version,
      publishedAt: releases[0]?.upload_time,
      dependencies: this.parseRequirements(releases[0]?.requires_dist),
      devDependencies: this.parseRequirements(releases[0]?.requires_dev),
      dist: {
        tarball: releases[0]?.url,
        shasum: releases[0]?.digests?.sha256,
      },
    }));
  }

  async searchPackages(query: string, limit: number = 20): Promise<PackageSearchResult> {
    const response = await fetch(`https://pypi.org/search/?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const html = await response.text();
    // Parse HTML to extract package information
    // This is a simplified version - in production, you'd use proper HTML parsing
    const packages: PackageInfo[] = [];

    // For now, return empty results
    return {
      packages,
      total: 0,
      page: 1,
      pageSize: limit,
    };
  }

  private parseRequirements(requirements?: string[]): Record<string, string> {
    if (!requirements) return {};

    const deps: Record<string, string> = {};
    requirements.forEach(req => {
      // Parse requirement strings like "requests>=2.25.0,<3.0.0"
      const match = req.match(/^([a-zA-Z0-9\-_]+)(.*)$/);
      if (match) {
        deps[match[1]] = match[2] || '*';
      }
    });

    return deps;
  }
}

/**
 * Security Advisory Integration
 */
export class SecurityAdvisory {
  private npmRegistry: NpmRegistry;

  constructor() {
    this.npmRegistry = new NpmRegistry();
  }

  async getVulnerabilities(packageName: string): Promise<SecurityVulnerability[]> {
    try {
      // Use GitHub Advisory Database API or OSV API
      const response = await fetch(`https://api.github.com/advisories?ecosystem=npm&package=${packageName}`);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.map((advisory: any) => ({
        id: advisory.ghsa_id,
        packageName: advisory.package_name,
        severity: this.mapSeverity(advisory.severity),
        title: advisory.summary,
        overview: advisory.description,
        recommendation: 'Update to the latest patched version',
        references: advisory.references?.map((ref: any) => ref.url) || [],
        cwe: advisory.cwes?.map((cwe: any) => cwe.cwe_id),
        cvssScore: advisory.cvss?.score,
        publishedAt: advisory.published_at,
        updatedAt: advisory.updated_at,
        affectedVersions: advisory.affected_versions || [],
        patchedVersions: advisory.patched_versions || [],
      }));
    } catch (error) {
      console.warn('Failed to fetch security advisories:', error);
      return [];
    }
  }

  async auditDependencies(dependencies: Record<string, string>): Promise<{
    vulnerabilities: SecurityVulnerability[];
    summary: {
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
  }> {
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const packageVulns = await this.getVulnerabilities(name);
        vulnerabilities.push(...packageVulns);
      } catch (error) {
        // Continue with other packages if one fails
        continue;
      }
    }

    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
    };

    return { vulnerabilities, summary };
  }

  private mapSeverity(severity?: string): 'low' | 'moderate' | 'high' | 'critical' {
    if (!severity) return 'moderate';

    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity.includes('critical')) return 'critical';
    if (lowerSeverity.includes('high')) return 'high';
    if (lowerSeverity.includes('moderate')) return 'moderate';
    return 'low';
  }
}

/**
 * Unified Package Manager
 */
export class PackageManager {
  private npm: NpmRegistry;
  private pypi: PyPIRegistry;
  private security: SecurityAdvisory;

  constructor() {
    this.npm = new NpmRegistry();
    this.pypi = new PyPIRegistry();
    this.security = new SecurityAdvisory();
  }

  async getPackage(packageName: string, registry: 'npm' | 'pypi' = 'npm'): Promise<PackageInfo> {
    switch (registry) {
      case 'npm':
        return this.npm.getPackage(packageName);
      case 'pypi':
        return this.pypi.getPackage(packageName);
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }
  }

  async searchPackages(
    query: string,
    registry: 'npm' | 'pypi' = 'npm',
    limit: number = 20
  ): Promise<PackageSearchResult> {
    switch (registry) {
      case 'npm':
        return this.npm.searchPackages(query, limit);
      case 'pypi':
        return this.pypi.searchPackages(query, limit);
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }
  }

  async checkDependencies(
    dependencies: Record<string, string>,
    registry: 'npm' | 'pypi' = 'npm'
  ): Promise<{
    outdated: Array<{ name: string; current: string; latest: string }>;
    vulnerabilities: SecurityVulnerability[];
  }> {
    switch (registry) {
      case 'npm':
        return this.npm.checkDependencies(dependencies);
      case 'pypi':
        // PyPI doesn't have a direct API for this, so we'll implement basic checking
        return this.checkPyPIDependencies(dependencies);
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }
  }

  private async checkPyPIDependencies(
    dependencies: Record<string, string>
  ): Promise<{
    outdated: Array<{ name: string; current: string; latest: string }>;
    vulnerabilities: SecurityVulnerability[];
  }> {
    const outdated: Array<{ name: string; current: string; latest: string }> = [];
    const vulnerabilities: SecurityVulnerability[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const pkg = await this.pypi.getPackage(name);
        if (pkg.version !== version) {
          outdated.push({ name, current: version, latest: pkg.version });
        }
      } catch (error) {
        continue;
      }
    }

    return { outdated, vulnerabilities };
  }

  async getSecurityReport(
    dependencies: Record<string, string>,
    registry: 'npm' | 'pypi' = 'npm'
  ): Promise<{
    vulnerabilities: SecurityVulnerability[];
    summary: {
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
    }> {
    if (registry === 'npm') {
      return this.security.auditDependencies(dependencies);
    }

    // For PyPI, we'd need to implement a similar security check
    return {
      vulnerabilities: [],
      summary: { critical: 0, high: 0, moderate: 0, low: 0 },
    };
  }

  async suggestUpdates(
    dependencies: Record<string, string>,
    registry: 'npm' | 'pypi' = 'npm',
    options: {
      includeBeta?: boolean;
      securityOnly?: boolean;
    } = {}
  ): Promise<{
    recommended: Array<{
      name: string;
      current: string;
      recommended: string;
      reason: string;
      riskLevel: 'low' | 'moderate' | 'high';
    }>;
    security: Array<{
      name: string;
      current: string;
      patched: string;
      vulnerabilities: SecurityVulnerability[];
    }>;
  }> {
    const check = await this.checkDependencies(dependencies, registry);
    const securityReport = await this.getSecurityReport(dependencies, registry);

    const recommended = check.outdated.map(pkg => ({
      name: pkg.name,
      current: pkg.current,
      recommended: pkg.latest,
      reason: 'Latest stable version available',
      riskLevel: 'moderate' as const,
    }));

    const security = securityReport.vulnerabilities.reduce((acc, vuln) => {
      const existing = acc.find(item => item.name === vuln.packageName);
      if (existing) {
        existing.vulnerabilities.push(vuln);
      } else {
        acc.push({
          name: vuln.packageName,
          current: dependencies[vuln.packageName] || 'unknown',
          patched: vuln.patchedVersions[0] || 'latest',
          vulnerabilities: [vuln],
        });
      }
      return acc;
    }, [] as Array<{
      name: string;
      current: string;
      patched: string;
      vulnerabilities: SecurityVulnerability[];
    }>);

    return { recommended, security };
  }

  async getPopularPackages(
    registry: 'npm' | 'pypi' = 'npm',
    category?: string,
    limit: number = 50
  ): Promise<PackageInfo[]> {
    switch (registry) {
      case 'npm':
        return this.npm.getPopularPackages(limit);
      case 'pypi':
        // PyPI doesn't have a direct popular packages API
        return [];
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }
  }
}