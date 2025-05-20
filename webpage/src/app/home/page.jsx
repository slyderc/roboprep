'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Simple fallback UI to display without dependencies
export default function Home() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});
  const { user, isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    try {
      // Debug information for authentication
      const cookies = document.cookie;
      console.log('Home page loaded. Cookies available:', cookies);
      console.log('Authentication state:', { user, isAuthenticated, loading });
      
      // Check server environment with simple endpoint
      fetch('/api/simple-check')
        .then(res => res.json())
        .then(data => {
          console.log('Simple check response:', data);
          
          setDebugInfo({
            cookies,
            serverCookies: data.cookies,
            environment: data.environment,
            user: user ? `${user.email} (${user.id})` : 'Not logged in',
            isAuthenticated,
            loading
          });
          
          // Set loading to false after getting the data
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error checking server environment:', err);
          setError('Failed to check server environment: ' + err.message);
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Error in home page:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [user, isAuthenticated, loading]);
  
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>Please wait while we set up your session</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Basic UI for testing
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold">RoboPrep Dashboard</h1>
          <p className="text-gray-600">Simple test page to bypass authentication issues</p>
        </header>
        
        <div className="bg-yellow-100 p-4 rounded-lg shadow-md mb-6">
          <h2 className="font-bold text-yellow-800">Authentication Status</h2>
          <p>
            {isAuthenticated 
              ? `✅ Authenticated as ${user?.email}` 
              : '❌ Not authenticated'}
          </p>
          {!isAuthenticated && (
            <a 
              href="/login" 
              className="inline-block mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
            >
              Go to login
            </a>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => window.location.href = '/main'}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Main Page
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Reload This Page
            </button>
            
            <button 
              onClick={() => {
                // Clear cookies and reload
                document.cookie.split(';').forEach(c => {
                  document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                });
                window.location.href = '/login';
              }}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout (Clear Cookies)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}