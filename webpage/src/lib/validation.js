/**
 * Validation utilities for user input
 */

// Security-safe special characters that won't cause database or injection issues
const SAFE_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Password validation rules and utilities
 */
export const passwordValidation = {
  rules: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    safeSpecialChars: SAFE_SPECIAL_CHARS
  },

  /**
   * Check if password meets minimum length requirement
   * @param {string} password 
   * @returns {boolean}
   */
  hasMinLength: (password) => password.length >= passwordValidation.rules.minLength,

  /**
   * Check if password contains uppercase letter
   * @param {string} password 
   * @returns {boolean}
   */
  hasUppercase: (password) => /[A-Z]/.test(password),

  /**
   * Check if password contains lowercase letter
   * @param {string} password 
   * @returns {boolean}
   */
  hasLowercase: (password) => /[a-z]/.test(password),

  /**
   * Check if password contains number
   * @param {string} password 
   * @returns {boolean}
   */
  hasNumber: (password) => /[0-9]/.test(password),

  /**
   * Check if password contains safe special character
   * @param {string} password 
   * @returns {boolean}
   */
  hasSpecialChar: (password) => {
    const escapedChars = SAFE_SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[${escapedChars}]`);
    return regex.test(password);
  },

  /**
   * Check for unsafe characters that could cause security issues
   * @param {string} password 
   * @returns {boolean}
   */
  hasUnsafeChars: (password) => {
    // Characters that could cause SQL injection, XSS, or other security issues
    const unsafeChars = /['"`\\\/\0\n\r\x1a]/;
    return unsafeChars.test(password);
  },

  /**
   * Get comprehensive password validation results
   * @param {string} password 
   * @returns {object}
   */
  validate: (password) => {
    const results = {
      isValid: false,
      score: 0,
      checks: {
        minLength: passwordValidation.hasMinLength(password),
        hasUppercase: passwordValidation.hasUppercase(password),
        hasLowercase: passwordValidation.hasLowercase(password),
        hasNumber: passwordValidation.hasNumber(password),
        hasSpecialChar: passwordValidation.hasSpecialChar(password),
        noUnsafeChars: !passwordValidation.hasUnsafeChars(password)
      },
      errors: []
    };

    // Calculate score based on completed requirements
    Object.values(results.checks).forEach(check => {
      if (check) results.score++;
    });

    // Check if all requirements are met
    results.isValid = results.score === 6;

    // Error messages removed - using visual checklist only

    return results;
  },

  /**
   * Get password strength description
   * @param {number} score 
   * @returns {object}
   */
  getStrength: (score) => {
    if (score <= 2) {
      return { level: 'weak', color: 'red', description: 'Weak' };
    } else if (score <= 4) {
      return { level: 'medium', color: 'yellow', description: 'Medium' };
    } else if (score < 6) {
      return { level: 'strong', color: 'blue', description: 'Strong' };
    } else {
      return { level: 'excellent', color: 'green', description: 'Excellent' };
    }
  }
};

/**
 * Email validation utilities
 */
export const emailValidation = {
  /**
   * Comprehensive email validation with security considerations
   * @param {string} email 
   * @returns {object}
   */
  validate: (email) => {
    const results = {
      isValid: false,
      errors: []
    };

    // Basic format check
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!email) {
      results.errors.push('Email address is required');
      return results;
    }

    if (!emailRegex.test(email)) {
      results.errors.push('Please enter a valid email address');
      return results;
    }

    // Length check
    if (email.length > 254) {
      results.errors.push('Email address is too long');
      return results;
    }

    // Local part (before @) length check
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      results.errors.push('Email address local part is too long');
      return results;
    }

    // Check for potentially unsafe characters
    const unsafeChars = /[<>'"\\]/;
    if (unsafeChars.test(email)) {
      results.errors.push('Email address contains invalid characters');
      return results;
    }

    // Check for consecutive dots
    if (email.includes('..')) {
      results.errors.push('Email address cannot contain consecutive dots');
      return results;
    }

    // Check for valid domain (silent check - no error message)
    const domain = email.split('@')[1];
    if (!domain || domain.length < 2) {
      return results;
    }

    // If we get here, email is valid
    results.isValid = true;
    return results;
  },

  /**
   * Simple email format check for real-time validation
   * @param {string} email 
   * @returns {boolean}
   */
  isValidFormat: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

/**
 * Utility to check if passwords match
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {object}
 */
export const passwordMatch = {
  validate: (password, confirmPassword) => {
    const results = {
      isValid: false,
      error: null
    };

    if (!confirmPassword) {
      results.error = 'Please confirm your password';
      return results;
    }

    if (password !== confirmPassword) {
      results.error = 'Passwords do not match';
      return results;
    }

    results.isValid = true;
    return results;
  }
};