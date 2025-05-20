'use client';

import { useState, useEffect } from 'react';
import { getDbStats } from '@/lib/apiClient';

export default function DbStatsPanel({ refreshTrigger = 0 }) {
  const [stats, setStats] = useState(null);
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

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const statItem = (label, value) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Database Statistics</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchStats}
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
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">No statistics available</div>
      )}
    </div>
  );
}