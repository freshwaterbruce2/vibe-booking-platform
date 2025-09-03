/**
 * Simple Optimized Route Definitions
 * 
 * Simplified route-based code splitting with performance optimization
 */

import { createOptimizedRoute } from '../utils/simpleCodeSplitting';

// Critical routes (loaded immediately)
export const OptimizedHomePage = createOptimizedRoute(
  () => import('../pages/HomePage').then(m => ({ default: m.HomePage })),
  'home'
);

// High priority routes
export const OptimizedSearchResultsPage = createOptimizedRoute(
  () => import('../pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })),
  'search'
);

export const OptimizedBookingPage = createOptimizedRoute(
  () => import('../pages/BookingPage'),
  'booking'
);

// Medium priority routes
export const OptimizedPaymentPage = createOptimizedRoute(
  () => import('../pages/PaymentPage').then(m => ({ default: m.PaymentPage })),
  'payment'
);

export const OptimizedDealsPage = createOptimizedRoute(
  () => import('../pages/DealsPage').then(m => ({ default: m.DealsPage })),
  'deals'
);

export const OptimizedDestinationsPage = createOptimizedRoute(
  () => import('../pages/DestinationsPage').then(m => ({ default: m.DestinationsPage })),
  'deals'
);

export const OptimizedExperiencesPage = createOptimizedRoute(
  () => import('../pages/ExperiencesPage').then(m => ({ default: m.default })),
  'deals'
);

export const OptimizedRewardsPage = createOptimizedRoute(
  () => import('../pages/RewardsPage').then(m => ({ default: m.default })),
  'deals'
);

// User routes (low priority)
export const OptimizedUserProfilePage = createOptimizedRoute(
  () => import('../pages/UserProfilePage'),
  'profile'
);

export const OptimizedBookingHistoryPage = createOptimizedRoute(
  () => import('../pages/BookingHistoryPage'),
  'profile'
);

export const OptimizedBookingConfirmationPage = createOptimizedRoute(
  () => import('../pages/BookingConfirmationPage').then(m => ({ default: m.BookingConfirmationPage })),
  'booking'
);

// Authentication routes
export const OptimizedLoginPage = createOptimizedRoute(
  () => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })),
  'profile'
);

export const OptimizedEmailVerificationPage = createOptimizedRoute(
  () => import('../pages/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })),
  'profile'
);

// Component-level optimized imports
export const LazyVirtualizedSearchResults = createOptimizedRoute(
  () => import('../components/search/VirtualizedSearchResults'),
  'search'
);

export const LazyOptimizedPaymentForm = createOptimizedRoute(
  () => import('../components/payment/OptimizedPaymentForm'),
  'payment'
);