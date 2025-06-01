import { useTurnstile } from '@/hooks/useTurnstile';

export default function TurnstileWidget({ widgetId = 'turnstile-widget', className = '' }) {
  const { shouldShowTurnstile, isLocalDevelopment, isClient, widgetProps } = useTurnstile(widgetId);
  
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
}