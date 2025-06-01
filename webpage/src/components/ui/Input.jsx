import React, { forwardRef } from 'react';
import { createPortal } from 'react-dom';

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
  value,
  onChange,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || '');
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const selectRef = React.useRef(null);
  const buttonRef = React.useRef(null);

  // Extract options from children
  const options = React.Children.toArray(children).map(child => ({
    value: child.props.value,
    label: child.props.children
  }));

  const selectedOption = options.find(opt => opt.value === selectedValue) || options[0];

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleSelect = (optionValue, event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedValue(optionValue);
    setIsOpen(false);
    // Re-enable modal click-outside handler when selection is made
    setTimeout(() => {
      window.modalClickOutsideDisabled = false;
    }, 100);
    if (onChange) {
      onChange({ target: { value: optionValue } });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculateDropdownPosition();
      // Disable modal click-outside handler
      window.modalClickOutsideDisabled = true;
    } else {
      // Re-enable modal click-outside handler after a brief delay
      setTimeout(() => {
        window.modalClickOutsideDisabled = false;
      }, 100);
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the select button itself
      if (selectRef.current && selectRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking on dropdown options (they have their own click handlers)
      if (event.target.closest('[data-dropdown-option]')) {
        return;
      }
      
      // Close dropdown for any other outside clicks
      setIsOpen(false);
      // Re-enable modal click-outside handler when dropdown closes
      window.modalClickOutsideDisabled = false;
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        // Ensure modal click-outside is re-enabled when component unmounts
        window.modalClickOutsideDisabled = false;
      };
    }
  }, [isOpen]);

  // Update internal state when value prop changes
  React.useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  // Recalculate position on window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <>
      <div ref={selectRef} className={`relative ${className}`} {...props}>
        <button
          type="button"
          ref={buttonRef}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex justify-between items-center"
          onClick={handleToggle}
        >
          <span className={selectedOption?.value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedOption?.label || 'Select...'}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-40 overflow-y-auto"
          data-dropdown-option
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 50001,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              data-dropdown-option
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none border-none bg-transparent cursor-pointer"
              onClick={(e) => handleSelect(option.value, e)}
              style={{ display: 'block' }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
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