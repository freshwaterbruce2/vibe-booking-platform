/**
 * Performance Test Suite Export
 * 
 * Re-exports the performance test suite from the setup file
 * for clean imports in test files
 */

export { performanceTestSuite, PerformanceTestSuite } from './performanceTestSetup';
export type { PerformanceMetrics, PerformanceThresholds } from './performanceTestSetup';