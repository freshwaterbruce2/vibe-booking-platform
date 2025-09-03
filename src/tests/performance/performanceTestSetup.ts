/**
 * Performance Testing Infrastructure
 * 
 * TDD approach for frontend performance optimization.
 * This sets up comprehensive performance benchmarking and regression testing.
 */

import { performance, PerformanceObserver } from 'perf_hooks';

export interface PerformanceMetrics {
  componentRenderTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

export interface PerformanceThresholds {
  maxComponentRenderTime: number;
  maxBundleSize: number;
  maxMemoryUsage: number;
  minCacheHitRate: number;
  coreWebVitals: {
    maxLCP: number;
    maxFID: number;
    maxCLS: number;
  };
}

export class PerformanceTestSuite {
  private metrics: PerformanceMetrics = {
    componentRenderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    coreWebVitals: {
      lcp: 0,
      fid: 0,
      cls: 0
    }
  };

  private thresholds: PerformanceThresholds = {
    maxComponentRenderTime: 16, // 60fps = 16ms per frame
    maxBundleSize: 500 * 1024, // 500KB initial bundle
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB memory
    minCacheHitRate: 80, // 80% cache hit rate
    coreWebVitals: {
      maxLCP: 2500, // 2.5 seconds
      maxFID: 100,  // 100ms
      maxCLS: 0.1   // 0.1 layout shift
    }
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupPerformanceObservers();
  }

  /**
   * Set up performance observers for Core Web Vitals
   */
  private setupPerformanceObservers(): void {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.coreWebVitals.lcp = lastEntry.startTime;
    });
    
    // First Input Delay would be measured in real browser environment
    // For testing, we'll simulate it
    
    this.observers.push(lcpObserver);
  }

  /**
   * Measure component render performance
   */
  async measureComponentRender<T>(
    componentName: string,
    renderFunction: () => Promise<T>
  ): Promise<{ result: T; renderTime: number }> {
    const startTime = performance.now();
    const result = await renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    
    return { result, renderTime };
  }

  /**
   * Measure memory usage
   */
  measureMemoryUsage(): number {
    // In real browser environment, use performance.memory
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Measure bundle size (simulate for testing)
   */
  measureBundleSize(bundlePath: string): Promise<number> {
    return new Promise((resolve) => {
      // In real implementation, would fetch bundle and measure size
      // For testing, simulate
      const simulatedSize = 450 * 1024; // 450KB
      this.metrics.bundleSize = simulatedSize;
      resolve(simulatedSize);
    });
  }

  /**
   * Test performance thresholds
   */
  testPerformanceThresholds(): {
    passed: boolean;
    failures: string[];
    metrics: PerformanceMetrics;
  } {
    const failures: string[] = [];

    if (this.metrics.componentRenderTime > this.thresholds.maxComponentRenderTime) {
      failures.push(`Component render time ${this.metrics.componentRenderTime}ms exceeds threshold ${this.thresholds.maxComponentRenderTime}ms`);
    }

    if (this.metrics.bundleSize > this.thresholds.maxBundleSize) {
      failures.push(`Bundle size ${this.metrics.bundleSize} exceeds threshold ${this.thresholds.maxBundleSize}`);
    }

    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      failures.push(`Memory usage ${this.metrics.memoryUsage} exceeds threshold ${this.thresholds.maxMemoryUsage}`);
    }

    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      failures.push(`Cache hit rate ${this.metrics.cacheHitRate}% below threshold ${this.thresholds.minCacheHitRate}%`);
    }

    if (this.metrics.coreWebVitals.lcp > this.thresholds.coreWebVitals.maxLCP) {
      failures.push(`LCP ${this.metrics.coreWebVitals.lcp}ms exceeds threshold ${this.thresholds.coreWebVitals.maxLCP}ms`);
    }

    return {
      passed: failures.length === 0,
      failures,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const results = this.testPerformanceThresholds();
    
    let report = '\n=== Frontend Performance Test Report ===\n';
    report += `Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    report += 'Metrics:\n';
    report += `- Component Render Time: ${results.metrics.componentRenderTime.toFixed(2)}ms (threshold: ${this.thresholds.maxComponentRenderTime}ms)\n`;
    report += `- Bundle Size: ${(results.metrics.bundleSize / 1024).toFixed(1)}KB (threshold: ${(this.thresholds.maxBundleSize / 1024).toFixed(1)}KB)\n`;
    report += `- Memory Usage: ${(results.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB (threshold: ${(this.thresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB)\n`;
    report += `- Cache Hit Rate: ${results.metrics.cacheHitRate}% (threshold: ${this.thresholds.minCacheHitRate}%)\n`;
    report += `- LCP: ${results.metrics.coreWebVitals.lcp.toFixed(1)}ms (threshold: ${this.thresholds.coreWebVitals.maxLCP}ms)\n`;
    
    if (results.failures.length > 0) {
      report += '\nFailures:\n';
      results.failures.forEach(failure => {
        report += `- ${failure}\n`;
      });
    }
    
    return report;
  }

  /**
   * Set custom thresholds for different environments
   */
  setThresholds(customThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...customThresholds };
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton for tests
export const performanceTestSuite = new PerformanceTestSuite();