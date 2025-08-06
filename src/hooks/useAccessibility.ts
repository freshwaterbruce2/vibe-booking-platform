import { useEffect, useRef, useCallback, useState } from 'react';

// Hook for managing focus
export const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndexRef = useRef<number>(-1);

  const setFocusableElements = (elements: HTMLElement[]) => {
    focusableElementsRef.current = elements;
  };

  const focusFirst = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length > 0) {
      elements[0].focus();
      currentFocusIndexRef.current = 0;
    }
  }, []);

  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length > 0) {
      const lastIndex = elements.length - 1;
      elements[lastIndex].focus();
      currentFocusIndexRef.current = lastIndex;
    }
  }, []);

  const focusNext = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length > 0) {
      const nextIndex = (currentFocusIndexRef.current + 1) % elements.length;
      elements[nextIndex].focus();
      currentFocusIndexRef.current = nextIndex;
    }
  }, []);

  const focusPrevious = useCallback(() => {
    const elements = focusableElementsRef.current;
    if (elements.length > 0) {
      const prevIndex = currentFocusIndexRef.current <= 0 
        ? elements.length - 1 
        : currentFocusIndexRef.current - 1;
      elements[prevIndex].focus();
      currentFocusIndexRef.current = prevIndex;
    }
  }, []);

  return {
    setFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
};

// Hook for focus trap (useful for modals, dropdowns)
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);
  const { setFocusableElements, focusFirst, focusLast } = useFocusManagement();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const focusableArray = Array.from(focusableElements).filter(
      el => !el.disabled && el.offsetParent !== null
    );

    setFocusableElements(focusableArray);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (focusableArray.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === focusableArray[0]) {
            e.preventDefault();
            focusLast();
          }
        } else {
          if (document.activeElement === focusableArray[focusableArray.length - 1]) {
            e.preventDefault();
            focusFirst();
          }
        }
      }

      if (e.key === 'Escape') {
        // Let parent component handle escape
        container.dispatchEvent(new CustomEvent('escape-key'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap becomes active
    if (focusableArray.length > 0) {
      focusableArray[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, focusFirst, focusLast, setFocusableElements]);

  return containerRef;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (options: {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        options.onArrowRight?.();
        break;
      case 'Enter':
        e.preventDefault();
        options.onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        options.onEscape?.();
        break;
      case ' ':
        e.preventDefault();
        options.onSpace?.();
        break;
      case 'Home':
        e.preventDefault();
        options.onHome?.();
        break;
      case 'End':
        e.preventDefault();
        options.onEnd?.();
        break;
    }
  }, [options]);

  return { handleKeyDown };
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const [announcement, setAnnouncement] = useState('');
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    
    // Clear the announcement after a brief delay to ensure it's read
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);

    // Also use the aria-live region
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;
    }
  }, []);

  const AnnouncementRegion = useCallback(() => (
    <div
      ref={announcementRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  ), [announcement]);

  return { announce, AnnouncementRegion };
};

// Hook for managing reduced motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(
    () => window.matchMedia('(prefers-contrast: high)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersHighContrast;
};

// Hook for managing skip links
export const useSkipLinks = () => {
  const skipLinksRef = useRef<Array<{ id: string; label: string }>>([]);

  const addSkipLink = useCallback((id: string, label: string) => {
    skipLinksRef.current.push({ id, label });
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    skipLinksRef.current = skipLinksRef.current.filter(link => link.id !== id);
  }, []);

  const SkipLinks = useCallback(() => (
    <div className="sr-only focus-within:not-sr-only">
      {skipLinksRef.current.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="absolute top-0 left-0 z-50 p-4 bg-primary-600 text-white text-sm font-medium focus:block"
        >
          Skip to {label}
        </a>
      ))}
    </div>
  ), []);

  return { addSkipLink, removeSkipLink, SkipLinks };
};

// Hook for form validation accessibility
export const useFormAccessibility = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { announce } = useScreenReader();

  const setFieldError = useCallback((fieldId: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [fieldId]: error }));
    announce(`Error in ${fieldId}: ${error}`, 'assertive');
  }, [announce]);

  const clearFieldError = useCallback((fieldId: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  }, []);

  const getFieldProps = useCallback((fieldId: string) => ({
    'aria-invalid': fieldErrors[fieldId] ? 'true' : 'false',
    'aria-describedby': fieldErrors[fieldId] ? `${fieldId}-error` : undefined,
  }), [fieldErrors]);

  const getErrorProps = useCallback((fieldId: string) => ({
    id: `${fieldId}-error`,
    role: 'alert',
    'aria-live': 'polite' as const,
  }), []);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    getFieldProps,
    getErrorProps,
  };
};

// Utility function to generate unique IDs for accessibility
export const useUniqueId = (prefix: string = 'id') => {
  const idRef = useRef<string>();
  
  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return idRef.current;
};

// Hook for responsive breakpoints
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setCurrentBreakpoint('2xl');
      else if (width >= 1280) setCurrentBreakpoint('xl');
      else if (width >= 1024) setCurrentBreakpoint('lg');
      else if (width >= 768) setCurrentBreakpoint('md');
      else setCurrentBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    currentBreakpoint,
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2Xl: currentBreakpoint === '2xl',
    isMobile: currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
  };
};

export default {
  useFocusManagement,
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useReducedMotion,
  useHighContrast,
  useSkipLinks,
  useFormAccessibility,
  useUniqueId,
  useBreakpoint,
};