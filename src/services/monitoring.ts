/**
 * Production-grade monitoring and observability service
 * Handles error tracking, performance monitoring, and analytics
 */

interface ErrorContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: string;
  environment: string;
  release?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private sessionId: string;
  private userId?: string;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private metricsQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInterval?: number;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
    this.setupEventListeners();
    this.startFlushInterval();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Initialize performance observer
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Initialize error boundary
    this.setupGlobalErrorHandler();

    // Initialize page visibility tracking
    this.setupVisibilityTracking();

    // Initialize network monitoring
    this.setupNetworkMonitoring();
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Unload event for last-minute data flush
    window.addEventListener('beforeunload', () => {
      this.flushQueues(true);
    });
  }

  private setupPerformanceObserver(): void {
    // Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.trackMetric('LCP', entry.startTime, 'ms', {
            element: (entry as any).element?.tagName,
          });
        } else if (entry.entryType === 'first-input') {
          const firstInput = entry as PerformanceEventTiming;
          this.trackMetric('FID', firstInput.processingStart - firstInput.startTime, 'ms');
        } else if (entry.entryType === 'layout-shift') {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            this.trackMetric('CLS', layoutShift.value, 'score', {
              sources: layoutShift.sources?.length || 0,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Navigation timing
    if (performance.getEntriesByType('navigation').length > 0) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.trackMetric('PageLoadTime', navigation.loadEventEnd - navigation.fetchStart, 'ms');
      this.trackMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
      this.trackMetric('TTFB', navigation.responseStart - navigation.fetchStart, 'ms');
    }
  }

  private setupGlobalErrorHandler(): void {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          source: 'unhandledrejection',
          promise: event.promise,
        }
      );
    });
  }

  private setupVisibilityTracking(): void {
    let startTime = Date.now();
    let totalVisible = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        totalVisible += Date.now() - startTime;
        this.trackMetric('PageVisibleTime', totalVisible, 'ms');
      } else {
        startTime = Date.now();
      }
    });
  }

  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.trackMetric('NetworkRTT', connection.rtt || 0, 'ms');
      this.trackMetric('NetworkDownlink', connection.downlink || 0, 'Mbps');
      
      connection.addEventListener('change', () => {
        this.trackMetric('NetworkRTT', connection.rtt || 0, 'ms');
        this.trackMetric('NetworkDownlink', connection.downlink || 0, 'Mbps');
      });
    }
  }

  // Public API

  setUser(userId: string): void {
    this.userId = userId;
  }

  captureError(error: Error, additionalContext?: Record<string, any>): void {
    const context: ErrorContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,
      tags: {
        browser: this.getBrowserInfo(),
        os: this.getOSInfo(),
      },
      extra: {
        ...additionalContext,
        stackTrace: error.stack,
        message: error.message,
        name: error.name,
      },
    };

    this.errorQueue.push({ error, context });

    // Immediate send for critical errors
    if (error.name === 'SecurityError' || error.message.includes('payment')) {
      this.flushErrors();
    }
  }

  trackMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      tags: {
        ...tags,
        page: window.location.pathname,
        sessionId: this.sessionId,
      },
    };

    this.metricsQueue.push(metric);
  }

  trackUserAction(action: UserAction): void {
    // Track user interactions
    const enrichedAction = {
      ...action,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: window.location.pathname,
    };

    // Send to analytics service
    this.sendAnalytics('user_action', enrichedAction);
  }

  trackPageView(pageName?: string): void {
    const pageData = {
      page: pageName || window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.sendAnalytics('page_view', pageData);
  }

  private startFlushInterval(): void {
    // Flush queues every 30 seconds
    this.flushInterval = window.setInterval(() => {
      this.flushQueues();
    }, 30000);
  }

  private flushQueues(forceSend = false): void {
    if (this.isOnline || forceSend) {
      this.flushErrors();
      this.flushMetrics();
    }
  }

  private flushErrors(): void {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    // Send to error tracking service (e.g., Sentry)
    if (forceSend) {
      // Use sendBeacon for reliability
      navigator.sendBeacon('/api/errors', JSON.stringify(errors));
    } else {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errors),
      }).catch((err) => {
        // Re-queue on failure
        this.errorQueue.unshift(...errors);
      });
    }
  }

  private flushMetrics(): void {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    // Send to metrics service
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    }).catch((err) => {
      // Re-queue on failure
      this.metricsQueue.unshift(...metrics);
    });
  }

  private sendAnalytics(event: string, data: any): void {
    // Send to analytics service
    if (this.isOnline) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      }).catch(() => {
        // Silently fail for analytics
      });
    }
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // Resource timing API
  trackResourceTiming(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach((resource) => {
      if (resource.initiatorType === 'xmlhttprequest' || resource.initiatorType === 'fetch') {
        this.trackMetric('APIResponseTime', resource.duration, 'ms', {
          endpoint: new URL(resource.name).pathname,
          method: resource.initiatorType,
        });
      }
    });
  }

  // Custom timing API
  startTiming(name: string): void {
    performance.mark(`${name}-start`);
  }

  endTiming(name: string): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      this.trackMetric(name, measure.duration, 'ms');
    }
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushQueues(true);
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// React Error Boundary Helper
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    monitoring.captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}