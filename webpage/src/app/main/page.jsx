'use client';

import React from 'react';
import { PromptProvider } from '../../context/PromptContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { HomePage } from '../../components/HomePage';
import { useAuth } from '../../context/AuthContext';

// Main application entry point
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
          <HomePage />
        </div>
      </PromptProvider>
    </SettingsProvider>
  );
}