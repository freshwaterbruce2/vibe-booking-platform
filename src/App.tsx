
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HotelDetailsPage } from '@/pages/HotelDetailsPage';
import { BookingPage } from '@/pages/BookingPage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { setupGlobalErrorHandling } from '@/hooks/useErrorHandling';
import { Toaster } from 'sonner';
import { preloadCriticalComponents } from '@/utils/lazyLoader';

// Lazy-loaded route components for optimal bundle splitting
import {
  LazyHomePage,
  LazySearchResultsPage,
  LazyPaymentPage,
  LazyBookingConfirmationPage,
  LazyDealsPage,
  LazyDestinationsPage,
  LazyExperiencesPage,
  LazyRewardsPage,
} from '@/routes/LazyRoutes';

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
    </ErrorBoundary>
  );
}

export default App;