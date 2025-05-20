'use client';

import React from 'react';
import { PromptProvider } from '../../context/PromptContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { HomePage } from '../../components/HomePage';
import { useAuth } from '../../context/AuthContext';

// This is an alternate entry point to the main app that bypasses middleware
export default function MainPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = '/login?redirect=/main';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl font-semibold text-gray-800">Redirecting to login...</div>
      </div>
    );
  }
  
  return (
    <SettingsProvider>
      <PromptProvider>
        <div className="relative min-h-screen">
          {/* Debug info banner - visible only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 border-b border-blue-200 p-2 text-sm text-blue-800">
              <div className="container mx-auto">
                <p>
                  <span className="font-semibold">Authenticated as:</span> {user?.email} 
                  {user?.isAdmin && <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">Admin</span>}
                </p>
                <p className="text-xs mt-1">
                  <span className="font-semibold">User ID:</span> {user?.id}
                </p>
              </div>
            </div>
          )}
          
          <HomePage />
        </div>
      </PromptProvider>
    </SettingsProvider>
  );
}