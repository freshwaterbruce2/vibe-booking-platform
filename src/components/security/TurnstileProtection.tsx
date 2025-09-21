import { useEffect, useRef, useState } from 'react';

interface TurnstileProtectionProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  action?: string;
  className?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: string) => void;
          theme?: string;
          size?: string;
          action?: string;
          'refresh-expired'?: 'auto' | 'manual' | 'never';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | null;
      isExpired: (widgetId: string) => boolean;
    };
  }
}

export default function TurnstileProtection({
  siteKey,
  onVerify,
  onError,
  theme = 'auto',
  size = 'normal',
  action,
  className = ''
}: TurnstileProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Load Turnstile script
    if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeTurnstile();
      document.head.appendChild(script);
    } else {
      initializeTurnstile();
    }

    function initializeTurnstile() {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setIsVerified(true);
              onVerify(token);
            },
            'error-callback': (error: string) => {
              setIsLoading(false);
              setIsVerified(false);
              onError?.(error);
              console.error('Turnstile error:', error);
            },
            theme,
            size,
            action,
            'refresh-expired': 'auto',
            appearance: 'always'
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to render Turnstile:', error);
          setIsLoading(false);
          onError?.('Failed to initialize bot protection');
        }
      }
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to remove Turnstile widget:', error);
        }
      }
    };
  }, [siteKey, theme, size, action, onVerify, onError]);

  // Reset widget method
  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setIsVerified(false);
    }
  };

  // Get current token
  const getToken = (): string | null => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return null;
  };

  // Check if token is expired
  const isExpired = (): boolean => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.isExpired(widgetIdRef.current);
    }
    return true;
  };

  return (
    <div className={`turnstile-container ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center p-4 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600 mr-2" />
          Loading security verification...
        </div>
      )}

      <div
        ref={containerRef}
        className={`turnstile-widget ${isLoading ? 'hidden' : ''}`}
        data-testid="turnstile-widget"
      />

      {isVerified && (
        <div className="flex items-center text-green-600 text-sm mt-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Verified - You may proceed
        </div>
      )}

      {/* Hidden methods exposed via ref */}
      <div style={{ display: 'none' }}>
        <button onClick={reset} data-testid="turnstile-reset" />
        <span data-testid="turnstile-token">{getToken()}</span>
        <span data-testid="turnstile-expired">{isExpired() ? 'true' : 'false'}</span>
      </div>
    </div>
  );
}

// Hook for easier integration
export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = (newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsVerified(false);
    setToken(null);
  };

  const reset = () => {
    setToken(null);
    setIsVerified(false);
    setError(null);
  };

  return {
    token,
    isVerified,
    error,
    handleVerify,
    handleError,
    reset
  };
}