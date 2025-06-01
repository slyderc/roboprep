'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TurnstileWidget from '@/components/TurnstileWidget';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import EmailValidator from '@/components/EmailValidator';
import { emailValidation } from '@/lib/validation';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';

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
  const [validationStates, setValidationStates] = useState({
    email: null,
    password: null,
    passwordMatch: null
  });
  const [turnstileValidated, setTurnstileValidated] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
  
  // Use password validation hook
  const {
    passwordValidationState,
    handlePasswordValidation,
    getPasswordMatchValidation,
    validatePassword,
    getPasswordInputStyling,
    renderValidationCheckmark
  } = usePasswordValidation();
  
  const { register } = useAuth();
  const router = useRouter();
  const turnstileRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Validation handlers
  const handleEmailValidation = (validation) => {
    setValidationStates(prev => ({ ...prev, email: validation }));
  };

  // Turnstile success handler
  const handleTurnstileSuccess = (token) => {
    setTurnstileValidated(true);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const passwordMatchValidation = getPasswordMatchValidation(formData.password, formData.confirmPassword);
    const basicFormValid = (
      validationStates.email?.isValid &&
      passwordValidationState?.isValid &&
      passwordMatchValidation?.isValid &&
      formData.firstName.trim() &&
      formData.lastName.trim()
    );
    
    // Check if we're in local development
    const isLocalDevelopment = typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'development' &&
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1');
    
    // In development mode, skip Turnstile validation
    // In production, require Turnstile validation OR allow fallback if there's an error
    const turnstileValid = isLocalDevelopment || turnstileValidated || turnstileError;
    
    return basicFormValid && turnstileValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Comprehensive client-side validation
    const emailValid = emailValidation.validate(formData.email);
    const passwordValid = validatePassword(formData.password);
    const passwordsMatch = getPasswordMatchValidation(formData.password, formData.confirmPassword);
    
    // Check email validation
    if (!emailValid.isValid) {
      setError(emailValid.errors[0] || 'Please enter a valid email address');
      return;
    }
    
    // Check password validation
    if (!passwordValid.isValid) {
      setError(passwordValid.errors[0] || 'Password does not meet requirements');
      return;
    }
    
    // Check password match
    if (!passwordsMatch.isValid) {
      setError(passwordsMatch.error || 'Passwords do not match');
      return;
    }
    
    // Check required fields
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    
    setIsLoading(true);

    // Validate Turnstile token using the widget ref
    const { token, isValid, error: turnstileError } = turnstileRef.current?.validateAndGetToken() || { token: null, isValid: true, error: null };
    
    if (!isValid) {
      setError(turnstileError);
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await register(
        formData.email, 
        formData.password,
        formData.firstName,
        formData.lastName,
        token
      );
      
      if (result.success) {
        if (result.needsApproval) {
          // Show success message for users needing approval
          setError('');
          alert('Registration successful! Your account is pending administrator approval. You will be able to sign in once approved.');
          router.push('/login');
        } else {
          // Use window.location for a full page reload to ensure cookie is set
          window.location.href = '/main';
        }
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
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600 ${
                      validationStates.email?.isValid === true ? 'border-green-500 pr-10' :
                      validationStates.email?.isValid === false ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {validationStates.email?.isValid && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <EmailValidator email={formData.email} onValidationChange={handleEmailValidation} />
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
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600 ${
                      getPasswordInputStyling(passwordValidationState?.isValid) || 'border-gray-300'
                    }`}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {passwordValidationState?.isValid && renderValidationCheckmark()}
                </div>
                <PasswordStrengthIndicator password={formData.password} onValidationChange={handlePasswordValidation} />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600 ${
                      getPasswordInputStyling(getPasswordMatchValidation(formData.password, formData.confirmPassword)?.isValid) || 'border-gray-300'
                    }`}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {getPasswordMatchValidation(formData.password, formData.confirmPassword)?.isValid && renderValidationCheckmark()}
                </div>
              </div>
            </div>
          </div>

          {/* Turnstile Widget */}
          <TurnstileWidget 
            ref={turnstileRef} 
            widgetId="turnstile-widget-register" 
            onSuccess={handleTurnstileSuccess}
            onError={() => setTurnstileError(true)}
          />
          
          {turnstileError && (
            <div className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
              ⚠️ Security verification having issues. You can still attempt to create account.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
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