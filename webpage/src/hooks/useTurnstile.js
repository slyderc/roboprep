import { useState, useEffect, useRef } from 'react';

export function useTurnstile(widgetId = 'turnstile-widget', onSuccess = null) {
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const callbackRef = useRef(null);
  
  // Environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalDevelopment = isClient && isDevelopment &&
    (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'));
  
  const shouldShowTurnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !isLocalDevelopment;
  
  // Generate unique callback name to avoid conflicts
  const callbackName = `onTurnstileSuccess_${widgetId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!shouldShowTurnstile) {
      setTurnstileToken('development-bypass');
      if (onSuccess) {
        onSuccess('development-bypass');
      }
      return;
    }
    
    // Create unique callback function
    const callback = (token) => {
      console.log(`Turnstile success callback (${widgetId}) received token:`, token ? 'Yes' : 'No');
      setTurnstileToken(token);
      if (onSuccess) {
        onSuccess(token);
      }
    };
    
    callbackRef.current = callback;
    window[callbackName] = callback;
    
    const initTurnstile = () => {
      if (window.turnstile && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        const element = document.getElementById(widgetId);
        if (element && !element.hasChildNodes()) {
          const widget = window.turnstile.render(`#${widgetId}`, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            callback: callbackName,
          });
          setTurnstileWidgetId(widget);
        }
      }
    };
    
    if (window.turnstile) {
      initTurnstile();
    } else {
      const script = document.querySelector('script[src*="turnstile"]');
      if (script) {
        script.addEventListener('load', initTurnstile);
      }
    }
    
    return () => {
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch (err) {
          console.warn('Could not remove Turnstile widget:', err);
        }
      }
      delete window[callbackName];
      setTurnstileWidgetId(null);
      setTurnstileToken(null);
    };
  }, [shouldShowTurnstile, widgetId, callbackName, onSuccess]);
  
  // Token validation utility
  const validateAndGetToken = () => {
    let currentToken = turnstileToken;
    
    if (shouldShowTurnstile && !currentToken) {
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          currentToken = window.turnstile.getResponse(turnstileWidgetId);
          console.log(`Retrieved fallback token (${widgetId}):`, currentToken ? 'Yes' : 'No');
          if (currentToken) {
            setTurnstileToken(currentToken);
          }
        } catch (err) {
          console.warn('Could not get Turnstile response:', err);
        }
      }
    }
    
    return {
      token: currentToken,
      isValid: !shouldShowTurnstile || !!currentToken,
      error: shouldShowTurnstile && !currentToken ? 'Please complete the security verification.' : null
    };
  };
  
  return {
    turnstileToken,
    shouldShowTurnstile,
    isLocalDevelopment,
    isClient,
    validateAndGetToken,
    widgetProps: {
      id: widgetId,
      className: "cf-turnstile",
      'data-sitekey': process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      'data-callback': callbackName
    }
  };
}