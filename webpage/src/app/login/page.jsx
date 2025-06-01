'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState(null);
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  // Check if we should show Turnstile (not localhost/development)
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.startsWith('192.168.'));
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldShowTurnstile = !isLocalhost && !isDevelopment && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Handle Turnstile widget initialization
  useEffect(() => {
    if (!shouldShowTurnstile) {
      // Set a dummy token for localhost/development
      setTurnstileToken('development-bypass');
      return;
    }

    // Define callback function globally
    window.onTurnstileSuccess = (token) => {
      setTurnstileToken(token);
    };

    // Initialize Turnstile widget when the script is loaded
    const initTurnstile = () => {
      if (window.turnstile && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        const widgetId = window.turnstile.render('#turnstile-widget', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: 'onTurnstileSuccess',
        });
        setTurnstileWidgetId(widgetId);
      }
    };

    // Check if Turnstile is already loaded
    if (window.turnstile) {
      initTurnstile();
    } else {
      // Wait for Turnstile script to load
      const script = document.querySelector('script[src*="turnstile"]');
      if (script) {
        script.addEventListener('load', initTurnstile);
      }
    }

    return () => {
      // Cleanup
      delete window.onTurnstileSuccess;
    };
  }, [shouldShowTurnstile]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError('');
    setIsLoading(true);
    
    // Check if Turnstile token is available (only for production)
    if (shouldShowTurnstile && !turnstileToken) {
      setError('Please complete the security verification.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Attempting login with email:', email);
      const result = await login(email, password, turnstileToken);
      
      if (result.success) {
        console.log('Login successful, redirecting to:', '/main');
        // Add a small delay to ensure cookie is set before redirecting
        setTimeout(() => {
          window.location.href = '/main';
        }, 100);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <Image
            src="/assets/logo/logo-roboShowprep-popup.png"
            alt="Robo Show Prep Logo"
            width={200}
            height={100}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-200 dark:border-red-700" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Turnstile Widget - Only show in production */}
          {shouldShowTurnstile && (
            <div className="flex justify-center">
              <div 
                id="turnstile-widget"
                className="cf-turnstile" 
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
              ></div>
            </div>
          )}
          
          {/* Development Notice */}
          {!shouldShowTurnstile && isDevelopment && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Development mode - Security verification bypassed
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}