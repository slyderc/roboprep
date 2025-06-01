import { useTurnstile } from '@/hooks/useTurnstile';
import { forwardRef, useImperativeHandle } from 'react';

const TurnstileWidget = forwardRef(({ widgetId = 'turnstile-widget', className = '' }, ref) => {
  const { shouldShowTurnstile, isLocalDevelopment, isClient, widgetProps, validateAndGetToken } = useTurnstile(widgetId);
  
  useImperativeHandle(ref, () => ({
    validateAndGetToken
  }), [validateAndGetToken]);
  
  if (!shouldShowTurnstile) {
    return isClient && isLocalDevelopment ? (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Development mode - Security verification bypassed
      </div>
    ) : null;
  }
  
  return (
    <div className={`flex justify-center ${className}`}>
      <div {...widgetProps} />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;