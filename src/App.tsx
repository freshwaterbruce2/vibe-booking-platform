
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { HotelDetailsPage } from '@/pages/HotelDetailsPage';
import { BookingPage } from '@/pages/BookingPage';
import { SearchResultsPage } from '@/pages/SearchResultsPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { setupGlobalErrorHandling } from '@/hooks/useErrorHandling';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/hotel/:id" element={<HotelDetailsPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/confirmation/:bookingId" element={<BookingConfirmationPage />} />
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