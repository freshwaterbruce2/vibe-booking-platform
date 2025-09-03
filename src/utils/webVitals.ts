/**
 * Web Vitals Optimization and Monitoring
 * 
 * Comprehensive Core Web Vitals monitoring and optimization
 * for performance tracking and improvement
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

interface WebVitalsReport {
  lcp: WebVitalMetric | null;
  fid: WebVitalMetric | null;
  cls: WebVitalMetric | null;
  fcp: WebVitalMetric | null;
  ttfb: WebVitalMetric | null;
  timestamp: number;
  url: string;
  userAgent: string;
}

class WebVitalsMonitor {
  private metrics: Map<string, WebVitalMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'PerformanceObserver' in window;
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  /**
   * Initialize performance observers for Core Web Vitals
   */
  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
        
        if (lastEntry) {
          const metric: WebVitalMetric = {
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.getRatingForLCP(lastEntry.startTime),
            delta: lastEntry.startTime - (this.metrics.get('LCP')?.value || 0),
            id: this.generateId(),
            entries: entries as PerformanceEntry[]
          };
          
          this.metrics.set('LCP', metric);
          this.reportMetric(metric);
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[WebVitals] LCP observer failed:', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          const value = fidEntry.processingStart - fidEntry.startTime;
          
          const metric: WebVitalMetric = {
            name: 'FID',
            value,
            rating: this.getRatingForFID(value),
            delta: value - (this.metrics.get('FID')?.value || 0),
            id: this.generateId(),
            entries: [entry] as PerformanceEntry[]
          };
          
          this.metrics.set('FID', metric);
          this.reportMetric(metric);
        });
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[WebVitals] FID observer failed:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as any; // LayoutShift type not available in all browsers
          
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            clsEntries.push(entry);
          }
        });
        
        const metric: WebVitalMetric = {
          name: 'CLS',
          value: clsValue,
          rating: this.getRatingForCLS(clsValue),
          delta: clsValue - (this.metrics.get('CLS')?.value || 0),
          id: this.generateId(),
          entries: clsEntries
        };
        
        this.metrics.set('CLS', metric);
        this.reportMetric(metric);
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[WebVitals] CLS observer failed:', error);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          const metric: WebVitalMetric = {
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: this.getRatingForFCP(fcpEntry.startTime),
            delta: fcpEntry.startTime - (this.metrics.get('FCP')?.value || 0),
            id: this.generateId(),
            entries: [fcpEntry]
          };
          
          this.metrics.set('FCP', metric);
          this.reportMetric(metric);
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[WebVitals] FCP observer failed:', error);
    }
  }

  /**
   * Observe Time to First Byte
   */
  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        
        const metric: WebVitalMetric = {
          name: 'TTFB',
          value: ttfb,
          rating: this.getRatingForTTFB(ttfb),
          delta: 0,
          id: this.generateId(),
          entries: [navigationEntry]
        };
        
        this.metrics.set('TTFB', metric);
        this.reportMetric(metric);
      }
    } catch (error) {
      console.warn('[WebVitals] TTFB measurement failed:', error);
    }
  }

  /**
   * Rating functions based on Core Web Vitals thresholds
   */
  private getRatingForLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getRatingForFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getRatingForCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getRatingForFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getRatingForTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Generate unique ID for metrics
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report metric to console and external analytics
   */
  private reportMetric(metric: WebVitalMetric) {
    console.log(`[WebVitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta)
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: WebVitalMetric) {
    // Implementation would depend on your analytics service
    // Example: Google Analytics 4, Mixpanel, etc.
    try {
      if (typeof gtag !== 'undefined') {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          custom_parameter_rating: metric.rating
        });
      }
    } catch (error) {
      console.warn('[WebVitals] Failed to send to analytics:', error);
    }
  }

  /**
   * Get current metrics report
   */
  getReport(): WebVitalsReport {
    return {
      lcp: this.metrics.get('LCP') || null,
      fid: this.metrics.get('FID') || null,
      cls: this.metrics.get('CLS') || null,
      fcp: this.metrics.get('FCP') || null,
      ttfb: this.metrics.get('TTFB') || null,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const report = this.getReport();
    let score = 100;
    let totalWeights = 0;

    const weights = {
      LCP: 25,
      FID: 25,
      CLS: 25,
      FCP: 15,
      TTFB: 10
    };

    Object.entries(weights).forEach(([metricName, weight]) => {
      const metric = report[metricName.toLowerCase() as keyof WebVitalsReport] as WebVitalMetric | null;
      
      if (metric) {
        totalWeights += weight;
        
        let metricScore = 100;
        if (metric.rating === 'needs-improvement') metricScore = 70;
        if (metric.rating === 'poor') metricScore = 40;
        
        score += (metricScore - 100) * (weight / 100);
      }
    });

    return Math.max(0, Math.round(score * (totalWeights / 100)));
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const report = this.getReport();
    const suggestions: string[] = [];

    if (report.lcp && report.lcp.rating !== 'good') {
      suggestions.push(
        'Optimize Largest Contentful Paint: Optimize images, preload key resources, improve server response times'
      );
    }

    if (report.fid && report.fid.rating !== 'good') {
      suggestions.push(
        'Improve First Input Delay: Reduce JavaScript execution time, break up long tasks, use web workers'
      );
    }

    if (report.cls && report.cls.rating !== 'good') {
      suggestions.push(
        'Fix Cumulative Layout Shift: Set dimensions for images and embeds, avoid inserting content above existing content'
      );
    }

    if (report.fcp && report.fcp.rating !== 'good') {
      suggestions.push(
        'Optimize First Contentful Paint: Eliminate render-blocking resources, minify CSS, optimize fonts'
      );
    }

    if (report.ttfb && report.ttfb.rating !== 'good') {
      suggestions.push(
        'Improve Time to First Byte: Optimize server performance, use CDN, enable compression'
      );
    }

    return suggestions;
  }

  /**
   * Clean up observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Simple API for getting Web Vitals data
export const getWebVitalsData = () => {
  return {
    report: webVitalsMonitor.getReport(),
    score: webVitalsMonitor.getPerformanceScore(),
    suggestions: webVitalsMonitor.getOptimizationSuggestions()
  };
};

// Performance optimization utilities
export const optimizeWebVitals = {
  /**
   * Preload critical resources
   */
  preloadCriticalResources: (resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) link.as = 'script';
      else if (resource.endsWith('.css')) link.as = 'style';
      else if (resource.match(/\.(woff|woff2|ttf|eot)$/)) link.as = 'font';
      else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) link.as = 'image';
      
      document.head.appendChild(link);
    });
  },

  /**
   * Prevent layout shifts by setting image dimensions
   */
  preventLayoutShift: (img: HTMLImageElement) => {
    if (!img.width || !img.height) {
      img.style.aspectRatio = '16/9'; // Default aspect ratio
    }
  },

  /**
   * Optimize font loading
   */
  optimizeFontLoading: () => {
    // Preload critical fonts
    const fonts = [
      '/fonts/inter-regular.woff2',
      '/fonts/inter-semibold.woff2'
    ];
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = '';
      document.head.appendChild(link);
    });
  },

  /**
   * Lazy load non-critical resources
   */
  lazyLoadResources: (selector: string) => {
    const elements = document.querySelectorAll(selector);
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.src;
            
            if (src) {
              if (element instanceof HTMLImageElement) {
                element.src = src;
              } else if (element instanceof HTMLIFrameElement) {
                element.src = src;
              }
              
              element.removeAttribute('data-src');
              observer.unobserve(element);
            }
          }
        });
      });
      
      elements.forEach(el => observer.observe(el));
    }
  }
};