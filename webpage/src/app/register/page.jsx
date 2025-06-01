'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  // Check if we should show Turnstile based on environment (after hydration)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalDevelopment = isClient && isDevelopment &&
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');
  
  // Show Turnstile when site key exists and not in local development
  const shouldShowTurnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !isLocalDevelopment;

  // Set client state after hydration to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle Turnstile widget initialization
  useEffect(() => {
    if (!shouldShowTurnstile) {
      // Set a dummy token for localhost/development
      setTurnstileToken('development-bypass');
      return;
    }

    // Define callback function globally
    window.onTurnstileSuccess = (token) => {
      console.log('Turnstile success callback received token:', token ? 'Yes' : 'No');
      setTurnstileToken(token);
    };

    // Initialize Turnstile widget when the script is loaded
    const initTurnstile = () => {
      if (window.turnstile && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        const widgetId = window.turnstile.render('#turnstile-widget-register', {
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
      // Cleanup Turnstile widget and callback
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch (err) {
          console.warn('Could not remove Turnstile widget:', err);
        }
      }
      delete window.onTurnstileSuccess;
      setTurnstileWidgetId(null);
      setTurnstileToken(null);
    };
  }, [shouldShowTurnstile]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining Turnstile widgets on unmount
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch (err) {
          console.warn('Could not remove Turnstile widget on unmount:', err);
        }
      }
      delete window.onTurnstileSuccess;
    };
  }, [turnstileWidgetId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);

    // Get the current token or try fallback
    let currentToken = turnstileToken;
    
    // Check if Turnstile token is available (only for production)
    if (shouldShowTurnstile && !currentToken) {
      // Try to get token directly from Turnstile widget as fallback
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          currentToken = window.turnstile.getResponse(turnstileWidgetId);
          console.log('Retrieved fallback token for registration:', currentToken ? 'Yes' : 'No');
          if (currentToken) {
            setTurnstileToken(currentToken);
          }
        } catch (err) {
          console.warn('Could not get Turnstile response:', err);
        }
      }
      
      if (!currentToken) {
        setError('Please complete the security verification.');
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const result = await register(
        formData.email, 
        formData.password,
        formData.firstName,
        formData.lastName,
        currentToken
      );
      
      if (result.success) {
        // Use window.location for a full page reload to ensure cookie is set
        window.location.href = '/main';
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in
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
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Turnstile Widget - Only show in production */}
          {shouldShowTurnstile && (
            <div className="flex justify-center">
              <div 
                id="turnstile-widget-register"
                className="cf-turnstile" 
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
              ></div>
            </div>
          )}
          
          {/* Development Notice - only show after hydration */}
          {isClient && !shouldShowTurnstile && isLocalDevelopment && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Development mode - Security verification bypassed
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}