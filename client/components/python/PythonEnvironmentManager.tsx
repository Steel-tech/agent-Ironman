import React, { useState, useEffect } from 'react';
import { Settings, Plus, Play, Package, Terminal, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';

interface PythonVersion {
  version: string;
  path: string;
  isDefault: boolean;
}

interface VirtualEnvironment {
  name: string;
  path: string;
  pythonVersion: string;
  type: 'venv' | 'conda' | 'poetry';
  packages: PackageInfo[];
  isActive: boolean;
}

interface PackageInfo {
  name: string;
  version: string;
  location?: string;
}

interface PythonEnvironmentStatus {
  installedVersions: PythonVersion[];
  activeEnvironment: VirtualEnvironment | null;
  availableEnvironments: VirtualEnvironment[];
  projectRequirements: string[];
}

interface Props {
  sessionId: string;
}

export const PythonEnvironmentManager: React.FC<Props> = ({ sessionId }) => {
  const [status, setStatus] = useState<PythonEnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'environments' | 'packages'>('environments');
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvType, setNewEnvType] = useState<'venv' | 'conda' | 'poetry'>('venv');
  const [packageToInstall, setPackageToInstall] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadStatus();
  }, [sessionId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/python/environments/status?sessionId=${sessionId}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load Python status:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEnvironment = async () => {
    if (!newEnvName.trim()) {
      setOperationMessage({ type: 'error', message: 'Environment name is required' });
      return;
    }

    try {
      setOperationLoading(true);
      const response = await fetch(`/api/python/environments/create?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEnvName, type: newEnvType }),
      });

      const data = await response.json();

      if (response.ok) {
        setOperationMessage({ type: 'success', message: `Environment ${newEnvName} created successfully` });
        setNewEnvName('');
        await loadStatus();
      } else {
        setOperationMessage({ type: 'error', message: data.error || 'Failed to create environment' });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Failed to create environment' });
    } finally {
      setOperationLoading(false);
    }
  };

  const activateEnvironment = async (name: string) => {
    try {
      setOperationLoading(true);
      const response = await fetch(`/api/python/environments/activate?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok) {
        setOperationMessage({ type: 'success', message: `Environment ${name} activated` });
        await loadStatus();
      } else {
        setOperationMessage({ type: 'error', message: data.error || 'Failed to activate environment' });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Failed to activate environment' });
    } finally {
      setOperationLoading(false);
    }
  };

  const installPackage = async () => {
    if (!packageToInstall.trim()) {
      setOperationMessage({ type: 'error', message: 'Package name is required' });
      return;
    }

    if (!status?.activeEnvironment) {
      setOperationMessage({ type: 'error', message: 'No active environment. Please activate an environment first.' });
      return;
    }

    try {
      setOperationLoading(true);
      const packages = packageToInstall.split(' ').filter(p => p.trim());
      const response = await fetch(`/api/python/packages/install?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages }),
      });

      const data = await response.json();

      if (data.success) {
        setOperationMessage({ type: 'success', message: `Packages installed successfully` });
        setPackageToInstall('');
        await loadStatus();
      } else {
        setOperationMessage({ type: 'error', message: data.output || 'Failed to install packages' });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Failed to install packages' });
    } finally {
      setOperationLoading(false);
    }
  };

  const installRequirements = async () => {
    if (!status?.activeEnvironment) {
      setOperationMessage({ type: 'error', message: 'No active environment. Please activate an environment first.' });
      return;
    }

    try {
      setOperationLoading(true);
      const response = await fetch(`/api/python/packages/install-requirements?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setOperationMessage({ type: 'success', message: 'Requirements installed successfully' });
        await loadStatus();
      } else {
        setOperationMessage({ type: 'error', message: data.output || 'Failed to install requirements' });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Failed to install requirements' });
    } finally {
      setOperationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Python Environment Manager
        </h2>
        <button
          onClick={loadStatus}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Operation Message */}
      {operationMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            operationMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {operationMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{operationMessage.message}</span>
          <button
            onClick={() => setOperationMessage(null)}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Python Versions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-sm">Installed Python Versions</h3>
        {status?.installedVersions && status.installedVersions.length > 0 ? (
          <div className="space-y-1">
            {status.installedVersions.map((version, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Terminal className="w-3 h-3 text-gray-500" />
                <span className="font-mono">{version.version}</span>
                {version.isDefault && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                    default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No Python installations found</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('environments')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'environments'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Environments
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'packages'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Packages
        </button>
      </div>

      {/* Environments Tab */}
      {activeTab === 'environments' && (
        <div className="space-y-4">
          {/* Active Environment */}
          {status?.activeEnvironment && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-sm">Active Environment</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {status.activeEnvironment.name}</p>
                <p><span className="font-medium">Type:</span> {status.activeEnvironment.type}</p>
                <p><span className="font-medium">Python:</span> {status.activeEnvironment.pythonVersion}</p>
                <p><span className="font-medium">Packages:</span> {status.activeEnvironment.packages.length}</p>
              </div>
            </div>
          )}

          {/* Create New Environment */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Environment
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Environment Name</label>
                <input
                  type="text"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="my-env"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Environment Type</label>
                <select
                  value={newEnvType}
                  onChange={(e) => setNewEnvType(e.target.value as 'venv' | 'conda' | 'poetry')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                >
                  <option value="venv">venv (Standard)</option>
                  <option value="conda">conda</option>
                  <option value="poetry">poetry</option>
                </select>
              </div>
              <button
                onClick={createEnvironment}
                disabled={operationLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {operationLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Environment
              </button>
            </div>
          </div>

          {/* Available Environments */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Available Environments</h3>
            {status?.availableEnvironments && status.availableEnvironments.length > 0 ? (
              <div className="space-y-2">
                {status.availableEnvironments.map((env, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 ${
                      env.isActive
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{env.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {env.type} • Python {env.pythonVersion} • {env.packages.length} packages
                        </p>
                      </div>
                      {!env.isActive && (
                        <button
                          onClick={() => activateEnvironment(env.name)}
                          disabled={operationLoading}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No environments found</p>
            )}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {!status?.activeEnvironment ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
              <p>Please activate an environment to manage packages.</p>
            </div>
          ) : (
            <>
              {/* Install Package */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Install Packages
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Package Name(s)</label>
                    <input
                      type="text"
                      value={packageToInstall}
                      onChange={(e) => setPackageToInstall(e.target.value)}
                      placeholder="requests flask pandas"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple packages with spaces</p>
                  </div>
                  <button
                    onClick={installPackage}
                    disabled={operationLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {operationLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Install
                  </button>
                </div>
              </div>

              {/* Install from requirements.txt */}
              {status?.projectRequirements && status.projectRequirements.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-sm">Project Requirements</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Found requirements.txt with {status.projectRequirements.length} packages
                  </p>
                  <button
                    onClick={installRequirements}
                    disabled={operationLoading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {operationLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Install from requirements.txt
                  </button>
                </div>
              )}

              {/* Installed Packages */}
              <div>
                <h3 className="font-semibold mb-2 text-sm">Installed Packages ({status.activeEnvironment.packages.length})</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {status.activeEnvironment.packages.length > 0 ? (
                    <div className="space-y-1">
                      {status.activeEnvironment.packages.map((pkg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm py-1">
                          <span className="font-mono">{pkg.name}</span>
                          <span className="text-gray-500 text-xs">{pkg.version}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No packages installed</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
