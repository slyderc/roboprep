import { useState } from 'react';
import { passwordValidation, passwordMatch } from '../lib/validation';

export function usePasswordValidation() {
  const [passwordValidationState, setPasswordValidationState] = useState(null);

  // Password validation handler
  const handlePasswordValidation = (validation) => {
    setPasswordValidationState(validation);
  };

  // Check password match
  const getPasswordMatchValidation = (password, confirmPassword) => {
    if (confirmPassword) {
      return passwordMatch.validate(password, confirmPassword);
    }
    return null;
  };

  // Validate password using the validation library
  const validatePassword = (password) => {
    return passwordValidation.validate(password);
  };

  // Get password input styling based on validation state
  const getPasswordInputStyling = (isValid) => {
    if (isValid === true) return 'border-green-500 pr-10';
    if (isValid === false) return 'border-red-500';
    return '';
  };

  // Render checkmark icon for valid inputs
  const renderValidationCheckmark = () => (
    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return {
    passwordValidationState,
    handlePasswordValidation,
    getPasswordMatchValidation,
    validatePassword,
    getPasswordInputStyling,
    renderValidationCheckmark
  };
}