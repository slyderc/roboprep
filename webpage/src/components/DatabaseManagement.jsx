'use client';

import { useState, useEffect } from 'react';

export default function DatabaseManagement() {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/admin/database');
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      } else {
        setMessage('Failed to fetch database status');
      }
    } catch (error) {
      console.error('Error fetching database status:', error);
      setMessage('Error fetching database status');
    } finally {
      setLoading(false);
    }
  };

  const triggerUpgrade = async () => {
    if (!confirm('Are you sure you want to upgrade the database? A backup will be created automatically.')) {
      return;
    }

    setUpgrading(true);
    setMessage('');

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
        setMessage(`✅ ${result.message}`);
        // Refresh database status
        await fetchDatabaseStatus();
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error upgrading database:', error);
      setMessage('❌ Database upgrade failed: ' + error.message);
    } finally {
      setUpgrading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Management</h3>
        <div className="text-gray-600 dark:text-gray-400">Loading database status...</div>
      </div>
    );
  }

  if (!dbStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Management</h3>
        <div className="text-red-600 dark:text-red-400">Failed to load database status</div>
      </div>
    );
  }

  const needsUpgrade = dbStatus.upgradeInfo?.needsUpgrade;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Management</h3>
      
      {/* Environment Information */}
      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Environment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Environment:</span>
              <span className="font-mono text-gray-900 dark:text-white">{dbStatus.environment.nodeEnv}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Database:</span>
              <span className="font-mono text-gray-900 dark:text-white">{dbStatus.environment.databaseUrl}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {needsUpgrade && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Database Upgrade Available
              </h4>
              <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Your database version ({dbStatus.currentVersion}) can be upgraded to {dbStatus.environment.targetVersion}. 
                This will add new features while preserving all existing data.
              </div>
              <div className="mt-3">
                <button
                  onClick={triggerUpgrade}
                  disabled={upgrading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Upgrading...
                    </>
                  ) : (
                    'Upgrade Database'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          message.startsWith('✅') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}


      {/* Refresh Button */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={fetchDatabaseStatus}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
}