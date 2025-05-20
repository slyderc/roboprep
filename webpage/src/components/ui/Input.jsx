import React, { forwardRef } from 'react';

export const Input = forwardRef(({ 
  className,
  type = 'text',
  ...props
}, ref) => {
  return (
    <input
      type={type}
      className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const TextArea = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <textarea
      className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

TextArea.displayName = 'TextArea';

export const Select = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <select
      className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export const Label = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';

export const FormGroup = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div 
      className={`space-y-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};