import { getPythonEnvironmentManager, getPythonPackageManager } from '../python';
import { sessionDb } from '../database';

export async function handlePythonRoutes(request: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // Only handle Python API routes
  if (!path.startsWith('/api/python/')) {
    return null;
  }

  // Extract session ID from URL
  const sessionId = url.searchParams.get('sessionId') || 'default';

  // Get working directory from session
  let workingDirectory = process.cwd();
  if (sessionId !== 'default') {
    const session = sessionDb.getSession(sessionId);
    if (session) {
      workingDirectory = session.working_directory;
    }
  }

  const envManager = getPythonEnvironmentManager(sessionId, workingDirectory);

  // Environment Management Endpoints
  if (path === '/api/python/versions' && request.method === 'GET') {
    try {
      const versions = await envManager.detectPythonVersions();
      return new Response(JSON.stringify({ versions }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/environments' && request.method === 'GET') {
    try {
      const environments = await envManager.listVirtualEnvironments();
      return new Response(JSON.stringify({ environments }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/environments/status' && request.method === 'GET') {
    try {
      const status = await envManager.getEnvironmentStatus();
      return new Response(JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/environments/create' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { name, type = 'venv', pythonVersion } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Environment name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const environment = await envManager.createVirtualEnvironment(name, type, pythonVersion);
      return new Response(JSON.stringify({ environment }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/environments/activate' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { name } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Environment name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const environment = await envManager.activateEnvironment(name);
      return new Response(JSON.stringify({ environment }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/install' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { packages } = body;

      if (!packages || !Array.isArray(packages)) {
        return new Response(JSON.stringify({ error: 'Packages array is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await envManager.installPackages(packages);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/install-requirements' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { requirementsPath } = body;

      const result = await envManager.installFromRequirements(requirementsPath);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/uninstall' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { packages } = body;

      if (!packages || !Array.isArray(packages)) {
        return new Response(JSON.stringify({ error: 'Packages array is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await envManager.uninstallPackages(packages);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/script/run' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { scriptPath, args = [] } = body;

      if (!scriptPath) {
        return new Response(JSON.stringify({ error: 'Script path is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await envManager.runScript(scriptPath, args);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Package Manager Endpoints
  if (path === '/api/python/packages/search' && request.method === 'GET') {
    try {
      const query = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      if (!query) {
        return new Response(JSON.stringify({ error: 'Search query is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const results = await pkgManager.searchPackages(query, limit);

      return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/info' && request.method === 'GET') {
    try {
      const packageName = url.searchParams.get('name');

      if (!packageName) {
        return new Response(JSON.stringify({ error: 'Package name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const info = await pkgManager.getPackageInfo(packageName);

      if (!info) {
        return new Response(JSON.stringify({ error: 'Package not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ info }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/list' && request.method === 'GET') {
    try {
      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const packages = await pkgManager.listInstalledPackages();

      return new Response(JSON.stringify({ packages }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/outdated' && request.method === 'GET') {
    try {
      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const outdated = await pkgManager.checkOutdatedPackages();

      return new Response(JSON.stringify({ outdated }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/update' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { packageName } = body;

      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const result = await pkgManager.updatePackages(packageName);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/requirements/generate' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { includeVersions = true } = body;

      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const result = await pkgManager.saveRequirements(undefined, includeVersions);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (path === '/api/python/packages/dependencies' && request.method === 'GET') {
    try {
      const packageName = url.searchParams.get('name');

      if (!packageName) {
        return new Response(JSON.stringify({ error: 'Package name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const pkgManager = getPythonPackageManager(sessionId, workingDirectory);
      const dependencies = await pkgManager.getPackageDependencies(packageName);

      return new Response(JSON.stringify({ dependencies }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // No matching route
  return null;
}
