'use client';

import { useState, useEffect } from 'react';
import { emailValidation } from '@/lib/validation';

export default function EmailValidator({ email, onValidationChange }) {
  const [validation, setValidation] = useState(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (email) {
      const result = emailValidation.validate(email);
      setValidation(result);
      setShowValidation(true);
      
      // Notify parent component of validation status
      if (onValidationChange) {
        onValidationChange(result);
      }
    } else {
      setValidation(null);
      setShowValidation(false);
      if (onValidationChange) {
        onValidationChange(null);
      }
    }
  }, [email]); // Remove onValidationChange from dependencies to prevent infinite loops

  if (!showValidation || !validation) {
    return null;
  }

  // Component now only handles validation logic, no UI rendering
  return null;
}