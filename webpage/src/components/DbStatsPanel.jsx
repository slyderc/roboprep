'use client';

import { useState, useEffect } from 'react';
import { getDbStats } from '@/lib/apiClient';

export default function DbStatsPanel({ refreshTrigger = 0 }) {
  const [stats, setStats] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDbStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/admin/database');
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      }
    } catch (error) {
      console.error('Error fetching database status:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDatabaseStatus();
  }, [refreshTrigger]);

  const statItem = (label, value) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );

  const refreshAll = () => {
    fetchStats();
    fetchDatabaseStatus();
  };

  const triggerUpgrade = async () => {
    if (!confirm('Are you sure you want to upgrade the database? A backup will be created automatically.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'upgrade' }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ ${result.message}`);
        await fetchDatabaseStatus();
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error upgrading database:', error);
      alert('❌ Database upgrade failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const needsUpgrade = dbStatus?.upgradeInfo?.needsUpgrade;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Database Overview</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshAll}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Database Version & Management */}
      {dbStatus && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Database Management</h3>
            {needsUpgrade && (
              <button
                onClick={triggerUpgrade}
                disabled={loading}
                className="px-3 py-1 text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Upgrading...' : 'Upgrade Database'}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Current Version: </span>
              <span className="font-mono text-gray-900 dark:text-white">{dbStatus.currentVersion}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Target Version: </span>
              <span className="font-mono text-gray-900 dark:text-white">{dbStatus.environment.targetVersion}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Environment: </span>
              <span className="font-mono text-gray-900 dark:text-white">{dbStatus.environment.nodeEnv}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status: </span>
              <span className={`font-medium ${needsUpgrade ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {needsUpgrade ? 'Upgrade Available' : 'Up to Date'}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : stats ? (
        <div className="space-y-1">
          {expanded ? (
            <>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Statistics</h3>
              {statItem('Prompts (Total)', stats.promptCount)}
              {statItem('User Prompts', stats.userPromptCount)}
              {statItem('Core Prompts', stats.corePromptCount)}
              {statItem('Categories', stats.categoryCount)}
              {statItem('Tags', stats.tagCount)}
              {statItem('Responses', stats.responseCount)}
              {statItem('User Favorites', stats.userFavoriteCount)}
              {statItem('User Recently Used', stats.userRecentlyUsedCount)}
              {statItem('Users', stats.userCount)}
              {statItem('Global Settings', stats.settingCount)}
              {statItem('User Settings', stats.userSettingCount)}
            </>
          ) : (
            <>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Summary Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.promptCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Prompts</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.responseCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Responses</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.userCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.userFavoriteCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No statistics available</div>
      )}
    </div>
  );
}