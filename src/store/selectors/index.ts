/**
 * Store Selectors Index
 * 
 * Centralized export for all optimized store selectors
 */

// Search selectors
export * from './searchSelectors';

// Hotel selectors
export * from './hotelSelectors';

// Booking selectors
export * from './bookingSelectors';

// User selectors
export * from './userSelectors';

// Performance monitoring for selectors
export const getSelectorPerformanceMetrics = () => {
  const performance = {
    searchSelectors: {
      activeSelectors: Object.keys(require('./searchSelectors')).length,
      lastOptimized: '2024-08-30'
    },
    hotelSelectors: {
      activeSelectors: Object.keys(require('./hotelSelectors')).length,
      lastOptimized: '2024-08-30'
    },
    bookingSelectors: {
      activeSelectors: Object.keys(require('./bookingSelectors')).length,
      lastOptimized: '2024-08-30'
    },
    userSelectors: {
      activeSelectors: Object.keys(require('./userSelectors')).length,
      lastOptimized: '2024-08-30'
    }
  };
  
  const totalSelectors = Object.values(performance).reduce(
    (sum, store) => sum + store.activeSelectors, 0
  );
  
  return {
    ...performance,
    totalSelectors,
    optimizationStatus: 'Complete'
  };
};