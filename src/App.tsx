
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HotelDetailsPage } from '@/pages/HotelDetailsPage';
import { BookingPage } from '@/pages/BookingPage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { setupGlobalErrorHandling } from '@/hooks/useErrorHandling';
import { Toaster } from 'sonner';
import { preloadCriticalComponents } from '@/utils/lazyLoader';

// Lazy-loaded route components for optimal bundle splitting
import {
  LazyHomePage,
  LazySearchResultsPage,
  LazyPaymentPage,
  LazyBookingConfirmationPage,
  LazyBookingHistoryPage,
  LazyUserProfilePage,
  LazyDealsPage,
  LazyDestinationsPage,
  LazyExperiencesPage,
  LazyRewardsPage,
} from '@/routes/LazyRoutes';

// Import new pages directly for now
import { BusinessTravelPage } from '@/pages/BusinessTravelPage';
import { ConciergePage } from '@/pages/ConciergePage';
import { SupportPage } from '@/pages/SupportPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/TermsOfServicePage';
import { AccessibilityPage } from '@/pages/AccessibilityPage';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';

function App() {
  useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Preload critical components after initial render
    const timer = setTimeout(() => {
      preloadCriticalComponents();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LazyHomePage />} />
            <Route path="/search" element={<LazySearchResultsPage />} />
            <Route path="/destinations" element={<LazyDestinationsPage />} />
            <Route path="/deals" element={<LazyDealsPage />} />
            <Route path="/experiences" element={<LazyExperiencesPage />} />
            <Route path="/rewards" element={<LazyRewardsPage />} />
            <Route path="/hotel/:id" element={<HotelDetailsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/payment" element={<LazyPaymentPage />} />
            <Route path="/confirmation/:bookingId" element={<LazyBookingConfirmationPage />} />
            <Route path="/my-bookings" element={<LazyBookingHistoryPage />} />
            <Route path="/profile" element={<LazyUserProfilePage />} />

            {/* New pages */}
            <Route path="/business" element={<BusinessTravelPage />} />
            <Route path="/concierge" element={<ConciergePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />

            {/* Authentication pages */}
            <Route path="/auth/signin" element={<SignInPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          expand={true}
          richColors={true}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;