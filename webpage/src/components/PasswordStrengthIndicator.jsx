'use client';

import { useState, useEffect } from 'react';
import { passwordValidation } from '@/lib/validation';

export default function PasswordStrengthIndicator({ password, onValidationChange }) {
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (password) {
      const result = passwordValidation.validate(password);
      const strength = passwordValidation.getStrength(result.score);
      const combined = { ...result, strength };
      setValidation(combined);
      
      // Notify parent component of validation status
      if (onValidationChange) {
        onValidationChange(combined);
      }
    } else {
      setValidation(null);
      if (onValidationChange) {
        onValidationChange(null);
      }
    }
  }, [password]); // Remove onValidationChange from dependencies to prevent infinite loops

  if (!password || !validation) {
    return null;
  }

  const getCheckIcon = (isValid) => {
    return isValid ? (
      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  const getStrengthBarColor = () => {
    switch (validation.strength.color) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthTextColor = () => {
    switch (validation.strength.color) {
      case 'red': return 'text-red-600 dark:text-red-400';
      case 'yellow': return 'text-yellow-600 dark:text-yellow-400';
      case 'blue': return 'text-blue-600 dark:text-blue-400';
      case 'green': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="mt-2 space-y-3">
      {/* Password Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Strength
          </span>
          <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
            {validation.strength.description}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
            style={{ width: `${(validation.score / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Password Requirements Checklist */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Password Requirements:
        </h4>
        <div className="grid grid-cols-1 gap-1 text-sm">
          <div className={`flex items-center space-x-2 ${validation.checks.minLength ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {getCheckIcon(validation.checks.minLength)}
            <span>At least 8 characters</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${validation.checks.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {getCheckIcon(validation.checks.hasUppercase)}
            <span>One uppercase letter (A-Z)</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${validation.checks.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {getCheckIcon(validation.checks.hasLowercase)}
            <span>One lowercase letter (a-z)</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${validation.checks.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {getCheckIcon(validation.checks.hasNumber)}
            <span>One number (0-9)</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${validation.checks.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {getCheckIcon(validation.checks.hasSpecialChar)}
            <span>One special character (!@#$%^&*)</span>
          </div>
          
          <div className={`flex items-center space-x-2 ${validation.checks.noUnsafeChars ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {getCheckIcon(validation.checks.noUnsafeChars)}
            <span>No unsafe characters</span>
          </div>
        </div>
      </div>


    </div>
  );
}