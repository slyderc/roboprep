'use client';

import { useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import TurnstileWidget from '@/components/TurnstileWidget';
import EmailValidator from '@/components/EmailValidator';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState(null);
  const [turnstileValidated, setTurnstileValidated] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const turnstileRef = useRef();

  // Email validation handler
  const handleEmailValidation = (validation) => {
    setEmailValidation(validation);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const basicFormValid = (
      email.trim() &&
      password.trim() &&
      emailValidation?.isValid
    );
    
    // Allow submission if basic form is valid AND either Turnstile is validated OR there's a Turnstile error
    const isValid = basicFormValid && (turnstileValidated || turnstileError);
    
    
    return isValid;
  };

  // Handle email change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  // Handle Turnstile success
  const handleTurnstileSuccess = (token) => {
    setTurnstileValidated(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError('');
    setIsLoading(true);
    
    // Validate Turnstile token using the widget ref
    const { token, isValid, error: turnstileError } = turnstileRef.current?.validateAndGetToken() || { token: null, isValid: true, error: null };
    
    if (!isValid) {
      setError(turnstileError);
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await login(email, password, token);
      
      if (result.success) {
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
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600 ${
                    emailValidation?.isValid === true ? 'border-green-500 pr-10' :
                    emailValidation?.isValid === false ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Email address"
                  value={email}
                  onChange={handleEmailChange}
                />
                {emailValidation?.isValid && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <EmailValidator email={email} onValidationChange={handleEmailValidation} />
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
                onChange={handlePasswordChange}
              />
            </div>
          </div>

          {/* Turnstile Widget */}
          <TurnstileWidget 
            ref={turnstileRef} 
            widgetId="turnstile-widget" 
            onSuccess={handleTurnstileSuccess}
            onError={() => setTurnstileError(true)}
          />
          
          {turnstileError && (
            <div className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
              ⚠️ Security verification having issues. You can still attempt to sign in.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}