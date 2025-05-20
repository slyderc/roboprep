'use client';

import React, { useEffect } from 'react';
import { PromptProvider } from '../context/PromptContext';
import { SettingsProvider } from '../context/SettingsContext';
import { HomePage } from '../components/HomePage';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    // Debug information for authentication
    const cookies = document.cookie;
    console.log('Cookies available:', cookies);
    console.log('Authentication state:', { user, isAuthenticated, loading });
    
    // Check for the auth cookie
    const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('robo_auth='));
    console.log('Auth cookie present:', !!authCookie);
    
    if (!isAuthenticated && !loading) {
      console.log('Not authenticated, redirecting to login...');
      window.location.href = '/login';
    }
  }, [user, isAuthenticated, loading]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;
  }
  
  return (
    <SettingsProvider>
      <PromptProvider>
        <HomePage />
      </PromptProvider>
    </SettingsProvider>
  );
}